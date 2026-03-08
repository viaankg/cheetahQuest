export enum GameState {
  INTRO_CUTSCENE = 'INTRO_CUTSCENE',
  LEVEL_SELECT = 'LEVEL_SELECT',
  LEVEL_START = 'LEVEL_START',
  PLAYING = 'PLAYING',
  LEVEL_END = 'LEVEL_END',
  FINAL_CUTSCENE = 'FINAL_CUTSCENE',
}

export interface LevelData {
  id: number;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Medium-Hard' | 'Challenging';
  description: string;
  meatToCollect: number;
  timeLimit: number; // in seconds
  background: string;
  groundColor: string;
  skyColor: string;
  platforms: PlatformData[];
  enemies?: EnemyData[];
}

export interface PlatformData {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'grass' | 'rock' | 'dirt' | 'sand';
}

export interface EnemyData {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  range: number;
  type: 'animal';
}

export interface LevelProgress {
  stars: number;
  unlocked: boolean;
  bestMeat: number;
}

export interface GameProgress {
  levels: Record<number, LevelProgress>;
}
