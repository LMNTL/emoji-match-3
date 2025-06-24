import type { StageConfig } from "./types";

export const BASE_STAGES: StageConfig[] = [
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
  static isStageBeaten(score: number, stage: number): Boolean {
    return score >= this.generateStage(stage).targetScore;
  }

  static getCurrentStage(score: number): StageConfig {
    // Find the highest stage the player has reached
    for (let i = BASE_STAGES.length - 1; i >= 0; i--) {
      if (score >= BASE_STAGES[i].targetScore) {
        return this.generateStage(i + 2); // Next stage
      }
    }
    return BASE_STAGES[0];
  }

  static getNextStage(currentStage: number): StageConfig {
    return this.generateStage(currentStage + 1);
  }

  static generateStage(stageNumber: number): StageConfig {
    if (stageNumber <= BASE_STAGES.length) {
      return BASE_STAGES[stageNumber - 1];
    }

    // Generate infinite stages beyond the base ones
    const baseScore = BASE_STAGES[BASE_STAGES.length - 1].targetScore;
    const additionalStages = stageNumber - BASE_STAGES.length;
    const targetScore = baseScore + additionalStages * 1000;

    const names = [
      "Legend",
      "Mythic",
      "Cosmic",
      "Divine",
      "Eternal",
      "Infinite",
      "Transcendent",
    ];
    const descriptions = [
      "Beyond mortal limits",
      "Ascending to greatness",
      "Universal mastery",
      "Godlike precision",
      "Timeless skill",
      "Boundless potential",
      "Pure perfection",
    ];

    return {
      stage: stageNumber,
      targetScore,
      name: names[(stageNumber - BASE_STAGES.length - 1) % names.length],
      description:
        descriptions[
          (stageNumber - BASE_STAGES.length - 1) % descriptions.length
        ],
    };
  }

  static getProgress(score: number, stage: StageConfig): number {
    const progress = score / stage.targetScore;
    return Math.min(Math.max(progress, 0), 1);
  }

  static getBackgroundColorClass(stage: number): string {
    const colors = [
      "bg-stage-1",
      "bg-stage-2",
      "bg-stage-3",
      "bg-stage-4",
      "bg-stage-5",
      "bg-stage-6",
      "bg-stage-7",
    ];
    return colors[(stage - 1) % 7];
  }
}
