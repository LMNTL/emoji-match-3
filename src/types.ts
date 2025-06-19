export interface GameStats {
  score: number;
  time: number;
  matches: number;
  stage: number;
}

export interface StageConfig {
  stage: number;
  targetScore: number;
  name: string;
  description: string;
}
