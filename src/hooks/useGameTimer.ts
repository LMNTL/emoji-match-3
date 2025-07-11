import { useState, useEffect, useRef, useCallback } from "react";
import { SoundEvent, SoundType } from "../components/SoundSystem";

export const useGameTimer = (
  maxTime: number,
  isActive: boolean,
  onTimeUp: () => void,
) => {
  const [timeRemaining, setTimeRemaining] = useState(maxTime);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    setTimeRemaining(maxTime);
  }, [maxTime]);

  const addTime = useCallback(
    (seconds: number) => {
      setTimeRemaining((prev) => Math.min(maxTime, prev + seconds));
    },
    [maxTime],
  );

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            const gameOverEvent = new SoundEvent(SoundType.GAME_OVER);
            window.dispatchEvent(gameOverEvent);
            onTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, isPaused, onTimeUp]);

  return {
    timeRemaining,
    isPaused,
    resetTimer,
    addTime,
    togglePause,
  };
};
