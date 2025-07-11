import { useState, useCallback } from "react";
import type { GameStats } from "../types";

export const useGameStats = () => {
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    time: 0,
    matches: 0,
  });
  const [cumulativeScore, setCumulativeScore] = useState(0);

  const addScore = useCallback((addedScore: number) => {
    setStats((prev) => ({
      ...prev,
      score: prev.score + addedScore,
      matches: prev.matches + 1,
    }));
    setCumulativeScore((prev) => prev + addedScore);
  }, []);

  const resetStageStats = useCallback(() => {
    setStats((prev) => ({
      ...prev,
      score: 0,
      matches: 0,
    }));
  }, []);

  const resetAllStats = useCallback(() => {
    setStats({ score: 0, time: 0, matches: 0 });
    setCumulativeScore(0);
  }, []);

  const updateTime = useCallback((gameStartTime: number) => {
    setStats((prev) => ({
      ...prev,
      time: Math.floor((Date.now() - gameStartTime) / 1000),
    }));
  }, []);

  return {
    stats,
    cumulativeScore,
    addScore,
    resetStageStats,
    resetAllStats,
    updateTime,
  };
};
