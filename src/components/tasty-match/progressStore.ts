"use client";

import { useSyncExternalStore } from "react";
import type { PlayerProgress } from "@/types/tastyMatch";

const STORAGE_KEY = "tasty_match_progress_v1";
const PROGRESS_EVENT = "tasty-match-progress-change";

export const DEFAULT_PROGRESS: PlayerProgress = {
  highestLevel: 1,
  totalStars: 0,
  chestStars: 0,
  chestsOpened: 0,
  bestScore: 0,
  hints: 4,
  shuffles: 3,
  timeBoosts: 2,
  unlockedTileCount: 8,
  lastDailyKey: null,
  dailyStreak: 0,
  lastWeeklyKey: null,
  challengesCompleted: 0,
};

let cachedRaw: string | null = null;
let cachedSnapshot: PlayerProgress = DEFAULT_PROGRESS;

function getClientSnapshot(): PlayerProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedSnapshot;
    cachedRaw = raw;
    if (!raw) {
      cachedSnapshot = DEFAULT_PROGRESS;
    } else {
      cachedSnapshot = {
        ...DEFAULT_PROGRESS,
        ...(JSON.parse(raw) as Partial<PlayerProgress>),
      };
    }
    return cachedSnapshot;
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function getServerSnapshot(): PlayerProgress {
  return DEFAULT_PROGRESS;
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener(PROGRESS_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(PROGRESS_EVENT, handler);
  };
}

export function updatePlayerProgress(
  updater: (prev: PlayerProgress) => PlayerProgress
) {
  const current = getClientSnapshot();
  const next = updater(current);
  const serialized = JSON.stringify(next);
  cachedRaw = serialized;
  cachedSnapshot = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      // Ignore quota/storage errors
    }
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  }
}

export function usePlayerProgress(): PlayerProgress {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
