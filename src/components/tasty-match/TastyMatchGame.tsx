"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  RotateCcw,
  Lightbulb,
  Shuffle,
  Clock,
  Volume2,
  VolumeX,
  Star,
  Gift,
  Trophy,
  ChevronRight,
  Lock,
  Sparkles,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Grid2x2,
  X,
  Calendar,
  CalendarDays,
  Wand2,
  Flame,
  Dices,
} from "lucide-react";
import {
  buildGeneratorConfig,
  CHEST_ARTWORK_IMAGE,
  CHEST_GOAL_STARS,
  DIFFICULTY_PRESETS,
  FOOD_TILES,
  GAME_COVER_IMAGE,
  getDailyChallengeConfig,
  getLevelConfig,
  getTimeUntilMidnightText,
  getTimeUntilNextWeekText,
  getWeeklyChallengeConfig,
  getYesterdayKey,
} from "./data";
import {
  applyBoardGravity,
  computeMatchReward,
  countRemainingTiles,
  findAllValidPairs,
  findConnectPath,
  generateSolvableBoard,
  shuffleRemainingTiles,
} from "./mahjongEngine";
import { FoodTileArt } from "./FoodTileArt";
import { soundFX } from "./sound";
import { updatePlayerProgress, usePlayerProgress } from "./progressStore";
import type {
  BoardCell,
  DifficultyLevel,
  GameMode,
  GameState,
  GravityMode,
  GridPoint,
  LevelConfig,
  MatchFeedback,
} from "@/types/tastyMatch";

type MenuTab = "campaign" | "challenges" | "generator";

function randomSeedCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function TastyMatchGame() {
  const progress = usePlayerProgress();
  const [menuTab, setMenuTab] = useState<MenuTab>("campaign");
  const [gameState, setGameState] = useState<GameState>("TITLE_MENU");
  const [activeMode, setActiveMode] = useState<GameMode>("campaign");
  const [currentLevel, setCurrentLevel] = useState<number>(1);

  // Puzzle Generator state
  const [genDifficulty, setGenDifficulty] = useState<DifficultyLevel>("medium");
  const [genGravity, setGenGravity] = useState<GravityMode | "auto">("auto");
  const [genSeed, setGenSeed] = useState<string>("TASTY1");

  // Active LevelConfig snapshot
  const [activeConfig, setActiveConfig] = useState<LevelConfig>(() =>
    getLevelConfig(1)
  );

  // Board & gameplay state
  const [grid, setGrid] = useState<BoardCell[][]>([]);
  const [selected, setSelected] = useState<GridPoint | null>(null);
  const [hintPair, setHintPair] = useState<[GridPoint, GridPoint] | null>(null);
  const [invalidPair, setInvalidPair] = useState<[GridPoint, GridPoint] | null>(
    null
  );
  const [matchFx, setMatchFx] = useState<MatchFeedback | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [score, setScore] = useState<number>(0);
  const [levelStars, setLevelStars] = useState<number>(0);
  const [bonusAwarded, setBonusAwarded] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [muted, setMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [pantryOpen, setPantryOpen] = useState<boolean>(false);
  const [tickNow, setTickNow] = useState<number>(() => Date.now());
  const [chestRewards, setChestRewards] = useState<{
    hints: number;
    shuffles: number;
    timeBoosts: number;
    bonusScore: number;
    newlyUnlockedTile: string | null;
  } | null>(null);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const lastMatchTimestampRef = useRef<number>(0);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = useCallback((msg: string) => {
    setStatusNotice(msg);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => {
      setStatusNotice(null);
    }, 2200);
  }, []);

  // Refresh reset countdowns once per minute while on Title Menu
  useEffect(() => {
    if (gameState !== "TITLE_MENU") return;
    const id = setInterval(() => {
      setTickNow(Date.now());
    }, 60000);
    return () => clearInterval(id);
  }, [gameState]);

  const dailyInfo = useMemo(
    () => getDailyChallengeConfig(new Date(tickNow)),
    [tickNow]
  );
  const weeklyInfo = useMemo(
    () => getWeeklyChallengeConfig(new Date(tickNow)),
    [tickNow]
  );
  const dailyCountdown = useMemo(
    () => getTimeUntilMidnightText(new Date(tickNow)),
    [tickNow]
  );
  const weeklyCountdown = useMemo(
    () => getTimeUntilNextWeekText(new Date(tickNow)),
    [tickNow]
  );

  const dailyDoneToday = progress.lastDailyKey === dailyInfo.key;
  const weeklyDoneThisWeek = progress.lastWeeklyKey === weeklyInfo.key;

  const launchBoard = useCallback((mode: GameMode, cfg: LevelConfig) => {
    const board = generateSolvableBoard(cfg);
    setActiveMode(mode);
    setActiveConfig(cfg);
    if (mode === "campaign") {
      setCurrentLevel(cfg.level);
    }
    setGrid(board);
    setSelected(null);
    setHintPair(null);
    setInvalidPair(null);
    setMatchFx(null);
    setTimeLeft(cfg.timeSeconds);
    setLevelStars(0);
    setBonusAwarded(0);
    setCombo(0);
    setMovesCount(0);
    if (mode !== "campaign" || cfg.level === 1) {
      setScore(0);
    }
    setGameState("PLAYING");
    soundFX.playSelect();
  }, []);

  const startCampaignLevel = useCallback(
    (lvl: number) => {
      launchBoard("campaign", getLevelConfig(lvl));
    },
    [launchBoard]
  );

  const startDailyChallenge = useCallback(() => {
    const fresh = getDailyChallengeConfig(new Date());
    launchBoard("daily", fresh.config);
  }, [launchBoard]);

  const startWeeklyChallenge = useCallback(() => {
    const fresh = getWeeklyChallengeConfig(new Date());
    launchBoard("weekly", fresh.config);
  }, [launchBoard]);

  const startGeneratedPuzzle = useCallback(
    (overrideSeed?: string) => {
      const seedToUse = overrideSeed ?? genSeed;
      setGenSeed(seedToUse);
      const cfg = buildGeneratorConfig(genDifficulty, genGravity, seedToUse);
      launchBoard("generator", cfg);
    },
    [genDifficulty, genGravity, genSeed, launchBoard]
  );

  useEffect(() => {
    if (gameState !== "PLAYING") return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          soundFX.playGameOver();
          setGameState("GAME_OVER");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundFX.muted = next;
  };

  const toggleFullscreen = async () => {
    const el = rootRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Ignore if fullscreen is unsupported
    }
  };

  const handleTileClick = (r: number, c: number) => {
    if (gameState !== "PLAYING" || matchFx) return;
    const cell = grid[r]?.[c];
    if (!cell || !cell.tileId || cell.isBlocker) return;

    setHintPair(null);

    if (!selected) {
      setSelected({ r, c });
      soundFX.playSelect();
      return;
    }

    if (selected.r === r && selected.c === c) {
      setSelected(null);
      soundFX.playDeselect();
      return;
    }

    const firstCell = grid[selected.r][selected.c];
    if (firstCell.tileId !== cell.tileId) {
      setSelected({ r, c });
      soundFX.playSelect();
      return;
    }

    const path = findConnectPath(grid, selected, { r, c });
    if (!path) {
      soundFX.playInvalid();
      setInvalidPair([selected, { r, c }]);
      setSelected(null);
      setTimeout(() => setInvalidPair(null), 320);
      return;
    }

    const now = Date.now();
    const isCombo = now - lastMatchTimestampRef.current < 4200;
    lastMatchTimestampRef.current = now;
    const nextCombo = isCombo ? combo + 1 : 1;
    setCombo(nextCombo);

    const reward = computeMatchReward(selected, { r, c }, path, nextCombo);
    soundFX.playMatch(reward.starsEarned, nextCombo);

    const anchorRow = (selected.r + r) / 2;
    const anchorCol = (selected.c + c) / 2;

    setMatchFx({
      id: `${now}-${r}-${c}`,
      path,
      starsEarned: reward.starsEarned,
      pointsEarned: reward.pointsEarned,
      distance: reward.distance,
      isLongMatch: reward.isLongMatch,
      anchorRow,
      anchorCol,
    });
    setSelected(null);

    const matchedA = selected;
    const matchedB = { r, c };
    const nextScore = score + reward.pointsEarned;
    const nextLevelStars = levelStars + reward.starsEarned;
    const nextMoveCount = movesCount + 1;

    setScore(nextScore);
    setLevelStars(nextLevelStars);
    setMovesCount(nextMoveCount);

    updatePlayerProgress((prev) => ({
      ...prev,
      totalStars: prev.totalStars + reward.starsEarned,
      chestStars: prev.chestStars + reward.starsEarned,
      bestScore: Math.max(prev.bestScore, nextScore),
    }));

    setTimeout(() => {
      setMatchFx(null);
      setGrid((prevGrid) => {
        const cleared = prevGrid.map((row) => row.map((item) => ({ ...item })));
        cleared[matchedA.r][matchedA.c].tileId = null;
        cleared[matchedB.r][matchedB.c].tileId = null;

        const shifted = applyBoardGravity(
          cleared,
          activeConfig.gravity,
          nextMoveCount
        );
        const remaining = countRemainingTiles(shifted);

        if (remaining === 0) {
          const timeBonus = timeLeft * 12;
          const finalScore = nextScore + timeBonus;
          setScore(finalScore);
          soundFX.playWin();

          if (activeMode === "campaign") {
            const nextUnlockedCount = Math.min(
              FOOD_TILES.length,
              Math.max(
                progress.unlockedTileCount,
                getLevelConfig(currentLevel + 1).tileTypesCount
              )
            );
            updatePlayerProgress((prev) => ({
              ...prev,
              highestLevel: Math.max(prev.highestLevel, currentLevel + 1),
              bestScore: Math.max(prev.bestScore, finalScore),
              unlockedTileCount: nextUnlockedCount,
            }));
          } else if (activeMode === "daily") {
            const todayKey = dailyInfo.key;
            const yestKey = getYesterdayKey();
            const isFirstToday = progress.lastDailyKey !== todayKey;
            const bonus = isFirstToday ? activeConfig.bonusStars ?? 5 : 0;
            setBonusAwarded(bonus);
            updatePlayerProgress((prev) => ({
              ...prev,
              lastDailyKey: todayKey,
              dailyStreak: isFirstToday
                ? prev.lastDailyKey === yestKey
                  ? prev.dailyStreak + 1
                  : 1
                : prev.dailyStreak,
              totalStars: prev.totalStars + bonus,
              chestStars: prev.chestStars + bonus,
              challengesCompleted:
                prev.challengesCompleted + (isFirstToday ? 1 : 0),
              bestScore: Math.max(prev.bestScore, finalScore),
            }));
          } else if (activeMode === "weekly") {
            const wkKey = weeklyInfo.key;
            const isFirstWeek = progress.lastWeeklyKey !== wkKey;
            const bonus = isFirstWeek ? activeConfig.bonusStars ?? 10 : 0;
            setBonusAwarded(bonus);
            updatePlayerProgress((prev) => ({
              ...prev,
              lastWeeklyKey: wkKey,
              totalStars: prev.totalStars + bonus,
              chestStars: prev.chestStars + bonus,
              hints: prev.hints + (isFirstWeek ? 1 : 0),
              shuffles: prev.shuffles + (isFirstWeek ? 1 : 0),
              challengesCompleted:
                prev.challengesCompleted + (isFirstWeek ? 1 : 0),
              bestScore: Math.max(prev.bestScore, finalScore),
            }));
          } else {
            updatePlayerProgress((prev) => ({
              ...prev,
              bestScore: Math.max(prev.bestScore, finalScore),
            }));
          }

          setGameState("ROUND_SUMMARY");
          return shifted;
        }

        const validPairs = findAllValidPairs(shifted);
        if (validPairs.length === 0) {
          soundFX.playShuffle();
          showNotice("No moves left — Auto-shuffling board!");
          return shuffleRemainingTiles(shifted);
        }

        return shifted;
      });
    }, 240);
  };

  const handleUseHint = () => {
    if (gameState !== "PLAYING" || progress.hints <= 0) return;
    const pairs = findAllValidPairs(grid);
    if (pairs.length === 0) {
      setGrid(shuffleRemainingTiles(grid));
      showNotice("Board reshuffled!");
      return;
    }
    const best = pairs[0];
    setHintPair([best.a, best.b]);
    setSelected(null);
    soundFX.playHint();
    updatePlayerProgress((prev) => ({
      ...prev,
      hints: Math.max(0, prev.hints - 1),
    }));
  };

  const handleUseShuffle = () => {
    if (gameState !== "PLAYING" || progress.shuffles <= 0) return;
    setGrid((prev) => shuffleRemainingTiles(prev));
    setSelected(null);
    setHintPair(null);
    soundFX.playShuffle();
    showNotice("Board shuffled!");
    updatePlayerProgress((prev) => ({
      ...prev,
      shuffles: Math.max(0, prev.shuffles - 1),
    }));
  };

  const handleUseTimeBoost = () => {
    if (gameState !== "PLAYING" || progress.timeBoosts <= 0) return;
    setTimeLeft((prev) => prev + 20);
    soundFX.playHint();
    showNotice("+20 seconds added!");
    updatePlayerProgress((prev) => ({
      ...prev,
      timeBoosts: Math.max(0, prev.timeBoosts - 1),
    }));
  };

  const handleOpenChest = () => {
    if (progress.chestStars < CHEST_GOAL_STARS) return;
    soundFX.playChest();
    const nextUnlockedIdx = Math.min(
      FOOD_TILES.length,
      progress.unlockedTileCount + 2
    );
    const unlockedTile =
      nextUnlockedIdx > progress.unlockedTileCount
        ? FOOD_TILES[nextUnlockedIdx - 1]?.name ?? null
        : null;

    const rewards = {
      hints: 2,
      shuffles: 2,
      timeBoosts: 1,
      bonusScore: 250,
      newlyUnlockedTile: unlockedTile,
    };
    setChestRewards(rewards);
    setScore((s) => s + rewards.bonusScore);
    updatePlayerProgress((prev) => ({
      ...prev,
      chestStars: Math.max(0, prev.chestStars - CHEST_GOAL_STARS),
      chestsOpened: prev.chestsOpened + 1,
      hints: prev.hints + rewards.hints,
      shuffles: prev.shuffles + rewards.shuffles,
      timeBoosts: prev.timeBoosts + rewards.timeBoosts,
      unlockedTileCount: nextUnlockedIdx,
      bestScore: Math.max(prev.bestScore, score + rewards.bonusScore),
    }));
    setGameState("CHEST_OPENING");
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const remainingTiles = useMemo(() => countRemainingTiles(grid), [grid]);
  const chestPct = Math.min(
    100,
    Math.round((progress.chestStars / CHEST_GOAL_STARS) * 100)
  );
  const chestReady = progress.chestStars >= CHEST_GOAL_STARS;

  const toSvgPercent = useCallback(
    (pt: GridPoint) => {
      const totalC = activeConfig.cols + 0.8;
      const totalR = activeConfig.rows + 0.8;
      let cx = 50;
      if (pt.c === 0) cx = (0.2 / totalC) * 100;
      else if (pt.c === activeConfig.cols + 1)
        cx = ((activeConfig.cols + 0.6) / totalC) * 100;
      else cx = ((0.4 + (pt.c - 1) + 0.5) / totalC) * 100;

      let cy = 50;
      if (pt.r === 0) cy = (0.2 / totalR) * 100;
      else if (pt.r === activeConfig.rows + 1)
        cy = ((activeConfig.rows + 0.6) / totalR) * 100;
      else cy = ((0.4 + (pt.r - 1) + 0.5) / totalR) * 100;

      return { x: cx, y: cy };
    },
    [activeConfig.cols, activeConfig.rows]
  );

  const timerPct = Math.max(
    0,
    Math.min(100, (timeLeft / activeConfig.timeSeconds) * 100)
  );

  const visibleLevels = useMemo(() => {
    const maxLvl = Math.max(6, Math.min(12, progress.highestLevel + 1));
    return Array.from({ length: maxLvl }, (_, i) => i + 1);
  }, [progress.highestLevel]);

  const activeModeLabel = useMemo(() => {
    if (activeMode === "campaign") return `Level ${currentLevel}`;
    if (activeMode === "daily") return `Daily (${dailyInfo.label})`;
    if (activeMode === "weekly") return `Weekly (${weeklyInfo.key})`;
    return `${DIFFICULTY_PRESETS[genDifficulty].label} Generator`;
  }, [
    activeMode,
    currentLevel,
    dailyInfo.label,
    genDifficulty,
    weeklyInfo.key,
  ]);

  return (
    <main
      ref={rootRef}
      className="relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-[#13141E] text-[#F9FAFF] select-none touch-manipulation"
    >
      <div
        className="pointer-events-none fixed inset-0 opacity-25"
        style={{
          background:
            "radial-gradient(circle at 50% 20%, rgba(104, 66, 255, 0.35), transparent 60%), radial-gradient(circle at 80% 85%, rgba(255, 172, 74, 0.18), transparent 55%)",
        }}
      />

      {/* TOP TABLET HUD */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-[#28293D] bg-[#1A1B28]/95 px-4 py-2.5 sm:px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {gameState !== "TITLE_MENU" ? (
            <button
              type="button"
              onClick={() => setGameState("TITLE_MENU")}
              className="flex min-h-[44px] items-center gap-2 rounded-xl border border-[#2F3148] bg-[#212233] px-3.5 text-sm font-bold text-[#F9FAFF] transition-colors active:scale-95 hover:bg-[#28293D] cursor-pointer whitespace-nowrap"
            >
              <Grid2x2 className="h-4 w-4 text-[#A48EFF]" />
              <span>Menu</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[#373952]">
                <Image
                  src={GAME_COVER_IMAGE}
                  alt="Tasty Match icon"
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="font-heading text-base sm:text-lg font-extrabold leading-tight text-white">
                  Tasty Match: Mahjong Pairs
                </h1>
                <p className="text-xs text-[#AAADBE] font-mono tabular-nums">
                  {progress.totalStars} ★ · {progress.chestsOpened} Chests
                  {progress.dailyStreak > 0
                    ? ` · ${progress.dailyStreak}d Streak`
                    : ""}
                </p>
              </div>
            </div>
          )}

          {gameState !== "TITLE_MENU" && (
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-sm sm:text-base font-extrabold text-white">
                  {activeModeLabel}
                </span>
                <span className="hidden md:inline text-xs text-[#AAADBE]">
                  · {activeConfig.title}
                </span>
              </div>
              <p className="text-xs text-[#878A9E] font-mono tabular-nums">
                {Math.floor(remainingTiles / 2)} pairs left ·{" "}
                {activeConfig.rows}x{activeConfig.cols}
              </p>
            </div>
          )}
        </div>

        {/* Active Countdown Timer */}
        {gameState !== "TITLE_MENU" && (
          <div className="flex flex-1 min-w-[180px] max-w-[300px] flex-col gap-1">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold tabular-nums">
              <span className="flex items-center gap-1.5 text-[#F9FAFF]">
                <Clock
                  className={`h-4 w-4 ${
                    timeLeft <= 15
                      ? "text-[#E70D5C]"
                      : timeLeft <= 35
                        ? "text-[#FFAC4A]"
                        : "text-[#4AF0A7]"
                  }`}
                />
                <span className="font-mono">{formatTime(timeLeft)}</span>
              </span>
              {combo >= 2 && (
                <span className="text-[#FFAC4A] font-extrabold">
                  {combo}x Combo
                </span>
              )}
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#28293D]">
              <div
                className={`h-full transition-all duration-500 ${
                  timeLeft <= 15
                    ? "bg-[#E70D5C]"
                    : timeLeft <= 35
                      ? "bg-[#FFAC4A]"
                      : "bg-[#4AF0A7]"
                }`}
                style={{ width: `${timerPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {gameState !== "TITLE_MENU" && (
            <div className="mr-1 text-right hidden sm:block">
              <div className="text-[11px] text-[#878A9E]">Score</div>
              <div className="font-mono text-base font-extrabold text-white tabular-nums">
                {score.toLocaleString()}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleOpenChest}
            disabled={!chestReady}
            title={
              chestReady
                ? "Tap to open Reward Chest!"
                : `Collect ${CHEST_GOAL_STARS - progress.chestStars} more stars to open chest`
            }
            className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-3 text-xs font-bold transition-all whitespace-nowrap ${
              chestReady
                ? "border-[#FFAC4A] bg-[#FFAC4A]/20 text-[#FFAC4A] hover:bg-[#FFAC4A]/30 active:scale-95 cursor-pointer"
                : "border-[#2F3148] bg-[#212233] text-[#D0D2DE] cursor-default"
            }`}
          >
            <Gift className="h-4 w-4 shrink-0 text-[#FFAC4A]" />
            <div className="flex flex-col items-start">
              <span className="font-mono text-xs leading-none tabular-nums">
                {Math.min(progress.chestStars, CHEST_GOAL_STARS)}/{CHEST_GOAL_STARS} ★
              </span>
              <div className="mt-1 h-1.5 w-14 overflow-hidden rounded-full bg-[#0C0D14]">
                <div
                  className="h-full bg-[#FFAC4A] transition-all duration-300"
                  style={{ width: `${chestPct}%` }}
                />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPantryOpen(true)}
            className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#2F3148] bg-[#212233] px-3 text-xs font-bold text-[#D0D2DE] hover:bg-[#28293D] hover:text-white active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Star className="h-4 w-4 text-[#FFAC4A]" />
            <span className="hidden sm:inline">
              Tiles ({progress.unlockedTileCount}/{FOOD_TILES.length})
            </span>
          </button>

          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Unmute sound" : "Mute sound"}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-xl border border-[#2F3148] bg-[#212233] text-[#D0D2DE] hover:bg-[#28293D] hover:text-white active:scale-95 cursor-pointer"
          >
            {muted ? (
              <VolumeX className="h-5 w-5 text-[#E70D5C]" />
            ) : (
              <Volume2 className="h-5 w-5 text-[#4AF0A7]" />
            )}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-xl border border-[#2F3148] bg-[#212233] text-[#D0D2DE] hover:bg-[#28293D] hover:text-white active:scale-95 cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      {/* MAIN TABLET ARENA */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-3 sm:p-5">
        {/* TITLE / MODE HUB SCREEN */}
        {gameState === "TITLE_MENU" && (
          <div className="w-full max-w-5xl rounded-3xl border border-[#2F3148] bg-[#1A1B28]/95 p-5 sm:p-6 shadow-2xl">
            {/* Tablet Mode Tabs */}
            <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl border border-[#2F3148] bg-[#13141E] p-1.5">
              <button
                type="button"
                onClick={() => setMenuTab("campaign")}
                className={`flex min-h-[46px] items-center justify-center gap-2 rounded-xl px-3 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  menuTab === "campaign"
                    ? "bg-[#6842FF] text-white shadow-md shadow-[#6842FF]/25"
                    : "text-[#AAADBE] hover:bg-[#212233] hover:text-white"
                }`}
              >
                <Grid2x2 className="h-4 w-4 shrink-0" />
                <span>Campaign</span>
              </button>

              <button
                type="button"
                onClick={() => setMenuTab("challenges")}
                className={`flex min-h-[46px] items-center justify-center gap-2 rounded-xl px-3 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  menuTab === "challenges"
                    ? "bg-[#6842FF] text-white shadow-md shadow-[#6842FF]/25"
                    : "text-[#AAADBE] hover:bg-[#212233] hover:text-white"
                }`}
              >
                <Calendar className="h-4 w-4 shrink-0" />
                <span>Daily &amp; Weekly</span>
              </button>

              <button
                type="button"
                onClick={() => setMenuTab("generator")}
                className={`flex min-h-[46px] items-center justify-center gap-2 rounded-xl px-3 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  menuTab === "generator"
                    ? "bg-[#6842FF] text-white shadow-md shadow-[#6842FF]/25"
                    : "text-[#AAADBE] hover:bg-[#212233] hover:text-white"
                }`}
              >
                <Wand2 className="h-4 w-4 shrink-0" />
                <span>Puzzle Generator</span>
              </button>
            </div>

            {/* TAB 1: CAMPAIGN */}
            {menuTab === "campaign" && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-12 items-stretch">
                <div className="relative overflow-hidden rounded-2xl border border-[#2F3148] md:col-span-6 min-h-[240px] sm:min-h-[300px]">
                  <Image
                    src={GAME_COVER_IMAGE}
                    alt="Tasty Match: Mahjong Pairs"
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0C0D14]/92 via-[#0C0D14]/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-xs font-bold text-[#FFAC4A]">
                      Best Score: {progress.bestScore.toLocaleString()} ·{" "}
                      {progress.chestsOpened} Chests Opened
                    </div>
                    <h2 className="mt-1 font-heading text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                      Tasty Match: Mahjong Pairs
                    </h2>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-5 md:col-span-6">
                  <div className="space-y-2.5 text-sm text-[#D0D2DE]">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#6842FF]/25 font-mono text-xs font-bold text-[#A48EFF]">
                        1
                      </span>
                      <span>
                        Tap pairs of identical food tiles connected with{" "}
                        <strong className="text-white">2 turns or fewer</strong>.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#FFAC4A]/20 font-mono text-xs font-bold text-[#FFAC4A]">
                        2
                      </span>
                      <span>
                        Connect{" "}
                        <strong className="text-white">distant tiles</strong>{" "}
                        across the board to earn up to{" "}
                        <strong className="text-[#FFAC4A]">3 ★</strong> per match.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#4AF0A7]/20 font-mono text-xs font-bold text-[#4AF0A7]">
                        3
                      </span>
                      <span>
                        Fill 25 ★ to open the{" "}
                        <strong className="text-white">Reward Chest</strong>{" "}
                        &amp; unlock new food tiles and tougher layouts.
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#AAADBE]">
                      <span>Choose Table Level</span>
                      <span className="font-mono text-[#D0D2DE]">
                        {getLevelConfig(currentLevel).title}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {visibleLevels.map((lvl) => {
                        const unlocked = lvl <= progress.highestLevel;
                        const isSelected = currentLevel === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            disabled={!unlocked}
                            onClick={() => setCurrentLevel(lvl)}
                            className={`flex min-h-[48px] items-center justify-center rounded-xl border text-sm font-bold transition-all ${
                              isSelected
                                ? "border-[#8668FF] bg-[#6842FF] text-white shadow-md shadow-[#6842FF]/30"
                                : unlocked
                                  ? "border-[#373952] bg-[#212233] text-[#F9FAFF] hover:border-[#6842FF] active:scale-95 cursor-pointer"
                                  : "border-[#28293D] bg-[#13141E] text-[#666A7F] cursor-not-allowed"
                            }`}
                          >
                            {unlocked ? (
                              <span className="font-mono">Lv.{lvl}</span>
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => startCampaignLevel(currentLevel)}
                      className="flex min-h-[54px] flex-1 items-center justify-center gap-2.5 rounded-full bg-[#6842FF] px-6 font-heading text-base sm:text-lg font-extrabold text-white shadow-lg shadow-[#6842FF]/35 transition-all hover:bg-[#8668FF] active:scale-[0.98] cursor-pointer whitespace-nowrap"
                    >
                      <Play className="h-5 w-5 fill-current" />
                      Play Level {currentLevel}
                    </button>
                    {chestReady && (
                      <button
                        type="button"
                        onClick={handleOpenChest}
                        className="flex min-h-[54px] items-center gap-2 rounded-full border border-[#FFAC4A] bg-[#FFAC4A]/20 px-5 text-sm font-extrabold text-[#FFAC4A] hover:bg-[#FFAC4A]/30 active:scale-95 cursor-pointer whitespace-nowrap"
                      >
                        <Gift className="h-5 w-5" />
                        Open Chest
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DAILY & WEEKLY CHALLENGES */}
            {menuTab === "challenges" && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-white">
                      Daily &amp; Weekly Challenges
                    </h2>
                    <p className="text-sm text-[#AAADBE]">
                      Seeded puzzle boards that reset every day and every Monday
                      for bonus chest stars and power-ups.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl border border-[#2F3148] bg-[#13141E] px-4 py-2.5 text-xs">
                    <div className="flex items-center gap-1.5 text-[#FFAC4A] font-bold">
                      <Flame className="h-4 w-4" />
                      <span className="font-mono tabular-nums">
                        {progress.dailyStreak} Day Streak
                      </span>
                    </div>
                    <div className="h-4 w-px bg-[#2F3148]" />
                    <div className="font-mono text-[#D0D2DE] tabular-nums">
                      {progress.challengesCompleted} Cleared
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Daily Challenge Card */}
                  <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#373952] bg-[#212233] p-5">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4AF0A7]">
                          <Calendar className="h-4 w-4" />
                          Daily Challenge · {dailyInfo.label}
                        </span>
                        <span className="font-mono text-xs text-[#AAADBE] tabular-nums">
                          Resets in {dailyCountdown}
                        </span>
                      </div>

                      <h3 className="mt-2 font-heading text-xl font-extrabold text-white">
                        {dailyInfo.config.title}
                      </h3>
                      <p className="mt-1 text-sm text-[#AAADBE]">
                        {dailyInfo.config.subtitle} ·{" "}
                        {formatTime(dailyInfo.config.timeSeconds)} timer
                      </p>

                      <div className="mt-4 flex items-center justify-between rounded-xl border border-[#2F3148] bg-[#13141E] px-3.5 py-2.5 text-xs">
                        <span className="text-[#D0D2DE]">First Clear Reward</span>
                        <span className="font-mono font-bold text-[#FFAC4A]">
                          +5 Bonus ★
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={startDailyChallenge}
                      className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full font-heading text-sm sm:text-base font-extrabold transition-all active:scale-98 cursor-pointer ${
                        dailyDoneToday
                          ? "border border-[#4AF0A7]/50 bg-[#4AF0A7]/15 text-[#4AF0A7] hover:bg-[#4AF0A7]/25"
                          : "bg-[#6842FF] text-white shadow-lg shadow-[#6842FF]/30 hover:bg-[#8668FF]"
                      }`}
                    >
                      {dailyDoneToday ? (
                        <>
                          <CheckCircle2 className="h-5 w-5" />
                          Completed Today · Replay Daily
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5 fill-current" />
                          Play Daily Challenge
                        </>
                      )}
                    </button>
                  </div>

                  {/* Weekly Challenge Card */}
                  <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#373952] bg-[#212233] p-5">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FFAC4A]">
                          <CalendarDays className="h-4 w-4" />
                          Weekly Challenge · {weeklyInfo.key}
                        </span>
                        <span className="font-mono text-xs text-[#AAADBE] tabular-nums">
                          Resets in {weeklyCountdown}
                        </span>
                      </div>

                      <h3 className="mt-2 font-heading text-xl font-extrabold text-white">
                        {weeklyInfo.config.title}
                      </h3>
                      <p className="mt-1 text-sm text-[#AAADBE]">
                        {weeklyInfo.config.subtitle} ·{" "}
                        {formatTime(weeklyInfo.config.timeSeconds)} timer
                      </p>

                      <div className="mt-4 flex items-center justify-between rounded-xl border border-[#2F3148] bg-[#13141E] px-3.5 py-2.5 text-xs">
                        <span className="text-[#D0D2DE]">First Clear Reward</span>
                        <span className="font-mono font-bold text-[#FFAC4A]">
                          +10 Bonus ★ · +1 Hint · +1 Shuffle
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={startWeeklyChallenge}
                      className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full font-heading text-sm sm:text-base font-extrabold transition-all active:scale-98 cursor-pointer ${
                        weeklyDoneThisWeek
                          ? "border border-[#4AF0A7]/50 bg-[#4AF0A7]/15 text-[#4AF0A7] hover:bg-[#4AF0A7]/25"
                          : "bg-[#FFAC4A] text-[#0C0D14] shadow-lg shadow-[#FFAC4A]/25 hover:brightness-105"
                      }`}
                    >
                      {weeklyDoneThisWeek ? (
                        <>
                          <CheckCircle2 className="h-5 w-5" />
                          Completed This Week · Replay
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5 fill-current" />
                          Play Weekly Challenge
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PUZZLE GENERATOR (EASY / MEDIUM / HARD / EXPERT) */}
            {menuTab === "generator" && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-white">
                      Custom Puzzle Generator
                    </h2>
                    <p className="text-sm text-[#AAADBE]">
                      Pick a difficulty tier and board shift style to generate an
                      instant solvable Mahjong Pairs board.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-[#2F3148] bg-[#13141E] px-3 py-1.5">
                    <span className="text-xs text-[#878A9E]">Seed:</span>
                    <input
                      type="text"
                      value={genSeed}
                      onChange={(e) =>
                        setGenSeed(e.target.value.toUpperCase().slice(0, 12))
                      }
                      aria-label="Puzzle seed code"
                      className="w-24 bg-transparent font-mono text-sm font-bold text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setGenSeed(randomSeedCode())}
                      title="Generate random seed"
                      className="flex h-9 items-center gap-1 rounded-lg bg-[#28293D] px-2.5 text-xs font-semibold text-[#D0D2DE] hover:bg-[#373952] hover:text-white cursor-pointer"
                    >
                      <Dices className="h-3.5 w-3.5" />
                      <span>New</span>
                    </button>
                  </div>
                </div>

                {/* Difficulty Cards: Easy, Medium, Hard, Expert */}
                <div>
                  <div className="mb-2 text-xs font-semibold text-[#AAADBE]">
                    Difficulty Tier
                  </div>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {(
                      ["easy", "medium", "hard", "expert"] as DifficultyLevel[]
                    ).map((tier) => {
                      const preset = DIFFICULTY_PRESETS[tier];
                      const active = genDifficulty === tier;
                      return (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setGenDifficulty(tier)}
                          className={`flex min-h-[104px] flex-col justify-between rounded-2xl border p-4 text-left transition-all cursor-pointer active:scale-98 ${
                            active
                              ? "border-[#8668FF] bg-[#6842FF]/20 ring-2 ring-[#6842FF]"
                              : "border-[#2F3148] bg-[#212233] hover:border-[#474967]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-heading text-base font-extrabold text-white">
                              {preset.label}
                            </span>
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: preset.accentColor }}
                            />
                          </div>
                          <div className="mt-2 space-y-0.5 text-xs text-[#D0D2DE]">
                            <div>
                              {preset.rows}x{preset.cols} Grid ·{" "}
                              {Math.floor(
                                (preset.rows * preset.cols -
                                  preset.blockerCount) /
                                  2
                              )}{" "}
                              pairs
                            </div>
                            <div className="text-[#AAADBE]">
                              {preset.tileTypesCount} tiles ·{" "}
                              {preset.blockerCount} blocks
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Gravity / Board Shift Selector */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#2F3148] bg-[#13141E] p-3.5">
                  <div className="text-xs font-semibold text-[#AAADBE]">
                    Tile Shift Rule:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: "auto", label: "Auto (By Difficulty)" },
                        { id: "none", label: "Static" },
                        { id: "down", label: "Drop Down" },
                        { id: "center", label: "Center Pull" },
                        { id: "alternate", label: "Alternating" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setGenGravity(opt.id)}
                        className={`min-h-[40px] rounded-xl border px-3 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          genGravity === opt.id
                            ? "border-[#8668FF] bg-[#6842FF] text-white"
                            : "border-[#2F3148] bg-[#212233] text-[#D0D2DE] hover:border-[#474967]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Launch Generated Puzzle */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => startGeneratedPuzzle(genSeed || randomSeedCode())}
                    className="flex min-h-[54px] flex-1 items-center justify-center gap-2.5 rounded-full bg-[#6842FF] px-6 font-heading text-base sm:text-lg font-extrabold text-white shadow-lg shadow-[#6842FF]/35 transition-all hover:bg-[#8668FF] active:scale-[0.98] cursor-pointer whitespace-nowrap"
                  >
                    <Wand2 className="h-5 w-5" />
                    Generate &amp; Play {DIFFICULTY_PRESETS[genDifficulty].label}
                  </button>
                  <button
                    type="button"
                    onClick={() => startGeneratedPuzzle(randomSeedCode())}
                    className="flex min-h-[54px] items-center gap-2 rounded-full border border-[#373952] bg-[#212233] px-5 text-sm font-bold text-[#F9FAFF] hover:bg-[#28293D] active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <Dices className="h-5 w-5 text-[#4AF0A7]" />
                    Quick Random
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ACTIVE PLAY BOARD */}
        {gameState !== "TITLE_MENU" && grid.length > 0 && (
          <div className="flex w-full flex-col items-center justify-center gap-3">
            <div
              className="relative w-full rounded-2xl sm:rounded-3xl border border-[#4A3222] bg-gradient-to-b from-[#4B3222] via-[#3A261A] to-[#2C1C12] p-2 sm:p-3.5 shadow-[inset_0_2px_14px_rgba(255,215,170,0.14),0_16px_40px_rgba(0,0,0,0.6)]"
              style={{
                maxWidth: `min(96vw, 900px, calc((100dvh - 190px) * ${activeConfig.cols} / ${activeConfig.rows}))`,
              }}
            >
              <AnimatePresence>
                {statusNotice && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="pointer-events-none absolute top-3 left-1/2 z-30 -translate-x-1/2 rounded-full bg-[#0C0D14]/92 px-4 py-1.5 text-xs sm:text-sm font-bold text-[#4AF0A7] border border-[#4AF0A7]/40 shadow-lg whitespace-nowrap"
                  >
                    {statusNotice}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative w-full">
                <div
                  className="grid gap-1 sm:gap-1.5 md:gap-2"
                  style={{
                    gridTemplateColumns: `0.4fr repeat(${activeConfig.cols}, minmax(0, 1fr)) 0.4fr`,
                    gridTemplateRows: `0.4fr repeat(${activeConfig.rows}, minmax(0, 1fr)) 0.4fr`,
                  }}
                >
                  {Array.from({ length: activeConfig.rows + 2 }).map((_, pr) =>
                    Array.from({ length: activeConfig.cols + 2 }).map(
                      (__, pc) => {
                        const isBorder =
                          pr === 0 ||
                          pr === activeConfig.rows + 1 ||
                          pc === 0 ||
                          pc === activeConfig.cols + 1;

                        if (isBorder) {
                          return (
                            <div
                              key={`pad-${pr}-${pc}`}
                              className="pointer-events-none"
                              aria-hidden="true"
                            />
                          );
                        }

                        const r = pr - 1;
                        const c = pc - 1;
                        const cell = grid[r]?.[c];
                        if (!cell) return <div key={`empty-${pr}-${pc}`} />;

                        if (cell.isBlocker) {
                          return (
                            <div
                              key={cell.uid}
                              className="aspect-square flex items-center justify-center rounded-xl border-b-4 border-[#1B1D2B] bg-gradient-to-b from-[#373952] to-[#28293D] shadow-inner"
                              title="Stone block"
                            >
                              <div className="h-3.5 w-3.5 rounded-sm border border-[#474967] bg-[#212233]" />
                            </div>
                          );
                        }

                        if (!cell.tileId) {
                          return (
                            <div
                              key={`cleared-${r}-${c}`}
                              className="aspect-square rounded-xl bg-[#24170F]/35"
                            />
                          );
                        }

                        const tileMeta = FOOD_TILES.find(
                          (t) => t.id === cell.tileId
                        );
                        const isSelected =
                          selected?.r === r && selected?.c === c;
                        const isHinted =
                          hintPair &&
                          ((hintPair[0].r === r && hintPair[0].c === c) ||
                            (hintPair[1].r === r && hintPair[1].c === c));
                        const isInvalid =
                          invalidPair &&
                          ((invalidPair[0].r === r && invalidPair[0].c === c) ||
                            (invalidPair[1].r === r && invalidPair[1].c === c));

                        return (
                          <motion.button
                            key={`${r}-${c}-${cell.tileId}`}
                            type="button"
                            layout
                            transition={{ duration: 0.16, ease: "easeOut" }}
                            onClick={() => handleTileClick(r, c)}
                            aria-label={tileMeta?.name ?? cell.tileId}
                            className={`group relative aspect-square flex items-center justify-center rounded-xl p-1 sm:p-1.5 transition-transform duration-150 active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#8668FF] ${
                              isSelected
                                ? "-translate-y-1 bg-[#FFFDF7] ring-3 ring-[#6842FF] shadow-[0_6px_18px_rgba(104,66,255,0.55)] border-b-[4px] border-[#B4A1FF]"
                                : isHinted
                                  ? "-translate-y-0.5 bg-[#ECFDF5] ring-3 ring-[#4AF0A7] shadow-[0_0_16px_rgba(74,240,167,0.65)] border-b-[4px] border-[#34D399]"
                                  : isInvalid
                                    ? "bg-[#FFF1F2] ring-2 ring-[#E70D5C] border-b-[4px] border-[#FDA4AF]"
                                    : "bg-[#FFFBF2] hover:-translate-y-0.5 border-b-[4px] border-[#DEC9AA] shadow-[0_3px_6px_rgba(0,0,0,0.35)]"
                            }`}
                          >
                            <div
                              className="flex h-full w-full items-center justify-center rounded-lg p-0.5"
                              style={{
                                backgroundColor:
                                  tileMeta?.accentBg ?? "#FFFBF2",
                              }}
                            >
                              <FoodTileArt
                                id={cell.tileId}
                                className="h-full w-full drop-shadow-xs"
                              />
                            </div>
                          </motion.button>
                        );
                      }
                    )
                  )}
                </div>

                {matchFx && (
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
                  >
                    <polyline
                      points={matchFx.path
                        .map((pt) => {
                          const p = toSvgPercent(pt);
                          return `${p.x},${p.y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#FFAC4A"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        filter: "drop-shadow(0 0 4px rgba(255, 172, 74, 0.9))",
                      }}
                    />
                    <polyline
                      points={matchFx.path
                        .map((pt) => {
                          const p = toSvgPercent(pt);
                          return `${p.x},${p.y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#FFFBEB"
                      strokeWidth="0.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}

                <AnimatePresence>
                  {matchFx && (
                    <motion.div
                      key={matchFx.id}
                      initial={{ opacity: 0, scale: 0.7, y: 0 }}
                      animate={{ opacity: 1, scale: 1.05, y: -18 }}
                      exit={{ opacity: 0, y: -32 }}
                      transition={{ duration: 0.28 }}
                      className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0C0D14]/92 px-3 py-1 text-xs sm:text-sm font-extrabold text-[#FFAC4A] border border-[#FFAC4A]/50 shadow-lg whitespace-nowrap"
                      style={{
                        left: `${toSvgPercent({ r: matchFx.anchorRow + 1, c: matchFx.anchorCol + 1 }).x}%`,
                        top: `${toSvgPercent({ r: matchFx.anchorRow + 1, c: matchFx.anchorCol + 1 }).y}%`,
                      }}
                    >
                      +{matchFx.starsEarned} ★{" "}
                      {matchFx.isLongMatch
                        ? "· Long Match!"
                        : `+${matchFx.pointsEarned}`}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Ergonomic Tablet Bottom Power-Up Dock */}
            <div className="flex w-full max-w-[900px] flex-wrap items-center justify-between gap-2.5 px-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseHint}
                  disabled={progress.hints <= 0 || gameState !== "PLAYING"}
                  className="flex min-h-[48px] items-center gap-2 rounded-xl border border-[#2F3148] bg-[#212233] px-4 text-sm font-bold text-[#F9FAFF] transition-colors hover:border-[#4AF0A7] hover:bg-[#28293D] active:scale-95 disabled:opacity-45 cursor-pointer whitespace-nowrap"
                >
                  <Lightbulb className="h-4 w-4 text-[#4AF0A7]" />
                  <span>Hint</span>
                  <span className="font-mono text-[#4AF0A7] tabular-nums">
                    ({progress.hints})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleUseShuffle}
                  disabled={progress.shuffles <= 0 || gameState !== "PLAYING"}
                  className="flex min-h-[48px] items-center gap-2 rounded-xl border border-[#2F3148] bg-[#212233] px-4 text-sm font-bold text-[#F9FAFF] transition-colors hover:border-[#8668FF] hover:bg-[#28293D] active:scale-95 disabled:opacity-45 cursor-pointer whitespace-nowrap"
                >
                  <Shuffle className="h-4 w-4 text-[#A48EFF]" />
                  <span>Shuffle</span>
                  <span className="font-mono text-[#A48EFF] tabular-nums">
                    ({progress.shuffles})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleUseTimeBoost}
                  disabled={progress.timeBoosts <= 0 || gameState !== "PLAYING"}
                  className="flex min-h-[48px] items-center gap-2 rounded-xl border border-[#2F3148] bg-[#212233] px-4 text-sm font-bold text-[#F9FAFF] transition-colors hover:border-[#FFAC4A] hover:bg-[#28293D] active:scale-95 disabled:opacity-45 cursor-pointer whitespace-nowrap"
                >
                  <Clock className="h-4 w-4 text-[#FFAC4A]" />
                  <span>+20s</span>
                  <span className="font-mono text-[#FFAC4A] tabular-nums">
                    ({progress.timeBoosts})
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setGameState((s) => (s === "PAUSED" ? "PLAYING" : "PAUSED"))
                  }
                  className="flex min-h-[48px] items-center gap-2 rounded-xl border border-[#2F3148] bg-[#212233] px-4 text-sm font-bold text-[#D0D2DE] hover:bg-[#28293D] hover:text-white active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  {gameState === "PAUSED" ? (
                    <>
                      <Play className="h-4 w-4" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4" />
                      Pause
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => launchBoard(activeMode, activeConfig)}
                  className="flex min-h-[48px] items-center gap-2 rounded-xl border border-[#2F3148] bg-[#212233] px-4 text-sm font-bold text-[#D0D2DE] hover:bg-[#28293D] hover:text-white active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PAUSE MODAL */}
      {gameState === "PAUSED" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0C0D14]/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-[#2F3148] bg-[#212233] p-6 text-center shadow-2xl">
            <h3 className="font-heading text-2xl font-bold text-white">
              Game Paused
            </h3>
            <p className="mt-2 text-sm text-[#AAADBE]">
              Timer paused on {activeModeLabel} ({activeConfig.title}).
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setGameState("PLAYING")}
                className="min-h-[48px] w-full rounded-full bg-[#6842FF] font-heading text-sm font-bold text-white hover:bg-[#8668FF] active:scale-98 cursor-pointer"
              >
                Resume Game
              </button>
              <button
                type="button"
                onClick={() => launchBoard(activeMode, activeConfig)}
                className="min-h-[48px] w-full rounded-full bg-[#28293D] text-sm font-semibold text-[#D0D2DE] hover:bg-[#373952] active:scale-98 cursor-pointer"
              >
                Restart Board
              </button>
              <button
                type="button"
                onClick={() => setGameState("TITLE_MENU")}
                className="min-h-[44px] w-full rounded-full text-sm font-semibold text-[#AAADBE] hover:text-white cursor-pointer"
              >
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY / ROUND SUMMARY MODAL */}
      {gameState === "ROUND_SUMMARY" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0C0D14]/85 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl border border-[#373952] bg-[#212233] p-6 text-center shadow-2xl"
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#4AF0A7]/15 text-[#4AF0A7]">
              <Trophy className="h-7 w-7" />
            </div>
            <h3 className="font-heading text-2xl font-extrabold text-white">
              {activeMode === "campaign"
                ? `Level ${currentLevel} Cleared!`
                : activeMode === "daily"
                  ? "Daily Challenge Cleared!"
                  : activeMode === "weekly"
                    ? "Weekly Challenge Cleared!"
                    : `${DIFFICULTY_PRESETS[genDifficulty].label} Puzzle Cleared!`}
            </h3>
            <p className="mt-1 text-sm text-[#AAADBE]">
              {activeConfig.title} finished with {timeLeft}s left
            </p>

            {bonusAwarded > 0 && (
              <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-[#FFAC4A]/40 bg-[#FFAC4A]/15 px-3 py-2 text-xs font-bold text-[#FFAC4A]">
                <Sparkles className="h-4 w-4" />
                <span>
                  Challenge Bonus: +{bonusAwarded} ★{" "}
                  {activeMode === "weekly" ? "· +1 Hint · +1 Shuffle" : ""}
                </span>
              </div>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-[#13141E] p-3.5 border border-[#2F3148]">
              <div>
                <div className="text-[11px] text-[#878A9E]">Stars</div>
                <div className="font-mono text-lg font-bold text-[#FFAC4A] tabular-nums">
                  +{levelStars + bonusAwarded} ★
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#878A9E]">Time Bonus</div>
                <div className="font-mono text-lg font-bold text-[#4AF0A7] tabular-nums">
                  +{timeLeft * 12}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#878A9E]">Score</div>
                <div className="font-mono text-lg font-bold text-white tabular-nums">
                  {score.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-[#1A1B28] p-3.5 border border-[#2F3148]">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-[#D0D2DE]">
                  <Gift className="h-4 w-4 text-[#FFAC4A]" />
                  Reward Chest Progress
                </span>
                <span className="font-mono text-[#FFAC4A] tabular-nums">
                  {progress.chestStars}/{CHEST_GOAL_STARS} ★
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#0C0D14]">
                <div
                  className="h-full bg-[#FFAC4A] transition-all duration-300"
                  style={{ width: `${chestPct}%` }}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              {chestReady && (
                <button
                  type="button"
                  onClick={handleOpenChest}
                  className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[#FFAC4A] font-heading text-sm font-extrabold text-[#0C0D14] hover:brightness-105 active:scale-98 cursor-pointer"
                >
                  <Gift className="h-5 w-5" />
                  Collect &amp; Open Treasure Chest!
                </button>
              )}

              {activeMode === "campaign" && (
                <button
                  type="button"
                  onClick={() => startCampaignLevel(currentLevel + 1)}
                  className="flex min-h-[50px] w-full items-center justify-center gap-1.5 rounded-full bg-[#6842FF] font-heading text-sm font-bold text-white hover:bg-[#8668FF] active:scale-98 cursor-pointer"
                >
                  <span>Next Level (Level {currentLevel + 1})</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}

              {activeMode === "generator" && (
                <button
                  type="button"
                  onClick={() => startGeneratedPuzzle(randomSeedCode())}
                  className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[#6842FF] font-heading text-sm font-bold text-white hover:bg-[#8668FF] active:scale-98 cursor-pointer"
                >
                  <Dices className="h-4 w-4" />
                  <span>
                    Generate New {DIFFICULTY_PRESETS[genDifficulty].label} Puzzle
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => launchBoard(activeMode, activeConfig)}
                className="min-h-[46px] w-full rounded-full bg-[#28293D] text-sm font-semibold text-[#D0D2DE] hover:bg-[#373952] cursor-pointer"
              >
                Replay Board
              </button>

              <button
                type="button"
                onClick={() => setGameState("TITLE_MENU")}
                className="min-h-[42px] w-full rounded-full text-xs font-semibold text-[#AAADBE] hover:text-white cursor-pointer"
              >
                Back to Mode Menu
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* CHEST OPENING MODAL */}
      {gameState === "CHEST_OPENING" && chestRewards && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0C0D14]/90 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl border border-[#FFAC4A]/50 bg-[#212233] p-6 text-center shadow-2xl"
          >
            <div className="relative mx-auto mb-3 h-40 w-full overflow-hidden rounded-2xl border border-[#373952]">
              <Image
                src={CHEST_ARTWORK_IMAGE}
                alt="Reward Treasure Chest"
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FFAC4A]">
              <Sparkles className="h-4 w-4" />
              Chest Collected!
            </div>
            <h3 className="mt-1 font-heading text-2xl font-extrabold text-white">
              Prizes Unlocked
            </h3>

            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl bg-[#13141E] p-3 border border-[#2F3148]">
                <div className="font-mono text-lg font-bold text-[#4AF0A7]">
                  +{chestRewards.hints}
                </div>
                <div className="text-[#AAADBE]">Hints</div>
              </div>
              <div className="rounded-xl bg-[#13141E] p-3 border border-[#2F3148]">
                <div className="font-mono text-lg font-bold text-[#A48EFF]">
                  +{chestRewards.shuffles}
                </div>
                <div className="text-[#AAADBE]">Shuffles</div>
              </div>
              <div className="rounded-xl bg-[#13141E] p-3 border border-[#2F3148]">
                <div className="font-mono text-lg font-bold text-[#FFAC4A]">
                  +{chestRewards.timeBoosts}
                </div>
                <div className="text-[#AAADBE]">+20s Boost</div>
              </div>
            </div>

            {chestRewards.newlyUnlockedTile && (
              <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#4AF0A7]/10 px-3 py-2.5 text-xs font-semibold text-[#4AF0A7] border border-[#4AF0A7]/30">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                New Tile Unlocked: {chestRewards.newlyUnlockedTile}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (activeMode === "campaign") {
                  startCampaignLevel(currentLevel + 1);
                } else if (activeMode === "generator") {
                  startGeneratedPuzzle(randomSeedCode());
                } else {
                  setGameState("TITLE_MENU");
                }
              }}
              className="mt-5 min-h-[50px] w-full rounded-full bg-[#6842FF] font-heading text-sm font-bold text-white hover:bg-[#8668FF] active:scale-98 cursor-pointer"
            >
              {activeMode === "campaign"
                ? `Continue to Level ${currentLevel + 1}`
                : activeMode === "generator"
                  ? "Generate Next Puzzle"
                  : "Back to Mode Menu"}
            </button>
          </motion.div>
        </div>
      )}

      {/* GAME OVER MODAL */}
      {gameState === "GAME_OVER" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0C0D14]/88 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-3xl border border-[#E70D5C]/40 bg-[#212233] p-6 text-center shadow-2xl"
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#E70D5C]/15 text-[#E70D5C]">
              <Clock className="h-7 w-7" />
            </div>
            <h3 className="font-heading text-2xl font-extrabold text-white">
              Time&apos;s Up!
            </h3>
            <p className="mt-1 text-sm text-[#AAADBE]">
              You earned {levelStars} ★ on {activeModeLabel} with{" "}
              {Math.floor(remainingTiles / 2)} pairs remaining.
            </p>

            <div className="mt-4 flex items-center justify-around rounded-2xl bg-[#13141E] p-3.5 border border-[#2F3148]">
              <div>
                <div className="text-[11px] text-[#878A9E]">Score</div>
                <div className="font-mono text-base font-bold text-white tabular-nums">
                  {score.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#878A9E]">Best</div>
                <div className="font-mono text-base font-bold text-[#FFAC4A] tabular-nums">
                  {progress.bestScore.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => launchBoard(activeMode, activeConfig)}
                className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[#6842FF] font-heading text-sm font-bold text-white hover:bg-[#8668FF] active:scale-98 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                Retry Board
              </button>
              {activeMode === "generator" && (
                <button
                  type="button"
                  onClick={() => startGeneratedPuzzle(randomSeedCode())}
                  className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-[#28293D] text-sm font-semibold text-[#F9FAFF] hover:bg-[#373952] cursor-pointer"
                >
                  <Dices className="h-4 w-4 text-[#4AF0A7]" />
                  New Random Seed
                </button>
              )}
              <button
                type="button"
                onClick={() => setGameState("TITLE_MENU")}
                className="min-h-[46px] w-full rounded-full bg-[#28293D] text-sm font-semibold text-[#D0D2DE] hover:bg-[#373952] cursor-pointer"
              >
                Back to Menu
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* TILE PANTRY MODAL */}
      <AnimatePresence>
        {pantryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPantryOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-3xl border border-[#373952] bg-[#212233] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-xl font-extrabold text-white">
                    Tasty Match Tile Collection
                  </h2>
                  <p className="text-xs text-[#AAADBE]">
                    {progress.unlockedTileCount} of {FOOD_TILES.length} food
                    tiles unlocked through levels and chests
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPantryOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-[#AAADBE] hover:bg-[#28293D] hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-8">
                {FOOD_TILES.map((tile, idx) => {
                  const unlocked = idx < progress.unlockedTileCount;
                  return (
                    <div
                      key={tile.id}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center ${
                        unlocked
                          ? "border-[#2F3148] bg-[#1A1B28]"
                          : "border-[#28293D] bg-[#13141E]/70 opacity-55"
                      }`}
                    >
                      <div className="relative h-12 w-12 rounded-lg bg-[#FFFBF2] p-1 border-b-2 border-[#DEC9AA]">
                        <FoodTileArt id={tile.id} className="h-full w-full" />
                        {!unlocked && (
                          <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-[#0C0D14]/75 text-[#AAADBE]">
                            <Lock className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                      <span className="w-full truncate text-[11px] font-medium text-[#D0D2DE]">
                        {tile.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
