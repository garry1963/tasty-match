import tastyMatchCover from "@/assets/images/tasty_match_cover_1794865467399.jpg";
import thumbChest from "@/assets/images/game_thumb_chest_1794865470172.jpg";
import type {
  DifficultyLevel,
  DifficultyPreset,
  FoodTileMeta,
  GravityMode,
  LevelConfig,
} from "@/types/tastyMatch";

export const GAME_COVER_IMAGE = tastyMatchCover;
export const CHEST_ARTWORK_IMAGE = thumbChest;
export const CHEST_GOAL_STARS = 25;

export const FOOD_TILES: FoodTileMeta[] = [
  { id: "donut", name: "Glazed Donut", unlockLevel: 1, accentBg: "#FFF0F5" },
  { id: "burger", name: "Cheeseburger", unlockLevel: 1, accentBg: "#FFF7ED" },
  { id: "sushi", name: "Salmon Nigiri", unlockLevel: 1, accentBg: "#FEF2F2" },
  { id: "ramen", name: "Ramen Bowl", unlockLevel: 1, accentBg: "#FEFCE8" },
  { id: "cake", name: "Strawberry Cake", unlockLevel: 1, accentBg: "#FFF1F2" },
  { id: "boba", name: "Boba Milk Tea", unlockLevel: 1, accentBg: "#F5F3FF" },
  { id: "pizza", name: "Pepperoni Slice", unlockLevel: 1, accentBg: "#FFF7ED" },
  { id: "taco", name: "Crunchy Taco", unlockLevel: 1, accentBg: "#ECFDF5" },
  { id: "icecream", name: "Berry Cone", unlockLevel: 2, accentBg: "#FDF2F8" },
  { id: "croissant", name: "Butter Croissant", unlockLevel: 2, accentBg: "#FFFBEB" },
  { id: "avocado", name: "Fresh Avocado", unlockLevel: 3, accentBg: "#F0FDF4" },
  { id: "watermelon", name: "Watermelon", unlockLevel: 3, accentBg: "#FEF2F2" },
  { id: "cupcake", name: "Frosting Cupcake", unlockLevel: 4, accentBg: "#FAF5FF" },
  { id: "pie", name: "Cherry Pie", unlockLevel: 4, accentBg: "#FFF1F2" },
  { id: "pretzel", name: "Salted Pretzel", unlockLevel: 5, accentBg: "#FEF3C7" },
  { id: "hotdog", name: "Classic Hot Dog", unlockLevel: 5, accentBg: "#FFEDD5" },
];

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    level: 1,
    title: "Bakery Starter",
    subtitle: "6x6 Classic · Connect pairs within 2 turns",
    rows: 6,
    cols: 6,
    timeSeconds: 120,
    tileTypesCount: 8,
    gravity: "none",
    blockerCount: 0,
  },
  {
    level: 2,
    title: "Bistro Rush",
    subtitle: "6x8 Table · Ice Cream & Croissant unlocked",
    rows: 6,
    cols: 8,
    timeSeconds: 135,
    tileTypesCount: 10,
    gravity: "none",
    blockerCount: 0,
  },
  {
    level: 3,
    title: "Street Food Market",
    subtitle: "6x8 Gravity · Tiles drop downward after matches",
    rows: 6,
    cols: 8,
    timeSeconds: 150,
    tileTypesCount: 12,
    gravity: "down",
    blockerCount: 2,
  },
  {
    level: 4,
    title: "Grand Banquet",
    subtitle: "6x10 Center Pull · Tiles pull toward center",
    rows: 6,
    cols: 10,
    timeSeconds: 165,
    tileTypesCount: 14,
    gravity: "center",
    blockerCount: 4,
  },
  {
    level: 5,
    title: "Master Chef Table",
    subtitle: "8x10 Full Pantry · All 16 tiles & row shifts",
    rows: 8,
    cols: 10,
    timeSeconds: 195,
    tileTypesCount: 16,
    gravity: "alternate",
    blockerCount: 4,
  },
];

export const DIFFICULTY_PRESETS: Record<DifficultyLevel, DifficultyPreset> = {
  easy: {
    id: "easy",
    label: "Easy",
    tagline: "6x6 · 8 tiles · Calm 2:30 timer",
    rows: 6,
    cols: 6,
    timeSeconds: 150,
    tileTypesCount: 8,
    gravity: "none",
    blockerCount: 0,
    accentColor: "#4AF0A7",
  },
  medium: {
    id: "medium",
    label: "Medium",
    tagline: "6x8 · 12 tiles · Gravity drop",
    rows: 6,
    cols: 8,
    timeSeconds: 145,
    tileTypesCount: 12,
    gravity: "down",
    blockerCount: 2,
    accentColor: "#38BDF8",
  },
  hard: {
    id: "hard",
    label: "Hard",
    tagline: "8x8 · 14 tiles · Center pull",
    rows: 8,
    cols: 8,
    timeSeconds: 165,
    tileTypesCount: 14,
    gravity: "center",
    blockerCount: 4,
    accentColor: "#FFAC4A",
  },
  expert: {
    id: "expert",
    label: "Expert",
    tagline: "8x10 · All 16 tiles · Shifting rows",
    rows: 8,
    cols: 10,
    timeSeconds: 180,
    tileTypesCount: 16,
    gravity: "alternate",
    blockerCount: 6,
    accentColor: "#E70D5C",
  },
};

export function getLevelConfig(level: number): LevelConfig {
  const existing = LEVEL_CONFIGS.find((l) => l.level === level);
  if (existing) return existing;
  const modes: GravityMode[] = ["down", "center", "alternate", "none"];
  return {
    level,
    title: `Chef Table #${level}`,
    subtitle: "8x10 Endless Master · Dynamic gravity shifts",
    rows: 8,
    cols: 10,
    timeSeconds: Math.max(130, 195 - (level - 5) * 8),
    tileTypesCount: 16,
    gravity: modes[level % modes.length],
    blockerCount: Math.min(8, 4 + (level % 3) * 2),
  };
}

export function getDailyKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getYesterdayKey(date: Date = new Date()): string {
  const prev = new Date(date);
  prev.setDate(prev.getDate() - 1);
  return getDailyKey(prev);
}

export function getWeeklyKey(date: Date = new Date()): string {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function getDailyChallengeConfig(date: Date = new Date()): {
  key: string;
  label: string;
  config: LevelConfig;
} {
  const key = getDailyKey(date);
  const day = date.getDay(); // 0-6
  const setups: Array<{
    rows: number;
    cols: number;
    tiles: number;
    gravity: GravityMode;
    blockers: number;
    time: number;
    name: string;
  }> = [
    { rows: 6, cols: 8, tiles: 12, gravity: "center", blockers: 2, time: 145, name: "Sunday Brunch" },
    { rows: 6, cols: 8, tiles: 10, gravity: "none", blockers: 0, time: 140, name: "Monday Espresso" },
    { rows: 6, cols: 8, tiles: 12, gravity: "down", blockers: 2, time: 145, name: "Tuesday Tacos" },
    { rows: 8, cols: 8, tiles: 14, gravity: "center", blockers: 4, time: 165, name: "Midweek Ramen" },
    { rows: 6, cols: 10, tiles: 14, gravity: "down", blockers: 2, time: 160, name: "Thursday Sushi" },
    { rows: 8, cols: 8, tiles: 14, gravity: "alternate", blockers: 4, time: 165, name: "Friday Feast" },
    { rows: 8, cols: 10, tiles: 16, gravity: "down", blockers: 4, time: 185, name: "Saturday Pastry" },
  ];
  const pick = setups[day];
  const label = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return {
    key,
    label,
    config: {
      level: 0,
      title: `Daily: ${pick.name}`,
      subtitle: `${pick.rows}x${pick.cols} · ${pick.tiles} tiles · ${pick.gravity === "none" ? "Classic" : `${pick.gravity} shift`}`,
      rows: pick.rows,
      cols: pick.cols,
      timeSeconds: pick.time,
      tileTypesCount: pick.tiles,
      gravity: pick.gravity,
      blockerCount: pick.blockers,
      seed: `tasty-daily-${key}`,
      bonusStars: 5,
    },
  };
}

export function getWeeklyChallengeConfig(date: Date = new Date()): {
  key: string;
  config: LevelConfig;
} {
  const key = getWeeklyKey(date);
  const weekNumber = parseInt(key.split("-W")[1] ?? "1", 10);
  const modes: GravityMode[] = ["alternate", "center", "down"];
  const gravity = modes[weekNumber % modes.length];

  return {
    key,
    config: {
      level: 0,
      title: `Weekly Grand Table (${key})`,
      subtitle: `8x10 Master Board · All 16 tiles · ${gravity} shift`,
      rows: 8,
      cols: 10,
      timeSeconds: 210,
      tileTypesCount: 16,
      gravity,
      blockerCount: 6,
      seed: `tasty-weekly-${key}`,
      bonusStars: 10,
    },
  };
}

export function buildGeneratorConfig(
  difficulty: DifficultyLevel,
  gravityOverride: GravityMode | "auto",
  seed: string
): LevelConfig {
  const preset = DIFFICULTY_PRESETS[difficulty];
  const gravity = gravityOverride === "auto" ? preset.gravity : gravityOverride;
  return {
    level: 0,
    title: `${preset.label} Puzzle`,
    subtitle: `${preset.rows}x${preset.cols} · ${preset.tileTypesCount} tiles · ${gravity === "none" ? "Static" : `${gravity} shift`}`,
    rows: preset.rows,
    cols: preset.cols,
    timeSeconds: preset.timeSeconds,
    tileTypesCount: preset.tileTypesCount,
    gravity,
    blockerCount: preset.blockerCount,
    seed,
  };
}

export function getTimeUntilMidnightText(now: Date = new Date()): string {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  const diffSec = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}

export function getTimeUntilNextWeekText(now: Date = new Date()): string {
  const day = now.getDay(); // 0=Sun, 1=Mon
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  const diffHours = Math.max(
    0,
    Math.floor((nextMonday.getTime() - now.getTime()) / 3600000)
  );
  const d = Math.floor(diffHours / 24);
  const h = diffHours % 24;
  return `${d}d ${h}h`;
}
