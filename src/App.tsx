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
import { randInMap, createStageBasedRandInMap } from "./emojiMap.js";
import { clsx } from "clsx";
import DebugTools from "./components/DebugTools.tsx";
import TitleScreen from "./components/TitleScreen";
import GameOverScreen from "./components/GameOverScreen";
import TimerBar from "./components/TimerBar";
import { useHighScores } from "./hooks/useHighScores.ts";
import { useGameStats } from "./hooks/useGameStats.ts";
import { useGameTimer } from "./hooks/useGameTimer.ts";
import HighScoresScreen from "./components/HighScoresScreen.tsx";
import HighScoreEntry from "./components/HighScoreEntry.tsx";

const isDev = import.meta.env.MODE === "development";

const MAX_TIME = 30;

export type GameMode = "title" | "casual" | "timed" | "highscores";

function App({ length }) {
  const [gameMode, setGameMode] = useState<GameMode>("title");
  const [isLoading, setIsLoading] = useState(true);
  const [grid, setGrid] = useState(new Grid(length, length, randInMap));
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
  const [showGameOver, setShowGameOver] = useState(false);
  const [showHighScoreEntry, setShowHighScoreEntry] = useState(false);
  const workerRef = useRef(null);
  const firstMountRef = useRef(true);

  const {
    stats,
    cumulativeScore,
    addScore,
    resetStageStats,
    resetAllStats,
    updateTime,
  } = useGameStats();
  const { highScores, addHighScore, isHighScore } = useHighScores();

  const handleTimeUp = () => {
    setShowGameOver(true);
    setIsGridBlocked(true);
  };

  const { timeRemaining, isPaused, resetTimer, addTime, togglePause } =
    useGameTimer(
      MAX_TIME,
      gameMode === "timed" &&
        !isGridBlocked &&
        !showVictory &&
        !showStats &&
        !showTooltip &&
        !showGameOver,
      handleTimeUp,
    );

  const enhancedAddScore = (addedScore: number) => {
    addScore(addedScore);

    if (gameMode === "timed") {
      const timeBonus = Math.min(5, Math.ceil(addedScore / 50));
      addTime(timeBonus);
    }
  };

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
      updateTime(gameStartTime);
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

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    resetAllStats();
    setCurrentStage(StageManager.getCurrentStage(0));
    setSeenFeatures(new Set());
    setShowVictory(false);
    setShowStats(false);
    setShowGameOver(false);
    setShowHighScoreEntry(false);
    setShowTooltip(null);
    setSelected("");

    if (mode === "timed") {
      resetTimer();
    }

    setGameStartTime(Date.now());
  };

  const handleGameOverContinue = () => {
    if (isHighScore(cumulativeScore)) {
      setShowHighScoreEntry(true);
      setShowGameOver(false);
    } else {
      setShowGameOver(false);
      setGameMode("title");
    }
  };

  const handleHighScoreSubmit = (name: string) => {
    addHighScore(name, cumulativeScore, currentStage.stage);
    setShowHighScoreEntry(false);
    setShowGameOver(false);
    setGameMode("title");
  };

  const handleHighScoreSkip = () => {
    setShowHighScoreEntry(false);
    setShowGameOver(false);
    setGameMode("title");
  };

  const restartGame = () => {
    generateNonmatchingGridAsync();
    setShowGameOver(false);
    resetTimer();
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
    setGameStartTime(Date.now());
    resetStageStats();

    if (gameMode === "timed") {
      resetTimer();
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
        <HighScoresScreen
          highScores={highScores}
          onBack={() => setGameMode("title")}
        />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "page",
        StageManager.getBackgroundColorClass(currentStage.stage),
        {
          frozen:
            showStats ||
            showVictory ||
            showTooltip ||
            showGameOver ||
            showHighScoreEntry,
        },
      )}
      onClick={() => setSelected("")}
    >
      <SoundSystem />
      {isDev && (
        <DebugTools
          addScore={enhancedAddScore}
          toggleTimerPause={togglePause}
          stats={stats}
          isPaused={isPaused}
          gameMode={gameMode}
          timeUp={() => addTime(-1 * MAX_TIME)}
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
          cumulativeScore={cumulativeScore}
          currentStage={currentStage.stage}
          onContinue={handleGameOverContinue}
          onRestart={restartGame}
          isHighScore={isHighScore(cumulativeScore)}
        />
      )}

      {showHighScoreEntry && (
        <HighScoreEntry
          score={cumulativeScore}
          stage={currentStage.stage}
          onSubmit={handleHighScoreSubmit}
          onSkip={handleHighScoreSkip}
        />
      )}
    </div>
  );
}

export default App;
