import React from "react";
import type { GameStats } from "../types";
import "./GameOverScreen.css";

interface GameOverScreenProps {
  stats: GameStats;
  onContinue: () => void;
  onRestart: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  stats,
  onContinue,
  onRestart,
}) => {
  return (
    <div className="game-over-overlay">
      <div className="game-over-content">
        <h2>Game Over</h2>
        <h3>Time's Up!</h3>
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
        <div className="continue">
          <button className="continue-button" onClick={onContinue}>
            Back to Menu
          </button>
          <button className="continue-button" onClick={onRestart}>
            Restart
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverScreen;
