import React from "react";
import type { GameStats } from "../types";
import "./GameOverScreen.css";

interface GameOverScreenProps {
  stats: GameStats;
  onContinue: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  stats,
  onContinue,
}) => {
  return (
    <div className="game-over-overlay">
      <div className="game-over-content">
        <h2>Time's Up!</h2>
        <div className="final-stats">
          <div className="stat-item">
            <span className="stat-label">Final Score:</span>
            <span className="stat-value">{stats.score.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Matches Made:</span>
            <span className="stat-value">{stats.matches}</span>
          </div>
        </div>
        <button className="continue-button" onClick={onContinue}>
          Back to Menu
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen;
