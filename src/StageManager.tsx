import type { StageConfig } from "./types";

export const STAGES: StageConfig[] = [
  {
    stage: 1,
    targetScore: 100,
    name: "Beginner",
    description: "Get warmed up!",
  },
  {
    stage: 2,
    targetScore: 300,
    name: "Novice",
    description: "Finding your rhythm",
  },
  {
    stage: 3,
    targetScore: 600,
    name: "Intermediate",
    description: "Getting serious",
  },
  {
    stage: 4,
    targetScore: 1000,
    name: "Advanced",
    description: "Master the combos",
  },
  {
    stage: 5,
    targetScore: 1500,
    name: "Expert",
    description: "Elite performance",
  },
  { stage: 6, targetScore: 2200, name: "Master", description: "True mastery" },
  {
    stage: 7,
    targetScore: 3000,
    name: "Grandmaster",
    description: "Legendary skills",
  },
];

export class StageManager {
  static getCurrentStage(score: number): StageConfig {
    for (let i = STAGES.length - 1; i >= 0; i--) {
      if (score >= STAGES[i].targetScore) {
        return STAGES[Math.min(i + 1, STAGES.length - 1)];
      }
    }
    return STAGES[0];
  }

  static getNextStage(currentStage: number): StageConfig | null {
    return STAGES.find((stage) => stage.stage === currentStage + 1) || null;
  }

  static getProgress(score: number, stage: StageConfig): number {
    const progress = score / stage.targetScore;
    return Math.min(Math.max(progress, 0), 1);
  }
}
