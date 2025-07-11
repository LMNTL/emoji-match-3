import React from "react";
import type { HighScore } from "../hooks/useHighScores";
import "./HighScoresScreen.css";

interface HighScoresScreenProps {
  highScores: HighScore[];
  onBack: () => void;
}

const HighScoresScreen: React.FC<HighScoresScreenProps> = ({
  highScores,
  onBack,
}) => {
  return (
    <div className="high-scores-screen">
      <h1>🏆 High Scores 🏆</h1>
      <table className="scores-table">
        <thead className="table-header">
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Score</th>
            <th>Stage</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {highScores.map((score, index) => (
            <tr
              key={`${score.name}-${score.date}-${index}`}
              className="score-row"
            >
              <td className="rank">#{index + 1}</td>
              <td className="name">{score.name}</td>
              <td className="score">{score.score.toLocaleString()}</td>
              <td className="stage">{score.stage}</td>
              <td className="date">{score.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="back-button" onClick={onBack}>
        Back to Menu
      </button>
    </div>
  );
};

export default HighScoresScreen;
