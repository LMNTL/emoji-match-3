import { useEffect, useRef, useState } from "react";
import "./App.css";
import Grid from "./grid.js";
import GameGrid from "./GameGrid";
import ScoreDisplay from "./ScoreDisplay";
import StageDisplay from "./components/StageDisplay";
import StatsDisplay from "./components/StatsDisplay";
import VictoryAnimation from "./components/VictoryAnimation";
import FeatureTooltip from "./components/FeatureTooltip";
import { StageManager } from "./StageManager";
import type { GameStats } from "./types";
import { randInMap, createStageBasedRandInMap } from "./emojiMap.js";
import { clsx } from "clsx";
import DebugTools from "./components/DebugTools.tsx";

const isDev = process?.env?.NODE_ENV === "development";

function App({ length }) {
  const [isLoading, setIsLoading] = useState(true);
  const [grid, setGrid] = useState(new Grid(length, length, randInMap));
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    time: 0,
    matches: 0,
  });
  const [isGridBlocked, setIsGridBlocked] = useState(true);
  const [selected, setSelected] = useState("");
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const [showVictory, setShowVictory] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [seenFeatures, setSeenFeatures] = useState<Set<string>>(new Set());
  const [currentStage, setCurrentStage] = useState(
    StageManager.getCurrentStage(0),
  );
  const workerRef = useRef(null);

  const handleEsc = (event) => {
    if (event.key === "Escape") {
      clearSelection();
      if (showStats) {
        handleStatsContinue();
      }
      if (showTooltip) {
        setShowTooltip(null);
      }
    }
  };

  // Handle escape key
  useEffect(() => {
    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [showStats, showTooltip]);

  // Stage progression check
  useEffect(() => {
    if (
      StageManager.isStageBeaten(stats.score, currentStage.stage) &&
      !showStats &&
      !showVictory
    ) {
      setShowVictory(true);
      setCurrentStage(StageManager.getNextStage(currentStage.stage));
      setStats((prev) => ({
        ...prev,
        time: Math.floor((Date.now() - gameStartTime) / 1000),
      }));
    }
  }, [stats.score, showStats, showVictory]);

  // Check for new features to show tooltips
  useEffect(() => {
    // Show tooltip *after* victory/stats screens
    if (showVictory || showStats) {
      return;
    }
    if (currentStage.stage >= 3 && !seenFeatures.has("wildcards")) {
      setShowTooltip("wildcards");
      setIsGridBlocked(true);
      setSeenFeatures((prev) => new Set(prev).add("wildcards"));
    } else if (currentStage.stage >= 6 && !seenFeatures.has("rockets")) {
      setShowTooltip("rockets");
      setIsGridBlocked(true);
      setSeenFeatures((prev) => new Set(prev).add("rockets"));
    }
  }, [currentStage.stage, showVictory, showStats, seenFeatures]);

  useEffect(() => {
    generateNonmatchingGridAsync();
    return () => {
      workerRef.current?.terminate();
    };
  }, [currentStage.stage]); // Regenerate grid when stage changes

  const generateNonmatchingGridAsync = async () => {
    setIsLoading(true);
    setIsGridBlocked(true);

    // Create web worker
    const worker = new Worker(new URL("./gridWorker.js", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    worker.postMessage({ length, stage: currentStage.stage });

    worker.onmessage = (e) => {
      const { gridData } = e.data;
      const newGrid = new Grid(length, length, (x, y) => gridData[x][y]);
      setGridAndStart(newGrid);
    };

    worker.onerror = (error) => {
      console.error("Worker error:", error);
      // Fallback to synchronous generation
      const stageBasedRandInMap = createStageBasedRandInMap(currentStage.stage);
      const startGrid = generateNonmatchingGrid(grid, stageBasedRandInMap);
      setGridAndStart(startGrid);
      worker.terminate();
    };
  };

  const setGridAndStart = (grid) => {
    setGrid(grid);
    setIsLoading(false);
    setIsGridBlocked(false);
    setGameStartTime(Date.now());
  };

  const generateNonmatchingGrid = (startGrid = null, randFunc = randInMap) => {
    let matches = [];
    let tempGrid;
    if (startGrid) {
      tempGrid = startGrid.clone();
    } else {
      tempGrid = new Grid(length, length, randFunc);
    }
    matches = tempGrid.findMatches();
    while (matches.length) {
      tempGrid = new Grid(length, length, randFunc);
      matches = tempGrid.findMatches();
    }
    return tempGrid;
  };

  const addScore = (addedScore: number) => {
    setStats((prev) => ({
      ...prev,
      score: prev.score + addedScore,
      matches: prev.matches + 1,
    }));
  };

  const clearSelection = () => {
    setSelected("");
  };

  const handleVictoryComplete = () => {
    setShowVictory(false);
    setShowStats(true);
    setIsGridBlocked(false);
  };

  const handleStatsContinue = () => {
    setShowStats(false);
    setGameStartTime(Date.now()); // Reset timer for new stage
    setStats((prevStats) => {
      return { ...prevStats, score: 0, matches: 0 };
    });
  };

  const handleTooltipClose = () => {
    setShowTooltip(null);
    if (!isLoading) {
      setIsGridBlocked(false);
    }
  };

  return (
    <div
      className={clsx(
        "page",
        StageManager.getBackgroundColorClass(currentStage.stage),
        { frozen: showStats || showVictory || showTooltip },
      )}
      onClick={clearSelection}
    >
      {isDev && <DebugTools addScore={addScore} stats={stats} />}
      <StageDisplay stats={stats} currentStage={currentStage}>
        <ScoreDisplay score={stats.score} />
      </StageDisplay>

      {isLoading ? (
        <div className="loader" />
      ) : (
        <GameGrid
          grid={grid}
          setGrid={setGrid}
          isGridBlocked={isGridBlocked}
          setIsGridBlocked={setIsGridBlocked}
          addScore={addScore}
          selected={selected}
          setSelected={setSelected}
          currentStage={currentStage.stage}
        />
      )}

      {showVictory && (
        <VictoryAnimation
          stageNumber={currentStage.stage}
          onComplete={handleVictoryComplete}
        />
      )}
      {showStats && (
        <StatsDisplay
          stats={stats}
          stage={currentStage.stage}
          onContinue={handleStatsContinue}
        />
      )}
      {showTooltip && (
        <FeatureTooltip feature={showTooltip} onClose={handleTooltipClose} />
      )}
    </div>
  );
}

export default App;
