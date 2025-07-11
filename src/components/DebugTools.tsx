import React from "react";
import type { GameStats } from "../types.ts";
import "./DebugTools.css";
import type { GameMode } from "../App.tsx";

interface DebugToolsProps {
  addScore: (number) => void;
  toggleTimerPause: () => void;
  stats: GameStats;
  isPaused: boolean;
  timeUp: () => void;
  gameMode: GameMode;
}

const DebugTools: React.FC<DebugToolsProps> = ({
  addScore,
  stats,
  toggleTimerPause,
  isPaused,
  timeUp,
  gameMode,
}) => {
  const plus1k = () => {
    addScore(1000);
  };

  const plus10k = () => {
    addScore(10000);
  };

  const zeroScore = () => {
    addScore(-1 * stats.score);
  };
  return (
    <div className="debug-panel">
      <button onClick={plus1k}>+1,000 score</button>
      <button onClick={plus10k}>+10,000 score</button>
      <button onClick={zeroScore}>Set score to zero</button>
      {gameMode === "timed" && (
        <>
          <button onClick={toggleTimerPause}>
            {isPaused ? "Unpause" : "Pause"} timer
          </button>
          <button onClick={timeUp}>Remove all time</button>
        </>
      )}
    </div>
  );
};

export default DebugTools;
