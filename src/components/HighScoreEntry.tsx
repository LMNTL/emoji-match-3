import React, { useState } from "react";
import "./HighScoreEntry.css";

interface HighScoreEntryProps {
  score: number;
  stage: number;
  onSubmit: (name: string) => void;
  onSkip: () => void;
}

const HighScoreEntry: React.FC<HighScoreEntryProps> = ({
  score,
  stage,
  onSubmit,
  onSkip,
}) => {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 3);
    setName(value);
  };

  return (
    <div className="high-score-entry-overlay">
      <div className="high-score-entry-content">
        <h2>🎉 New High Score! 🎉</h2>
        <div className="score-display">
          <h3 className="score-value">{score.toLocaleString()}</h3>
          <div className="stage-info">Reached Stage {stage}</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="name-input-container">
            <label htmlFor="player-name">Enter your initials:</label>
            <input
              id="player-name"
              type="text"
              value={name}
              onChange={handleInputChange}
              maxLength={3}
              placeholder="ABC"
              autoFocus
              className="name-input"
            />
          </div>
          <div className="buttons">
            <button type="submit" disabled={!name.trim()}>
              Save Score
            </button>
            <button type="button" onClick={onSkip}>
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HighScoreEntry;
