import { useEffect, useRef, useState } from "react";
import "./App.css";
import Grid from "./grid.js";
import GameGrid from "./GameGrid";
import ScoreDisplay from "./ScoreDisplay";
import StageDisplay from "./components/StageDisplay";
import StatsDisplay from "./components/StatsDisplay";
import VictoryAnimation from "./components/VictoryAnimation";
import FeatureTooltip from "./components/FeatureTooltip";
import { SoundEvent, SoundSystem, SoundType } from "./components/SoundSystem";
import { StageManager } from "./StageManager";
import type { GameStats } from "./types";
import { randInMap, createStageBasedRandInMap } from "./emojiMap.js";
import { clsx } from "clsx";
import DebugTools from "./components/DebugTools.tsx";
import TitleScreen from "./components/TitleScreen";
import GameOverScreen from "./components/GameOverScreen";
import TimerBar from "./components/TimerBar";

const isDev = import.meta.env.MODE === "development";

const MAX_TIME = 30;

type GameMode = "title" | "casual" | "timed" | "highscores";

function App({ length }) {
  const [gameMode, setGameMode] = useState<GameMode>("title");
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
  const [timeRemaining, setTimeRemaining] = useState(MAX_TIME);
  const [showGameOver, setShowGameOver] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const workerRef = useRef(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const firstMountRef = useRef(true);

  const handleEsc = (event) => {
    if (event.key === "Escape") {
      clearSelection();
      if (showStats) {
        handleStatsContinue();
      }
      if (showTooltip) {
        setShowTooltip(null);
      }
      if (showGameOver) {
        handleGameOverContinue();
      }
    }
  };

  useEffect(() => {
    if (gameMode === "title") {
      if (firstMountRef.current) {
        firstMountRef.current = false;
      } else {
        // Play title music when component mounts
        const titleMusicEvent = new SoundEvent(SoundType.TITLE_MUSIC);
        window.dispatchEvent(titleMusicEvent);
      }
    }
  }, [gameMode]);

  // Handle escape key
  useEffect(() => {
    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [showStats, showTooltip, showGameOver]);

  // Timer logic for timed mode
  useEffect(() => {
    if (
      gameMode === "timed" &&
      !isTimerPaused &&
      !isGridBlocked &&
      !showVictory &&
      !showStats &&
      !showTooltip &&
      !showGameOver
    ) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Play game over sound
            const gameOverEvent = new SoundEvent(SoundType.GAME_OVER);
            window.dispatchEvent(gameOverEvent);
            setShowGameOver(true);
            setIsGridBlocked(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [
    gameMode,
    isTimerPaused,
    isGridBlocked,
    showVictory,
    showStats,
    showTooltip,
    showGameOver,
  ]);

  // Stage progression check
  useEffect(() => {
    if (
      !showStats &&
      !showVictory &&
      !isGridBlocked &&
      StageManager.isStageBeaten(stats.score, currentStage.stage)
    ) {
      const matchEvent = new SoundEvent(SoundType.VICTORY);
      window.dispatchEvent(matchEvent);
      setShowVictory(true);
      setCurrentStage(StageManager.getNextStage(currentStage.stage));
      setStats((prev) => ({
        ...prev,
        time: Math.floor((Date.now() - gameStartTime) / 1000),
      }));
    }
  }, [stats.score, showStats, showVictory, isGridBlocked]);

  const unlockFeature = (type) => {
    // Play feature unlock sound
    const featureUnlockEvent = new SoundEvent(SoundType.FEATURE_UNLOCK);
    window.dispatchEvent(featureUnlockEvent);
    setShowTooltip(type);
    setIsGridBlocked(true);
    setSeenFeatures((prev) => new Set(prev).add(type));
  };

  useEffect(() => {
    // Show tooltip *after* victory/stats screens
    if (showVictory || showStats) {
      return;
    }
    if (currentStage.stage >= 3 && !seenFeatures.has("wildcards")) {
      unlockFeature("wildcards");
    } else if (currentStage.stage >= 6 && !seenFeatures.has("rockets")) {
      unlockFeature("rockets");
    } else if (currentStage.stage >= 9 && !seenFeatures.has("rocks")) {
      unlockFeature("rocks");
    }
  }, [currentStage.stage, showVictory, showStats, seenFeatures]);

  useEffect(() => {
    generateNonmatchingGridAsync();
    return () => {
      workerRef.current?.terminate();
    };
  }, [currentStage.stage]); // Regenerate grid when stage changes or mode changes

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

    // In timed mode, add time bonus for matches
    if (gameMode === "timed") {
      const timeBonus = Math.min(5, Math.ceil(addedScore / 50)); // Up to 5 seconds bonus
      setTimeRemaining((prev) => Math.min(MAX_TIME, prev + timeBonus)); // Cap at 60 seconds
    }
  };

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    setStats({ score: 0, time: 0, matches: 0 });
    setCurrentStage(StageManager.getCurrentStage(0));
    setSeenFeatures(new Set());
    setShowVictory(false);
    setShowStats(false);
    setShowGameOver(false);
    setShowTooltip(null);
    setSelected("");

    if (mode === "timed") {
      setTimeRemaining(30);
    }

    setGameStartTime(Date.now());
  };

  const handleGameOverContinue = () => {
    setShowGameOver(false);
    setGameMode("title");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const restartGame = () => {
    generateNonmatchingGridAsync();
    setShowGameOver(false);
    setTimeRemaining(MAX_TIME);
  };

  const clearSelection = () => {
    setSelected("");
  };

  const handleVictoryComplete = () => {
    setShowVictory(false);
    setShowStats(true);
    setIsGridBlocked(false);
  };

  const handleTooltipClose = () => {
    setShowTooltip(null);
    if (!isLoading) {
      setIsGridBlocked(false);
    }
  };

  const handleStatsContinue = () => {
    setShowStats(false);
    setGameStartTime(Date.now()); // Reset timer for new stage
    setStats((prevStats) => {
      return { ...prevStats, score: 0, matches: 0 };
    });

    // Reset timer for timed mode
    if (gameMode === "timed") {
      setTimeRemaining(30);
    }
  };

  if (gameMode === "title") {
    return (
      <div className="page">
        <SoundSystem />
        <TitleScreen onModeSelect={startGame} />
      </div>
    );
  }

  if (gameMode === "highscores") {
    return (
      <div className="page">
        <SoundSystem />
        <div className="high-scores-screen">
          <h1>High Scores</h1>
          <p>Coming soon...</p>
          <button onClick={() => setGameMode("title")}>Back to Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "page",
        StageManager.getBackgroundColorClass(currentStage.stage),
        { frozen: showStats || showVictory || showTooltip || showGameOver },
      )}
      onClick={clearSelection}
    >
      <SoundSystem />
      {isDev && (
        <DebugTools
          addScore={addScore}
          toggleTimerPause={() => setIsTimerPaused(!isTimerPaused)}
          stats={stats}
        />
      )}

      {gameMode === "timed" && (
        <TimerBar timeRemaining={timeRemaining} maxTime={MAX_TIME} />
      )}

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
      {showGameOver && (
        <GameOverScreen
          stats={stats}
          onContinue={handleGameOverContinue}
          onRestart={restartGame}
        />
      )}
    </div>
  );
}

export default App;
