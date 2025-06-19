import React from "react";
import type { GameStats } from "../types";
import "./StatsDisplay.css";

interface StatsDisplayProps {
  stats: GameStats;
  onContinue: () => void;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ stats, onContinue }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="stats-overlay">
      <div className="stats-modal">
        <h2>Stage {stats.stage} Complete!</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Score</span>
            <span className="stat-value">{stats.score.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Time</span>
            <span className="stat-value">{formatTime(stats.time)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Matches</span>
            <span className="stat-value">{stats.matches}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Avg Score/Match</span>
            <span className="stat-value">
              {stats.matches > 0 ? Math.round(stats.score / stats.matches) : 0}
            </span>
          </div>
        </div>
        <button className="continue-button" onClick={onContinue}>
          Continue to Next Stage
        </button>
      </div>
    </div>
  );
};

export default StatsDisplay;
