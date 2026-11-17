export type FoodTileId =
  | "donut"
  | "burger"
  | "sushi"
  | "ramen"
  | "cake"
  | "boba"
  | "pizza"
  | "taco"
  | "icecream"
  | "croissant"
  | "avocado"
  | "watermelon"
  | "cupcake"
  | "pie"
  | "pretzel"
  | "hotdog";

export interface FoodTileMeta {
  id: FoodTileId;
  name: string;
  unlockLevel: number;
  accentBg: string;
}

export type GravityMode = "none" | "down" | "center" | "alternate";

export type GameMode = "campaign" | "daily" | "weekly" | "generator";

export type DifficultyLevel = "easy" | "medium" | "hard" | "expert";

export interface DifficultyPreset {
  id: DifficultyLevel;
  label: string;
  tagline: string;
  rows: number;
  cols: number;
  timeSeconds: number;
  tileTypesCount: number;
  gravity: GravityMode;
  blockerCount: number;
  accentColor: string;
}

export interface LevelConfig {
  level: number;
  title: string;
  subtitle: string;
  rows: number;
  cols: number;
  timeSeconds: number;
  tileTypesCount: number;
  gravity: GravityMode;
  blockerCount: number;
  seed?: string;
  bonusStars?: number;
}

export interface GridPoint {
  r: number;
  c: number;
}

export interface BoardCell {
  row: number;
  col: number;
  tileId: FoodTileId | null;
  isBlocker?: boolean;
  uid: string;
}

export type GameState =
  | "TITLE_MENU"
  | "PLAYING"
  | "PAUSED"
  | "ROUND_SUMMARY"
  | "CHEST_OPENING"
  | "GAME_OVER";

export interface MatchFeedback {
  id: string;
  path: GridPoint[];
  starsEarned: number;
  pointsEarned: number;
  distance: number;
  isLongMatch: boolean;
  anchorRow: number;
  anchorCol: number;
}

export interface PlayerProgress {
  highestLevel: number;
  totalStars: number;
  chestStars: number;
  chestsOpened: number;
  bestScore: number;
  hints: number;
  shuffles: number;
  timeBoosts: number;
  unlockedTileCount: number;
  lastDailyKey: string | null;
  dailyStreak: number;
  lastWeeklyKey: string | null;
  challengesCompleted: number;
}
