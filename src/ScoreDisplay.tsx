import React, { useState, useEffect } from "react";

interface ScoreDisplayProps {
  score: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score }) => {
  const [displayScore, setDisplayScore] = useState(score);
  const [lastScore, setLastScore] = useState(score);
  const [scoreIncrease, setScoreIncrease] = useState(0);
  const [popups, setPopups] = useState<Record<string, number>>({});

  useEffect(() => {
    setScoreIncrease(score - lastScore);
    setLastScore(score);
  }, [score]);

  useEffect(() => {
    if (scoreIncrease > 0) {
      const popupId = Date.now();
      setPopups((prevPopups) => {
        return { ...prevPopups, [popupId]: scoreIncrease };
      });

      // Animate score rolling up
      const startScore = displayScore;
      const endScore = score;
      const duration = 800; // 800ms animation
      const steps = 20;
      const increment = (endScore - startScore) / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayScore(endScore);
          clearInterval(timer);
        } else {
          setDisplayScore(Math.floor(startScore + increment * currentStep));
        }
      }, duration / steps);

      // Hide popup after animation
      const popupTimer = setTimeout(() => {
        setPopups((prevPopups) => {
          delete prevPopups[popupId];
          return prevPopups;
        });
        setScoreIncrease(0);
      }, 1500);

      return () => {
        clearInterval(timer);
        clearTimeout(popupTimer);
      };
    }
  }, [scoreIncrease]);

  return (
    <div className="score-container">
      <div className="score">Score: {displayScore.toLocaleString()}</div>
      {Object.entries(popups).map((pop) => (
        <div className="score-popup" key={pop[0]}>
          +{pop[1]}
        </div>
      ))}
    </div>
  );
};

export default ScoreDisplay;
