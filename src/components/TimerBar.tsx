import React from "react";
import "./TimerBar.css";

interface TimerBarProps {
  timeRemaining: number;
  maxTime: number;
}

const TimerBar: React.FC<TimerBarProps> = ({ timeRemaining, maxTime }) => {
  const percentage = (timeRemaining / maxTime) * 100;
  const isLow = percentage < 40;
  const isCritical = percentage < 25;

  return (
    <div className="timer-container">
      <div className="timer-label">Time: {timeRemaining}s</div>
      <div className="timer-bar-background">
        <div
          className={`timer-bar-fill ${isLow ? "low" : ""} ${isCritical ? "critical" : ""}`}
          style={{ height: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default TimerBar;
