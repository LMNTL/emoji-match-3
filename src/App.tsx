import { useEffect, useMemo, useState } from "react";
import "./App.css";
import Grid from "./grid.js";
import GameGrid from "./GameGrid";
import ScoreDisplay from "./ScoreDisplay";
import StageDisplay from "./components/StageDisplay";
import StatsDisplay from "./components/StatsDisplay";
import VictoryAnimation from "./components/VictoryAnimation";
import { StageManager } from "./StageManager";
import type { GameStats } from "./types";
import { randInMap } from "./emojiMap.js";
import { clsx } from "clsx";

function App({ length }) {
  const [isLoading, setIsLoading] = useState(true);
  const [grid, setGrid] = useState(new Grid(length, length, randInMap));
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    time: 0,
    matches: 0,
    stage: 1,
  });
  const [isGridBlocked, setIsGridBlocked] = useState(true);
  const [selected, setSelected] = useState("");
  const [scoreIncrease, setScoreIncrease] = useState(0);
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const [showVictory, setShowVictory] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [currentStage, setCurrentStage] = useState(
    StageManager.getCurrentStage(0),
  );

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isGridBlocked && !showVictory && !showStats) {
        setStats((prev) => ({
          ...prev,
          time: Math.floor((Date.now() - gameStartTime) / 1000),
        }));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isGridBlocked, showVictory, showStats, gameStartTime]);

  const handleEsc = (event) => {
    if (event.key === "Escape") {
      clearSelection();
      if (showStats) {
        handleStatsContinue();
      }
    }
  };

  // Handle escape key
  useEffect(() => {
    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [showStats]);

  // Stage progression check
  useEffect(() => {
    const newStage = StageManager.getCurrentStage(stats.score);
    if (newStage.stage > currentStage.stage && !isGridBlocked) {
      setShowVictory(true);
      setCurrentStage(StageManager.getNextStage(currentStage.stage));
      setStats((prev) => ({
        ...prev,
        time: Math.floor((Date.now() - gameStartTime) / 1000),
      }));
    }
  }, [stats.score, isGridBlocked]);

  useEffect(() => {
    generateNonmatchingGridAsync();
  }, []);

  const generateNonmatchingGridAsync = async () => {
    setIsLoading(true);
    setIsGridBlocked(true);

    // Create web worker
    const worker = new Worker(new URL("./gridWorker.js", import.meta.url), {
      type: "module",
    });

    worker.postMessage({ length });

    worker.onmessage = (e) => {
      const { gridData } = e.data;
      const newGrid = new Grid(length, length, (x, y) => gridData[x][y]);
      setGrid(newGrid);
      setIsLoading(false);
      setIsGridBlocked(false);
      setGameStartTime(Date.now());
      worker.terminate();
    };

    worker.onerror = (error) => {
      console.error("Worker error:", error);
      // Fallback to synchronous generation
      const startGrid = generateNonmatchingGrid(grid);
      setGrid(startGrid);
      setIsLoading(false);
      setIsGridBlocked(false);
      setGameStartTime(Date.now());
      worker.terminate();
    };
  };

  const generateNonmatchingGrid = (startGrid = null) => {
    let matches = [];
    let tempGrid;
    if (startGrid) {
      tempGrid = startGrid.clone();
    } else {
      tempGrid = new Grid(length, length, randInMap);
    }
    matches = tempGrid.findMatches();
    while (matches.length) {
      tempGrid = new Grid(length, length, randInMap);
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
    setScoreIncrease(addedScore);
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

  return (
    <div
      className={clsx("page", { frozen: showStats || showVictory })}
      onClick={clearSelection}
    >
      <StageDisplay stats={stats} currentStage={currentStage}>
        <ScoreDisplay
          score={stats.score}
          scoreIncrease={scoreIncrease}
          onScoreIncreaseComplete={() => setScoreIncrease(0)}
        />
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
        />
      )}

      {showVictory && (
        <VictoryAnimation
          stageNumber={currentStage.stage}
          onComplete={handleVictoryComplete}
        />
      )}
      {showStats && (
        <StatsDisplay stats={stats} onContinue={handleStatsContinue} />
      )}
    </div>
  );
}

export default App;
