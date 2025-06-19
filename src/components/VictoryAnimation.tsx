import React, { useEffect, useState } from "react";
import "./VictoryAnimation.css";

interface VictoryAnimationProps {
  onComplete: () => void;
  stageNumber: number;
}

const VictoryAnimation: React.FC<VictoryAnimationProps> = ({
  onComplete,
  stageNumber,
}) => {
  const [showFireworks, setShowFireworks] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFireworks(true);
    }, 500);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="victory-overlay">
      <div className="victory-content">
        <h1 className="victory-title">Stage {stageNumber - 1} Complete!</h1>
        <div className="victory-emoji">🎉</div>
        {showFireworks && (
          <div className="fireworks">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`firework firework-${i + 1}`}>
                ✨
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VictoryAnimation;
