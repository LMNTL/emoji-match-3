import React from "react";
import type { StageConfig } from "../types";
import "./StageDisplay.css";

interface StageDisplayProps {
  currentStage: StageConfig;
}

const StageDisplay: React.FC<StageDisplayProps> = ({ currentStage }) => {
  return (
    <div className="stage-display">
      <div className="stage-info">
        <h3>
          Stage {currentStage.stage}: {currentStage.name}
        </h3>
        <p>{currentStage.description}</p>
      </div>
    </div>
  );
};

export default StageDisplay;
