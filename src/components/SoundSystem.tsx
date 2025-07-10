import React, { useEffect, useRef, useState } from "react";
import "./SoundSystem.css";

export const SoundSystem: React.FC = () => {
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize audio context
    audioContextRef.current = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    window.addEventListener("soundEffect", handleSoundEffectEvent);

    return () => {
      window.removeEventListener("soundEffect", handleSoundEffectEvent);
      audioContextRef.current?.close();
    };
  }, [isMuted]);

  const handleSoundEffectEvent = (event) => {
    switch (event.soundType) {
      case SoundType.MATCH:
        playMatchSound(event.matchCount);
        break;
      case SoundType.ROCKET:
        playRocketSound();
        break;
      case SoundType.VICTORY:
        playVictorySound();
        break;
      case SoundType.GAME_OVER:
        playGameOverSound();
        break;
      case SoundType.TITLE_MUSIC:
        playTitleMusic();
        break;
      case SoundType.FEATURE_UNLOCK:
        playFeatureUnlockSound();
        break;
      default:
        break;
    }
  };

  const playChiptuneSound = (
    frequency: number,
    duration: number,
    type: OscillatorType = "square",
  ) => {
    if (isMuted || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Envelope for chiptune sound
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      ctx.currentTime + duration,
    );

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  };

  const playMatchSound = (matchCount: number) => {
    // Base frequency starts at 440Hz, increases by 110Hz for each successive match
    // Caps at 5 matches (880Hz)
    const cappedMatchCount = Math.min(matchCount, 5);
    const frequency = 440 + (cappedMatchCount - 1) * 110;
    playChiptuneSound(frequency, 0.2);
  };

  const playRocketSound = () => {
    if (isMuted || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = "sawtooth";

    // Rocket blast effect - frequency sweep
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      800,
      ctx.currentTime + 0.3,
    );

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  };

  const playVictorySound = () => {
    if (isMuted || !audioContextRef.current) return;

    // Victory fanfare - ascending chord progression
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((frequency, index) => {
      setTimeout(() => {
        playChiptuneSound(frequency, 0.5, "triangle");
      }, index * 150);
    });
  };

  const playGameOverSound = () => {
    if (isMuted || !audioContextRef.current) return;

    // Sad descending melody
    const notes = [523.25, 466.16, 415.3, 349.23]; // C5, Bb4, Ab4, F4
    notes.forEach((frequency, index) => {
      setTimeout(() => {
        playChiptuneSound(frequency, 0.6, "triangle");
      }, index * 200);
    });
  };

  const playTitleMusic = () => {
    if (isMuted || !audioContextRef.current) return;

    // Catchy 8-note melody loop
    const melody = [
      { freq: 523.25, duration: 0.3 }, // C5
      { freq: 659.25, duration: 0.3 }, // E5
      { freq: 783.99, duration: 0.3 }, // G5
      { freq: 659.25, duration: 0.3 }, // E5
      { freq: 698.46, duration: 0.3 }, // F5
      { freq: 783.99, duration: 0.3 }, // G5
      { freq: 880.0, duration: 0.6 }, // A5
      { freq: 783.99, duration: 0.6 }, // G5
    ];

    melody.forEach((note, index) => {
      setTimeout(() => {
        playChiptuneSound(note.freq, note.duration, "square");
      }, index * 300);
    });
  };

  const playFeatureUnlockSound = () => {
    if (isMuted || !audioContextRef.current) return;

    // 3-note ascending fanfare
    const notes = [659.25, 783.99, 1046.5]; // E5, G5, C6
    notes.forEach((frequency, index) => {
      setTimeout(() => {
        playChiptuneSound(frequency, 0.4, "triangle");
      }, index * 100);
    });
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <button
      className={`mute-toggle ${isMuted ? "muted" : ""}`}
      onClick={toggleMute}
      aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
      title={isMuted ? "Unmute sounds" : "Mute sounds"}
    >
      {isMuted ? "🔇" : "🔊"}
    </button>
  );
};

export enum SoundType {
  MATCH,
  ROCKET,
  VICTORY,
  GAME_OVER,
  TITLE_MUSIC,
  FEATURE_UNLOCK,
}

export class SoundEvent extends Event {
  readonly soundType: SoundType;
  readonly matchCount: number | null;
  constructor(type, matchCount = null) {
    super("soundEffect");
    this.soundType = type;
    this.matchCount = matchCount;
  }
}
