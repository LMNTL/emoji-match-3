import { useState, useEffect } from "react";

export interface HighScore {
  name: string;
  score: number;
  stage: number;
  date: string;
}

const DEFAULT_HIGH_SCORES: HighScore[] = [
  { name: "ACE", score: 15000, stage: 12, date: "2024-01-15" },
  { name: "PRO", score: 12500, stage: 10, date: "2024-01-14" },
  { name: "TOP", score: 10000, stage: 8, date: "2024-01-13" },
  { name: "WIN", score: 8500, stage: 7, date: "2024-01-12" },
  { name: "GOD", score: 7000, stage: 6, date: "2024-01-11" },
  { name: "MAX", score: 5500, stage: 5, date: "2024-01-10" },
  { name: "BIG", score: 4000, stage: 4, date: "2024-01-09" },
  { name: "HOT", score: 2500, stage: 3, date: "2024-01-08" },
  { name: "FUN", score: 1500, stage: 2, date: "2024-01-07" },
  { name: "NEW", score: 500, stage: 1, date: "2024-01-06" },
];

export const useHighScores = () => {
  const [highScores, setHighScores] = useState<HighScore[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("emoji-match-high-scores");
    if (stored) {
      try {
        setHighScores(JSON.parse(stored));
      } catch {
        setHighScores(DEFAULT_HIGH_SCORES);
      }
    } else {
      setHighScores(DEFAULT_HIGH_SCORES);
    }
  }, []);

  const saveHighScores = (scores: HighScore[]) => {
    setHighScores(scores);
    localStorage.setItem("emoji-match-high-scores", JSON.stringify(scores));
  };

  const addHighScore = (
    name: string,
    score: number,
    stage: number,
  ): boolean => {
    const newScore: HighScore = {
      name: name.toUpperCase().slice(0, 3).padEnd(3, " "),
      score,
      stage,
      date: new Date().toISOString().split("T")[0],
    };

    const newScores = [...highScores, newScore]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const isHighScore = newScores.some(
      (s) =>
        s.name === newScore.name &&
        s.score === newScore.score &&
        s.date === newScore.date,
    );

    if (isHighScore) {
      saveHighScores(newScores);
      return true;
    }
    return false;
  };

  const isHighScore = (score: number): boolean => {
    return (
      highScores.length < 10 || score > highScores[highScores.length - 1].score
    );
  };

  return {
    highScores,
    addHighScore,
    isHighScore,
  };
};
