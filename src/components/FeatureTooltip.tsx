import React from "react";
import { FocusTrap } from "focus-trap-react";
import "./FeatureTooltip.css";

interface FeatureTooltipProps {
  feature: string;
  onClose: () => void;
}

const FeatureTooltip: React.FC<FeatureTooltipProps> = ({
  feature,
  onClose,
}) => {
  const getFeatureContent = () => {
    switch (feature) {
      case "wildcards":
        return {
          title: "Wildcards Unlocked! 🌟",
          description:
            "Star emojis are wildcards that can match with any other emoji. They give bonus points when matched!",
        };
      case "rockets":
        return {
          title: "Rockets Unlocked! 🚀",
          description:
            "Rocket emojis clear entire lines when activated by adjacent matches. They point in the direction they will clear and give massive bonus points!",
        };
      default:
        return {
          title: "New Feature!",
          description: "Something new has been unlocked!",
        };
    }
  };

  const content = getFeatureContent();

  return (
    <FocusTrap>
      <div className="feature-tooltip-overlay" onClick={onClose}>
        <div className="feature-tooltip" onClick={(e) => e.stopPropagation()}>
          <h2>{content.title}</h2>
          <p>{content.description}</p>
          <button onClick={onClose}>Got it!</button>
        </div>
      </div>
    </FocusTrap>
  );
};

export default FeatureTooltip;
