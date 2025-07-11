import React from "react";
import type { GameStats } from "../types";
import "./GameOverScreen.css";

interface GameOverScreenProps {
  stats: GameStats;
  cumulativeScore: number;
  currentStage: number;
  onContinue: () => void;
  onRestart: () => void;
  onHighScoreEntry?: (name: string) => void;
  isHighScore?: boolean;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  stats,
  cumulativeScore,
  currentStage,
  onContinue,
  onRestart,
  onHighScoreEntry,
  isHighScore,
}) => {
  return (
    <div className="game-over-overlay">
      <div className="game-over-content">
        <h2>Game Over</h2>
        <h3>Time's Up!</h3>
        <div className="final-stats">
          <div className="stat-item">
            <span className="stat-label">Stage Score:</span>
            <span className="stat-value">{stats.score.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Score:</span>
            <span className="stat-value highlight">
              {cumulativeScore.toLocaleString()}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Final Stage:</span>
            <span className="stat-value">{currentStage}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Matches Made:</span>
            <span className="stat-value">{stats.matches}</span>
          </div>
        </div>
        {isHighScore && onHighScoreEntry && (
          <div className="high-score-notice">🎉 New High Score! 🎉</div>
        )}
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
