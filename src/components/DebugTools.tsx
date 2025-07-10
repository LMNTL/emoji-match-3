import React from "react";
import type { GameStats } from "../types.ts";
import "./DebugTools.css";

interface DebugToolsProps {
  addScore: (number) => void;
  toggleTimerPause: () => void;
  stats: GameStats;
}

const DebugTools: React.FC<DebugToolsProps> = ({
  addScore,
  stats,
  toggleTimerPause,
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
      <button onClick={toggleTimerPause}>Pause/unpause timer</button>
    </div>
  );
};

export default DebugTools;
