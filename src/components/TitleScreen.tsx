import React from "react";
import "./TitleScreen.css";

interface TitleScreenProps {
  onModeSelect: (mode: "casual" | "timed" | "highscores") => void;
}

const TitleScreen: React.FC<TitleScreenProps> = ({ onModeSelect }) => {
  return (
    <div className="title-screen">
      <div className="title-content">
        <h1 className="game-title">Match Three</h1>
        <div className="menu-options">
          <button
            className="menu-button"
            onClick={() => onModeSelect("casual")}
          >
            Casual Mode
          </button>
          <button className="menu-button" onClick={() => onModeSelect("timed")}>
            Timed Mode
          </button>
          <button
            className="menu-button"
            onClick={() => onModeSelect("highscores")}
          >
            High Scores
          </button>
        </div>
      </div>
    </div>
  );
};

export default TitleScreen;
