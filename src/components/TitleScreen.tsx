import React, { useEffect, useState } from "react";
import { SoundEvent, SoundType } from "./SoundSystem";
import "./TitleScreen.css";

interface TitleScreenProps {
  onModeSelect: (mode: "casual" | "timed" | "highscores") => void;
}

interface AnimatedEmoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  scaleSpeed: number;
  opacity: number;
}

const EMOJI_LIST = [
  "🎮",
  "🎯",
  "⭐",
  "💎",
  "🔥",
  "⚡",
  "🌟",
  "✨",
  "🎊",
  "🎉",
  "🚀",
  "💫",
  "🌈",
  "🎪",
  "🎭",
  "🎨",
  "🎵",
  "🎶",
  "🎸",
  "🎺",
  "🏆",
  "🥇",
  "🎖️",
  "🏅",
  "👑",
  "💰",
  "💝",
  "🎁",
  "🍀",
  "🌺",
];

const TitleScreen: React.FC<TitleScreenProps> = ({ onModeSelect }) => {
  const [animatedEmojis, setAnimatedEmojis] = useState<AnimatedEmoji[]>([]);

  useEffect(() => {
    // Initialize animated emojis
    const emojis: AnimatedEmoji[] = [];
    const emojiCount = Math.floor(Math.random() * 21) + 20; // 20-40 emojis

    for (let i = 0; i < emojiCount; i++) {
      emojis.push({
        id: i,
        emoji: EMOJI_LIST[Math.floor(Math.random() * EMOJI_LIST.length)],
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 2, // -1 to 1
        vy: (Math.random() - 0.5) * 2,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 4, // -2 to 2 degrees per frame
        scale: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
        scaleSpeed: (Math.random() - 0.5) * 0.01, // -0.005 to 0.005
        opacity: Math.random() * 0.3 + 0.1, // 0.1 to 0.4
      });
    }

    setAnimatedEmojis(emojis);

    // Animation loop
    const animationInterval = setInterval(() => {
      setAnimatedEmojis((prevEmojis) =>
        prevEmojis.map((emoji) => {
          let newX = emoji.x + emoji.vx;
          let newY = emoji.y + emoji.vy;
          let newVx = emoji.vx;
          let newVy = emoji.vy;

          // Bounce off edges
          if (newX <= 0 || newX >= window.innerWidth) {
            newVx = -emoji.vx;
            newX = Math.max(0, Math.min(window.innerWidth, newX));
          }
          if (newY <= 0 || newY >= window.innerHeight) {
            newVy = -emoji.vy;
            newY = Math.max(0, Math.min(window.innerHeight, newY));
          }

          // Update rotation
          const newRotation = emoji.rotation + emoji.rotationSpeed;

          // Update scale with bounds
          let newScale = emoji.scale + emoji.scaleSpeed;
          let newScaleSpeed = emoji.scaleSpeed;
          if (newScale <= 0.3 || newScale >= 1.2) {
            newScaleSpeed = -emoji.scaleSpeed;
            newScale = Math.max(0.3, Math.min(1.2, newScale));
          }

          return {
            ...emoji,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            rotation: newRotation,
            scale: newScale,
            scaleSpeed: newScaleSpeed,
          };
        }),
      );
    }, 16); // ~60fps

    return () => {
      clearInterval(animationInterval);
    };
  }, []);

  return (
    <div className="title-screen">
      <div className="emoji-background">
        {animatedEmojis.map((emoji) => (
          <div
            key={emoji.id}
            className="animated-emoji"
            style={{
              left: `${emoji.x}px`,
              top: `${emoji.y}px`,
              transform: `rotate(${emoji.rotation}deg) scale(${emoji.scale})`,
              opacity: emoji.opacity,
            }}
          >
            {emoji.emoji}
          </div>
        ))}
      </div>
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
