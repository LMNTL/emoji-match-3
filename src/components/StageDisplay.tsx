import React from "react";
import type { StageConfig, GameStats } from "../types";
import { StageManager } from "../StageManager";
import "./StageDisplay.css";

interface StageDisplayProps {
  stats: GameStats;
  currentStage: StageConfig;
  children: React.ReactNode;
}

const StageDisplay: React.FC<StageDisplayProps> = ({
  stats,
  currentStage,
  children,
}) => {
  const progress = StageManager.getProgress(stats.score, currentStage);
  const nextStage = StageManager.getNextStage(currentStage.stage);

  return (
    <div className="stage-display">
      <div className="stage-info">
        <h3>
          Stage {currentStage.stage}: {currentStage.name}
        </h3>
        <p>{currentStage.description}</p>
      </div>
      {children}
      <div className="progress-text">
        {currentStage.targetScore} to {nextStage.name}
      </div>
      {nextStage && (
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StageDisplay;
