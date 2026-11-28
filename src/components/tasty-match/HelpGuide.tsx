"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Star,
  Lightbulb,
  Shuffle,
  Clock,
  Gift,
  RotateCcw,
  ArrowDown,
  ArrowUpDown,
  ArrowLeftRight,
  Lock,
  Grid2x2,
  Calendar,
  Wand2,
  Play,
} from "lucide-react";
import { FoodTileArt } from "./FoodTileArt";
import { FOOD_TILES } from "./data";
import { computeMatchReward, findConnectPath } from "./mahjongEngine";
import type { BoardCell, FoodTileId, GridPoint } from "@/types/tastyMatch";

interface MiniBoardProps {
  rows: number;
  cols: number;
  tiles: Array<{ r: number; c: number; id: FoodTileId; highlight?: "a" | "b" | "bad" }>;
  blockers?: GridPoint[];
  path?: GridPoint[]; // padded coords: r in [0..rows+1], c in [0..cols+1]
  valid: boolean;
  showOuterCorridor?: boolean;
  caption: string;
}

function MiniConnectionDiagram({
  rows,
  cols,
  tiles,
  blockers = [],
  path,
  valid,
  showOuterCorridor = false,
  caption,
}: MiniBoardProps) {
  const tileMap = new Map<string, (typeof tiles)[number]>();
  for (const t of tiles) {
    tileMap.set(`${t.r},${t.c}`, t);
  }
  const blockerSet = new Set(blockers.map((b) => `${b.r},${b.c}`));

  const toPercent = (pt: GridPoint) => {
    const padSize = showOuterCorridor ? 0.55 : 0.3;
    const totalC = cols + padSize * 2;
    const totalR = rows + padSize * 2;

    const cx =
      pt.c === 0
        ? ((padSize * 0.5) / totalC) * 100
        : pt.c === cols + 1
          ? ((cols + padSize * 1.5) / totalC) * 100
          : ((padSize + (pt.c - 1) + 0.5) / totalC) * 100;

    const cy =
      pt.r === 0
        ? ((padSize * 0.5) / totalR) * 100
        : pt.r === rows + 1
          ? ((rows + padSize * 1.5) / totalR) * 100
          : ((padSize + (pt.r - 1) + 0.5) / totalR) * 100;

    return { x: cx, y: cy };
  };

  const padTrack = showOuterCorridor ? "0.55fr" : "0.3fr";

  return (
    <div className="flex flex-col gap-3">
      <div
        className={`relative rounded-2xl border p-2.5 ${
          showOuterCorridor
            ? "border-dashed border-[#474967] bg-[#161724]"
            : "border-[#4A3222] bg-gradient-to-b from-[#462E20] to-[#2C1C12]"
        }`}
      >
        <div
          className="relative grid gap-1.5"
          style={{
            gridTemplateColumns: `${padTrack} repeat(${cols}, minmax(0, 1fr)) ${padTrack}`,
            gridTemplateRows: `${padTrack} repeat(${rows}, minmax(0, 1fr)) ${padTrack}`,
          }}
        >
          {Array.from({ length: rows + 2 }).map((_, pr) =>
            Array.from({ length: cols + 2 }).map((__, pc) => {
              const isBorder =
                pr === 0 || pr === rows + 1 || pc === 0 || pc === cols + 1;
              if (isBorder) {
                return (
                  <div
                    key={`p-${pr}-${pc}`}
                    className={
                      showOuterCorridor
                        ? "rounded-md border border-dashed border-[#2F3148]/70 bg-[#13141E]/40"
                        : "pointer-events-none"
                    }
                  />
                );
              }

              const r = pr - 1;
              const c = pc - 1;
              const key = `${r},${c}`;
              const isBlock = blockerSet.has(key);
              const tile = tileMap.get(key);

              if (isBlock) {
                return (
                  <div
                    key={key}
                    className="aspect-square flex items-center justify-center rounded-lg border-b-2 border-[#1B1D2B] bg-gradient-to-b from-[#373952] to-[#28293D]"
                    title="Stone block"
                  >
                    <div className="h-2.5 w-2.5 rounded-xs border border-[#474967] bg-[#212233]" />
                  </div>
                );
              }

              if (!tile) {
                return (
                  <div
                    key={key}
                    className="aspect-square rounded-lg bg-[#24170F]/35"
                  />
                );
              }

              const meta = FOOD_TILES.find((f) => f.id === tile.id);
              const ringClass =
                tile.highlight === "a" || tile.highlight === "b"
                  ? "ring-2 ring-[#4AF0A7] border-[#34D399]"
                  : tile.highlight === "bad"
                    ? "ring-2 ring-[#E70D5C] border-[#FDA4AF]"
                    : "border-[#DEC9AA]";

              return (
                <div
                  key={key}
                  className={`aspect-square flex items-center justify-center rounded-lg border-b-2 bg-[#FFFBF2] p-1 shadow-sm ${ringClass}`}
                >
                  <div
                    className="flex h-full w-full items-center justify-center rounded-md p-0.5"
                    style={{ backgroundColor: meta?.accentBg ?? "#FFFBF2" }}
                  >
                    <FoodTileArt id={tile.id} className="h-full w-full" />
                  </div>
                </div>
              );
            })
          )}

          {path && path.length >= 2 && (
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
            >
              <polyline
                points={path
                  .map((pt) => {
                    const p = toPercent(pt);
                    return `${p.x},${p.y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke={valid ? "#4AF0A7" : "#E70D5C"}
                strokeWidth="3.2"
                strokeDasharray={valid ? undefined : "4 3"}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {valid && (
                <polyline
                  points={path
                    .map((pt) => {
                      const p = toPercent(pt);
                      return `${p.x},${p.y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#ECFDF5"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          )}
        </div>
      </div>
      <p className="text-xs leading-relaxed text-[#AAADBE]">{caption}</p>
    </div>
  );
}

type SandboxPresetId = "rules" | "perimeter" | "blockers";

interface SandboxPreset {
  id: SandboxPresetId;
  label: string;
  description: string;
  cells: Array<{ r: number; c: number; tileId?: FoodTileId; isBlocker?: boolean }>;
}

const SANDBOX_ROWS = 4;
const SANDBOX_COLS = 5;

const SANDBOX_PRESETS: SandboxPreset[] = [
  {
    id: "rules",
    label: "Core Turn Rules",
    description:
      "Test straight lines, L-bends, U-bends, and blocked pairs. Try tapping the two Donuts (blocked / 3 turns) vs the two Burgers (2 turns).",
    cells: [
      { r: 0, c: 0, tileId: "sushi" },
      { r: 0, c: 1, tileId: "ramen" },
      { r: 0, c: 3, tileId: "sushi" },
      { r: 1, c: 1, tileId: "donut" },
      { r: 1, c: 2, tileId: "cake" },
      { r: 1, c: 3, tileId: "burger" },
      { r: 2, c: 0, tileId: "pizza" },
      { r: 2, c: 1, tileId: "boba" },
      { r: 2, c: 2, tileId: "donut" },
      { r: 2, c: 3, tileId: "pizza" },
      { r: 3, c: 1, tileId: "burger" },
      { r: 3, c: 2, tileId: "taco" },
      { r: 3, c: 4, tileId: "taco" },
    ],
  },
  {
    id: "perimeter",
    label: "Outer Edge Escape",
    description:
      "Tiles along the outer rows or columns can route 1 step outside the wooden frame. Tap the two Watermelon or Ice Cream tiles to watch the edge path.",
    cells: [
      { r: 0, c: 0, tileId: "watermelon" },
      { r: 0, c: 1, tileId: "croissant" },
      { r: 0, c: 2, tileId: "avocado" },
      { r: 0, c: 3, tileId: "watermelon" },
      { r: 1, c: 0, tileId: "icecream" },
      { r: 1, c: 1, isBlocker: true },
      { r: 1, c: 2, tileId: "croissant" },
      { r: 1, c: 3, isBlocker: true },
      { r: 1, c: 4, tileId: "pie" },
      { r: 2, c: 1, tileId: "avocado" },
      { r: 2, c: 2, isBlocker: true },
      { r: 2, c: 4, tileId: "icecream" },
      { r: 3, c: 0, tileId: "pie" },
      { r: 3, c: 4, tileId: "cupcake" },
      { r: 3, c: 2, tileId: "cupcake" },
    ],
  },
  {
    id: "blockers",
    label: "Stone Blockers",
    description:
      "Dark stone blocks cannot be matched, cleared, or crossed. Notice how two Ramen bowls on opposite sides of a stone block must route around it in ≤ 2 turns.",
    cells: [
      { r: 0, c: 0, tileId: "ramen" },
      { r: 0, c: 1, isBlocker: true },
      { r: 0, c: 2, tileId: "ramen" },
      { r: 0, c: 4, tileId: "pretzel" },
      { r: 1, c: 1, tileId: "hotdog" },
      { r: 1, c: 2, isBlocker: true },
      { r: 1, c: 3, tileId: "boba" },
      { r: 2, c: 0, tileId: "boba" },
      { r: 2, c: 1, isBlocker: true },
      { r: 2, c: 2, tileId: "hotdog" },
      { r: 2, c: 4, tileId: "pretzel" },
      { r: 3, c: 1, tileId: "cake" },
      { r: 3, c: 3, tileId: "cake" },
    ],
  },
];

function buildSandboxGrid(presetId: SandboxPresetId): BoardCell[][] {
  const preset =
    SANDBOX_PRESETS.find((p) => p.id === presetId) ?? SANDBOX_PRESETS[0];
  const grid: BoardCell[][] = Array.from({ length: SANDBOX_ROWS }, (_, r) =>
    Array.from({ length: SANDBOX_COLS }, (_, c) => ({
      row: r,
      col: c,
      tileId: null,
      isBlocker: false,
      uid: `sb-${presetId}-${r}-${c}`,
    }))
  );
  for (const item of preset.cells) {
    if (grid[item.r]?.[item.c]) {
      grid[item.r][item.c].tileId = item.tileId ?? null;
      grid[item.r][item.c].isBlocker = Boolean(item.isBlocker);
    }
  }
  return grid;
}

function countTurns(path: GridPoint[]): number {
  if (path.length < 3) return 0;
  let turns = 0;
  for (let i = 1; i < path.length - 1; i++) {
    const dr1 = path[i].r - path[i - 1].r;
    const dc1 = path[i].c - path[i - 1].c;
    const dr2 = path[i + 1].r - path[i].r;
    const dc2 = path[i + 1].c - path[i].c;
    if (dr1 !== dr2 || dc1 !== dc2) turns++;
  }
  return turns;
}

export function HelpGuide() {
  const [presetId, setPresetId] = useState<SandboxPresetId>("rules");
  const [grid, setGrid] = useState<BoardCell[][]>(() =>
    buildSandboxGrid("rules")
  );
  const [selected, setSelected] = useState<GridPoint | null>(null);
  const [inspectResult, setInspectResult] = useState<{
    valid: boolean;
    a: GridPoint;
    b: GridPoint;
    path: GridPoint[] | null;
    turns: number;
    stars: number;
    headline: string;
    detail: string;
  } | null>(null);

  const activePreset = useMemo(
    () => SANDBOX_PRESETS.find((p) => p.id === presetId) ?? SANDBOX_PRESETS[0],
    [presetId]
  );

  const selectPreset = (nextId: SandboxPresetId) => {
    setPresetId(nextId);
    setGrid(buildSandboxGrid(nextId));
    setSelected(null);
    setInspectResult(null);
  };

  const handleSandboxClick = (r: number, c: number) => {
    const cell = grid[r]?.[c];
    if (!cell || cell.isBlocker || !cell.tileId) return;

    if (!selected) {
      setSelected({ r, c });
      setInspectResult(null);
      return;
    }

    if (selected.r === r && selected.c === c) {
      setSelected(null);
      return;
    }

    const first = grid[selected.r][selected.c];
    const firstName =
      FOOD_TILES.find((f) => f.id === first.tileId)?.name ?? "Tile";
    const secondName =
      FOOD_TILES.find((f) => f.id === cell.tileId)?.name ?? "Tile";

    if (first.tileId !== cell.tileId) {
      setInspectResult({
        valid: false,
        a: selected,
        b: { r, c },
        path: null,
        turns: 0,
        stars: 0,
        headline: "Cannot Connect: Different Food Tiles",
        detail: `${firstName} and ${secondName} do not match. Only two identical food tiles can be connected.`,
      });
      setSelected(null);
      return;
    }

    const path = findConnectPath(grid, selected, { r, c });
    if (!path) {
      setInspectResult({
        valid: false,
        a: selected,
        b: { r, c },
        path: null,
        turns: 0,
        stars: 0,
        headline: "Cannot Connect: Path Blocked or Needs 3+ Turns",
        detail: `No horizontal/vertical route exists between these two ${secondName} tiles within 2 turns. Remember: paths cannot cross other tiles, stone blocks, or travel diagonally.`,
      });
      setSelected(null);
      return;
    }

    const turns = countTurns(path);
    const reward = computeMatchReward(selected, { r, c }, path, 1);
    const usesOuterEdge = path.some(
      (pt) =>
        pt.r === 0 ||
        pt.r === SANDBOX_ROWS + 1 ||
        pt.c === 0 ||
        pt.c === SANDBOX_COLS + 1
    );

    setInspectResult({
      valid: true,
      a: selected,
      b: { r, c },
      path,
      turns,
      stars: reward.starsEarned,
      headline: `Valid Connection (${turns} ${turns === 1 ? "turn" : "turns"})${
        usesOuterEdge ? " via Outer Corridor" : ""
      }`,
      detail: `Connected across distance ${reward.distance} for +${reward.starsEarned} ★ and +${reward.pointsEarned} points${
        reward.isLongMatch ? " (Long Match bonus!)" : ""
      }.`,
    });
    setSelected(null);
  };

  const clearMatchedSandboxPair = () => {
    if (!inspectResult?.valid) return;
    setGrid((prev) => {
      const next = prev.map((row) => row.map((item) => ({ ...item })));
      next[inspectResult.a.r][inspectResult.a.c].tileId = null;
      next[inspectResult.b.r][inspectResult.b.c].tileId = null;
      return next;
    });
    setInspectResult(null);
  };

  const toSandboxPercent = (pt: GridPoint) => {
    const pad = 0.55;
    const totalC = SANDBOX_COLS + pad * 2;
    const totalR = SANDBOX_ROWS + pad * 2;
    const x =
      pt.c === 0
        ? ((pad * 0.5) / totalC) * 100
        : pt.c === SANDBOX_COLS + 1
          ? ((SANDBOX_COLS + pad * 1.5) / totalC) * 100
          : ((pad + (pt.c - 1) + 0.5) / totalC) * 100;
    const y =
      pt.r === 0
        ? ((pad * 0.5) / totalR) * 100
        : pt.r === SANDBOX_ROWS + 1
          ? ((SANDBOX_ROWS + pad * 1.5) / totalR) * 100
          : ((pad + (pt.r - 1) + 0.5) / totalR) * 100;
    return { x, y };
  };

  return (
    <main className="min-h-dvh w-full bg-[#13141E] text-[#F9FAFF] touch-manipulation">
      {/* Top 3-Zone Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-[#28293D] bg-[#1A1B28]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="font-heading text-base sm:text-lg font-extrabold text-white whitespace-nowrap shrink-0 hover:text-[#A48EFF] transition-colors"
          >
            Tasty Match: Mahjong Pairs
          </Link>

          <nav
            aria-label="Help sections"
            className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#AAADBE]"
          >
            <a
              href="#connection-rules"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Connection Rules
            </a>
            <a
              href="#sandbox"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Interactive Tester
            </a>
            <a
              href="#board-shifts"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Shifts &amp; Blocks
            </a>
            <a
              href="#scoring-modes"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Scoring &amp; Modes
            </a>
          </nav>

          <Link
            href="/"
            className="flex min-h-[44px] items-center gap-2 rounded-full bg-[#6842FF] px-4 text-sm font-bold text-white shadow-md shadow-[#6842FF]/25 hover:bg-[#8668FF] active:scale-95 transition-all whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Game</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-8 sm:px-6 sm:py-10">
        {/* Hero Overview */}
        <section className="rounded-3xl border border-[#2F3148] bg-[#1A1B28] p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-center">
            <div className="space-y-4 lg:col-span-7">
              <div className="text-xs font-semibold text-[#FFAC4A]">
                Player Guide · Mahjong Connect Rules · Strategy Reference
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white leading-tight [text-wrap:balance]">
                How Tasty Match Works &amp; How Tiles Connect
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-[#D0D2DE]">
                Tasty Match is a timed tile-connecting puzzle (also known as{" "}
                <strong className="text-white">Mahjong Connect</strong> or{" "}
                <strong className="text-white">Onet Pairs</strong>). Your goal
                is to clear every pair of identical food tiles before the timer
                runs out by linking them with a path that bends{" "}
                <strong className="text-[#4AF0A7]">
                  no more than twice (90° turns)
                </strong>
                .
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <a
                  href="#sandbox"
                  className="flex min-h-[46px] items-center gap-2 rounded-full bg-[#6842FF] px-5 text-sm font-bold text-white hover:bg-[#8668FF] transition-colors whitespace-nowrap"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Try Interactive Path Tester
                </a>
                <Link
                  href="/"
                  className="flex min-h-[46px] items-center gap-2 rounded-full border border-[#373952] bg-[#212233] px-5 text-sm font-bold text-[#F9FAFF] hover:bg-[#28293D] transition-colors whitespace-nowrap"
                >
                  Play Now
                </Link>
              </div>
            </div>

            {/* 4-Step Quick Loop Summary */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-5">
              <div className="rounded-2xl border border-[#2F3148] bg-[#212233] p-4">
                <div className="font-mono text-xs font-bold text-[#A48EFF]">
                  01. MATCH IDENTICAL TILES
                </div>
                <p className="mt-1.5 text-sm text-[#D0D2DE]">
                  Tap any food tile, then tap its exact twin. Different dishes
                  never pair.
                </p>
              </div>
              <div className="rounded-2xl border border-[#2F3148] bg-[#212233] p-4">
                <div className="font-mono text-xs font-bold text-[#4AF0A7]">
                  02. MAX 2 BENDS (90°)
                </div>
                <p className="mt-1.5 text-sm text-[#D0D2DE]">
                  The connecting line travels only up, down, left, or right with
                  0, 1, or 2 turns.
                </p>
              </div>
              <div className="rounded-2xl border border-[#2F3148] bg-[#212233] p-4">
                <div className="font-mono text-xs font-bold text-[#FFAC4A]">
                  03. EARN DISTANCE STARS
                </div>
                <p className="mt-1.5 text-sm text-[#D0D2DE]">
                  Longer paths award 2 ★ or 3 ★ instead of 1 ★. Reach 25 ★ to
                  open a Treasure Chest.
                </p>
              </div>
              <div className="rounded-2xl border border-[#2F3148] bg-[#212233] p-4">
                <div className="font-mono text-xs font-bold text-[#38BDF8]">
                  04. CLEAR BEFORE 00:00
                </div>
                <p className="mt-1.5 text-sm text-[#D0D2DE]">
                  Empty the board before time runs out to bank +12 points per
                  remaining second.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: VALID vs INVALID CONNECTIONS */}
        <section id="connection-rules" className="space-y-8 scroll-mt-20">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#28293D] pb-4">
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                How Tiles Can &amp; Cannot Be Connected
              </h2>
              <p className="mt-1 text-sm sm:text-base text-[#AAADBE]">
                Every connection is an orthogonal line (horizontal and vertical
                segments only) passing exclusively through empty cells or the
                1-tile corridor outside the board edge.
              </p>
            </div>
          </div>

          {/* VALID CONNECTIONS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-base font-bold text-[#4AF0A7]">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <h3>Valid Connections (0, 1, or 2 Turns)</h3>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {/* Case 1: 0 Turns */}
              <div className="rounded-2xl border border-[#2F3148] bg-[#212233] p-4">
                <div className="mb-3 flex items-center justify-between text-xs font-bold">
                  <span className="text-white">1. Straight Line</span>
                  <span className="font-mono text-[#4AF0A7]">0 Turns</span>
                </div>
                <MiniConnectionDiagram
                  rows={3}
                  cols={4}
                  valid={true}
                  tiles={[
                    { r: 1, c: 0, id: "donut", highlight: "a" },
                    { r: 1, c: 3, id: "donut", highlight: "b" },
                    { r: 0, c: 1, id: "burger" },
                    { r: 2, c: 2, id: "cake" },
                  ]}
                  path={[
                    { r: 2, c: 1 },
                    { r: 2, c: 4 },
                  ]}
                  caption="Tiles in the same row or column with only empty spaces between them connect directly—even when touching side-by-side."
                />
              </div>

              {/* Case 2: 1 Turn (L-Shape) */}
              <div className="rounded-2xl border border-[#2F3148] bg-[#212233] p-4">
                <div className="mb-3 flex items-center justify-between text-xs font-bold">
                  <span className="text-white">2. L-Shape Bend</span>
                  <span className="font-mono text-[#4AF0A7]">1 Turn</span>
                </div>
                <MiniConnectionDiagram
                  rows={3}
                  cols={4}
                  valid={true}
                  tiles={[
                    { r: 0, c: 0, id: "sushi", highlight: "a" },
                    { r: 2, c: 3, id: "sushi", highlight: "b" },
                    { r: 2, c: 0, id: "pizza" },
                    { r: 1, c: 1, id: "boba" },
                  ]}
                  path={[
                    { r: 1, c: 1 },
                    { r: 1, c: 4 },
                    { r: 3, c: 4 },
                  ]}
                  caption="One 90° corner turn routes around other tiles when either the top-right or bottom-left corner path is open."
                />
              </div>

              {/* Case 3: 2 Turns (U / Z Shape) */}
              <div className="rounded-2xl border border-[#2F3148] bg-[#212233] p-4">
                <div className="mb-3 flex items-center justify-between text-xs font-bold">
                  <span className="text-white">3. Z-Shape or U-Shape</span>
                  <span className="font-mono text-[#4AF0A7]">2 Turns</span>
                </div>
                <MiniConnectionDiagram
                  rows={3}
                  cols={4}
                  valid={true}
                  tiles={[
                    { r: 1, c: 0, id: "ramen", highlight: "a" },
                    { r: 1, c: 3, id: "ramen", highlight: "b" },
                    { r: 1, c: 1, id: "taco" },
                    { r: 1, c: 2, id: "burger" },
                  ]}
                  path={[
                    { r: 2, c: 1 },
                    { r: 1, c: 1 },
                    { r: 1, c: 4 },
                    { r: 2, c: 4 },
                  ]}
                  caption="When the straight row between twins is blocked, a 2-turn U-shape detours into an open row above or below."
                />
              </div>

              {/* Case 4: Outer Corridor Escape */}
              <div className="rounded-2xl border border-[#2F3148] bg-[#212233] p-4">
                <div className="mb-3 flex items-center justify-between text-xs font-bold">
                  <span className="text-white">4. Outer Edge Corridor</span>
                  <span className="font-mono text-[#4AF0A7]">2 Turns</span>
                </div>
                <MiniConnectionDiagram
                  rows={3}
                  cols={4}
                  valid={true}
                  showOuterCorridor={true}
                  tiles={[
                    { r: 0, c: 0, id: "watermelon", highlight: "a" },
                    { r: 0, c: 1, id: "pizza" },
                    { r: 0, c: 2, id: "cake" },
                    { r: 0, c: 3, id: "watermelon", highlight: "b" },
                    { r: 1, c: 1, id: "boba" },
                    { r: 1, c: 2, id: "donut" },
                  ]}
                  path={[
                    { r: 1, c: 1 },
                    { r: 0, c: 1 },
                    { r: 0, c: 4 },
                    { r: 1, c: 4 },
                  ]}
                  caption="Edge tiles can step outside the dashed border ring! The outer perimeter acts as an empty lane all around the board."
                />
              </div>
            </div>
          </div>

          {/* INVALID CONNECTIONS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-base font-bold text-[#E70D5C]">
              <XCircle className="h-5 w-5 shrink-0" />
              <h3>Invalid Connections (Blocked Pairs)</h3>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {/* Invalid 1: Needs 3+ Turns */}
              <div className="rounded-2xl border border-[#2F3148] bg-[#212233] p-4">
                <div className="mb-3 flex items-center justify-between text-xs font-bold">
                  <span className="text-white">1. Needs 3+ Turns</span>
                  <span className="font-mono text-[#E70D5C]">Blocked</span>
                </div>
                <MiniConnectionDiagram
                  rows={3}
                  cols={4}
                  valid={false}
                  tiles={[
                    { r: 0, c: 1, id: "croissant", highlight: "bad" },
                    { r: 0, c: 2, id: "boba" },
                    { r: 0, c: 3, id: "sushi" },
                    { r: 1, c: 1, id: "pizza" },
                    { r: 1, c: 2, id: "croissant", highlight: "bad" },
                    { r: 1, c: 3, id: "cake" },
                    { r: 2, c: 3, id: "taco" },
                  ]}
                  path={[
                    { r: 1, c: 2 },
                    { r: 1, c: 1 },
                    { r: 3, c: 1 },
                    { r: 3, c: 3 },
                    { r: 2, c: 3 },
                  ]}
                  caption="Even though an open lane wraps around the empty left side, reaching the matching croissant takes 3 turns—one turn too many."
                />
              </div>

              {/* Invalid 2: Trapped Inside Neighbors */}
              <div className="rounded-2xl border border-[#2F3148] bg-[#212233] p-4">
                <div className="mb-3 flex items-center justify-between text-xs font-bold">
                  <span className="text-white">2. Surrounded Tile</span>
                  <span className="font-mono text-[#E70D5C]">Blocked</span>
                </div>
                <MiniConnectionDiagram
                  rows={3}
                  cols={4}
                  valid={false}
                  tiles={[
                    { r: 0, c: 1, id: "pizza" },
                    { r: 1, c: 0, id: "boba" },
                    { r: 1, c: 1, id: "avocado", highlight: "bad" },
                    { r: 1, c: 2, id: "cake" },
                    { r: 2, c: 1, id: "taco" },
                    { r: 1, c: 3, id: "avocado", highlight: "bad" },
                  ]}
                  caption="A tile surrounded on all four sides (up, down, left, right) cannot exit to start a path until at least one neighbor is cleared."
                />
              </div>

              {/* Invalid 3: Diagonal Attempt */}
              <div className="rounded-2xl border border-[#2F3148] bg-[#212233] p-4">
                <div className="mb-3 flex items-center justify-between text-xs font-bold">
                  <span className="text-white">3. No Diagonal Lines</span>
                  <span className="font-mono text-[#E70D5C]">Blocked</span>
                </div>
                <MiniConnectionDiagram
                  rows={3}
                  cols={4}
                  valid={false}
                  tiles={[
                    { r: 0, c: 1, id: "icecream", highlight: "bad" },
                    { r: 0, c: 2, id: "donut" },
                    { r: 1, c: 1, id: "burger" },
                    { r: 1, c: 2, id: "icecream", highlight: "bad" },
                    { r: 1, c: 3, id: "sushi" },
                    { r: 2, c: 2, id: "pizza" },
                  ]}
                  path={[
                    { r: 1, c: 2 },
                    { r: 2, c: 3 },
                  ]}
                  caption="Lines cannot jump diagonally across corners. If both orthogonal exits from a corner are occupied, the pair stays locked."
                />
              </div>

              {/* Invalid 4: Stone Block / Mismatch */}
              <div className="rounded-2xl border border-[#2F3148] bg-[#212233] p-4">
                <div className="mb-3 flex items-center justify-between text-xs font-bold">
                  <span className="text-white">4. Stone Block Wall</span>
                  <span className="font-mono text-[#E70D5C]">Blocked</span>
                </div>
                <MiniConnectionDiagram
                  rows={3}
                  cols={4}
                  valid={false}
                  blockers={[
                    { r: 1, c: 1 },
                    { r: 0, c: 2 },
                    { r: 2, c: 2 },
                  ]}
                  tiles={[
                    { r: 1, c: 0, id: "cupcake", highlight: "bad" },
                    { r: 1, c: 2, id: "cupcake", highlight: "bad" },
                    { r: 0, c: 1, id: "taco" },
                    { r: 2, c: 1, id: "boba" },
                  ]}
                  caption="Dark Stone Blocks act as permanent walls—paths cannot cut through them and they never disappear during a round."
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: INTERACTIVE PATH SANDBOX */}
        <section
          id="sandbox"
          className="rounded-3xl border border-[#2F3148] bg-[#1A1B28] p-5 sm:p-7 scroll-mt-20"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl font-extrabold text-white">
                Interactive Connection Tester
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-[#AAADBE]">
                Tap any two tiles on this live practice board to test the exact
                game pathfinder. Dashed cells around the edge represent the free
                outer corridor.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {SANDBOX_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectPreset(p.id)}
                  className={`min-h-[44px] rounded-xl border px-3.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    presetId === p.id
                      ? "border-[#8668FF] bg-[#6842FF] text-white"
                      : "border-[#2F3148] bg-[#212233] text-[#D0D2DE] hover:border-[#474967] hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            {/* Interactive Mini Board */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div className="w-full max-w-[580px] rounded-3xl border border-dashed border-[#474967] bg-[#13141E] p-3 sm:p-4 shadow-xl">
                <div className="mb-2 flex items-center justify-between text-[11px] font-mono text-[#878A9E]">
                  <span>Dashed Border = Outer Corridor</span>
                  <span>
                    {SANDBOX_ROWS}×{SANDBOX_COLS} Practice Grid
                  </span>
                </div>

                <div className="relative rounded-2xl border border-[#4A3222] bg-gradient-to-b from-[#462E20] to-[#2C1C12] p-2">
                  <div
                    className="relative grid gap-1.5"
                    style={{
                      gridTemplateColumns: `0.55fr repeat(${SANDBOX_COLS}, minmax(0, 1fr)) 0.55fr`,
                      gridTemplateRows: `0.55fr repeat(${SANDBOX_ROWS}, minmax(0, 1fr)) 0.55fr`,
                    }}
                  >
                    {Array.from({ length: SANDBOX_ROWS + 2 }).map((_, pr) =>
                      Array.from({ length: SANDBOX_COLS + 2 }).map((__, pc) => {
                        const isBorder =
                          pr === 0 ||
                          pr === SANDBOX_ROWS + 1 ||
                          pc === 0 ||
                          pc === SANDBOX_COLS + 1;
                        if (isBorder) {
                          return (
                            <div
                              key={`sb-pad-${pr}-${pc}`}
                              className="rounded-md border border-dashed border-[#6842FF]/25 bg-[#0C0D14]/35"
                              aria-hidden="true"
                            />
                          );
                        }

                        const r = pr - 1;
                        const c = pc - 1;
                        const cell = grid[r]?.[c];
                        if (!cell) return <div key={`sb-none-${r}-${c}`} />;

                        if (cell.isBlocker) {
                          return (
                            <div
                              key={cell.uid}
                              className="aspect-square flex items-center justify-center rounded-xl border-b-4 border-[#1B1D2B] bg-gradient-to-b from-[#373952] to-[#28293D]"
                              title="Stone block (immovable wall)"
                            >
                              <div className="h-3 w-3 rounded-xs border border-[#474967] bg-[#212233]" />
                            </div>
                          );
                        }

                        if (!cell.tileId) {
                          return (
                            <div
                              key={cell.uid}
                              className="aspect-square rounded-xl bg-[#24170F]/35"
                            />
                          );
                        }

                        const meta = FOOD_TILES.find(
                          (f) => f.id === cell.tileId
                        );
                        const isSel = selected?.r === r && selected?.c === c;
                        const isResultTile =
                          inspectResult &&
                          ((inspectResult.a.r === r &&
                            inspectResult.a.c === c) ||
                            (inspectResult.b.r === r &&
                              inspectResult.b.c === c));

                        return (
                          <button
                            key={cell.uid}
                            type="button"
                            onClick={() => handleSandboxClick(r, c)}
                            aria-label={meta?.name ?? cell.tileId}
                            className={`aspect-square flex items-center justify-center rounded-xl p-1 sm:p-1.5 transition-transform duration-150 active:scale-95 cursor-pointer ${
                              isSel
                                ? "-translate-y-1 bg-[#FFFDF7] ring-3 ring-[#6842FF] border-b-4 border-[#B4A1FF]"
                                : isResultTile && inspectResult.valid
                                  ? "-translate-y-0.5 bg-[#ECFDF5] ring-3 ring-[#4AF0A7] border-b-4 border-[#34D399]"
                                  : isResultTile && !inspectResult.valid
                                    ? "bg-[#FFF1F2] ring-2 ring-[#E70D5C] border-b-4 border-[#FDA4AF]"
                                    : "bg-[#FFFBF2] hover:-translate-y-0.5 border-b-4 border-[#DEC9AA]"
                            }`}
                          >
                            <div
                              className="flex h-full w-full items-center justify-center rounded-lg p-0.5"
                              style={{
                                backgroundColor: meta?.accentBg ?? "#FFFBF2",
                              }}
                            >
                              <FoodTileArt
                                id={cell.tileId}
                                className="h-full w-full"
                              />
                            </div>
                          </button>
                        );
                      })
                    )}

                    {inspectResult?.valid && inspectResult.path && (
                      <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
                      >
                        <polyline
                          points={inspectResult.path
                            .map((pt) => {
                              const p = toSandboxPercent(pt);
                              return `${p.x},${p.y}`;
                            })
                            .join(" ")}
                          fill="none"
                          stroke="#FFAC4A"
                          strokeWidth="2.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <polyline
                          points={inspectResult.path
                            .map((pt) => {
                              const p = toSandboxPercent(pt);
                              return `${p.x},${p.y}`;
                            })
                            .join(" ")}
                          fill="none"
                          stroke="#FFFBEB"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sandbox Explanation Panel */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-[#2F3148] bg-[#212233] p-5">
                <div className="text-xs font-bold text-[#A48EFF]">
                  Scenario · {activePreset.label}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-[#D0D2DE]">
                  {activePreset.description}
                </p>

                <div className="mt-4 rounded-xl border border-[#2F3148] bg-[#13141E] p-4">
                  {!inspectResult ? (
                    <div className="text-sm text-[#AAADBE]">
                      {selected ? (
                        <span>
                          First tile selected at row{" "}
                          <strong className="font-mono text-white">
                            {selected.r + 1}
                          </strong>
                          , col{" "}
                          <strong className="font-mono text-white">
                            {selected.c + 1}
                          </strong>
                          . Now tap a second tile to test the connection!
                        </span>
                      ) : (
                        <span>
                          Tap any food tile on the practice grid to begin
                          testing a pair.
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div
                        className={`flex items-center gap-2 text-sm font-extrabold ${
                          inspectResult.valid
                            ? "text-[#4AF0A7]"
                            : "text-[#E70D5C]"
                        }`}
                      >
                        {inspectResult.valid ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 shrink-0" />
                        )}
                        <span>{inspectResult.headline}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-[#D0D2DE]">
                        {inspectResult.detail}
                      </p>
                      {inspectResult.valid && (
                        <button
                          type="button"
                          onClick={clearMatchedSandboxPair}
                          className="mt-2 min-h-[42px] rounded-xl bg-[#4AF0A7]/15 px-3.5 text-xs font-bold text-[#4AF0A7] border border-[#4AF0A7]/40 hover:bg-[#4AF0A7]/25 cursor-pointer"
                        >
                          Remove This Pair to Open New Paths
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => selectPreset(presetId)}
                    className="flex min-h-[44px] items-center gap-2 rounded-xl border border-[#2F3148] bg-[#28293D] px-4 text-xs font-bold text-[#F9FAFF] hover:bg-[#373952] cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset Practice Board
                  </button>
                  <span className="text-xs text-[#878A9E]">
                    Tip: Clearing tiles frees paths for trapped neighbors.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: TILE SHIFTS (GRAVITY) & STONE BLOCKS */}
        <section id="board-shifts" className="space-y-6 scroll-mt-20">
          <div className="border-b border-[#28293D] pb-4">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
              Board Shift Rules (Gravity) &amp; Stone Blocks
            </h2>
            <p className="mt-1 text-sm sm:text-base text-[#AAADBE]">
              Starter tables keep tiles stationary, while higher campaign
              levels, challenges, and custom difficulties shift remaining tiles
              after every match.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#2F3148] bg-[#212233] p-5 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Grid2x2 className="h-4 w-4 text-[#4AF0A7]" />
                Static (Classic)
              </div>
              <p className="text-sm text-[#AAADBE] leading-relaxed">
                Cleared squares remain empty where the matched tiles sat. New
                corridors open cleanly without shifting other pieces.
              </p>
            </div>

            <div className="rounded-2xl border border-[#2F3148] bg-[#212233] p-5 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <ArrowDown className="h-4 w-4 text-[#38BDF8]" />
                Drop Down
              </div>
              <p className="text-sm text-[#AAADBE] leading-relaxed">
                After each match, tiles above empty spaces slide downward within
                their column—stopped only by Stone Blocks.
              </p>
            </div>

            <div className="rounded-2xl border border-[#2F3148] bg-[#212233] p-5 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <ArrowUpDown className="h-4 w-4 text-[#FFAC4A]" />
                Center Pull
              </div>
              <p className="text-sm text-[#AAADBE] leading-relaxed">
                The upper half falls down toward the center seam while the lower
                half rises up toward the center seam, clearing the outer edges.
              </p>
            </div>

            <div className="rounded-2xl border border-[#2F3148] bg-[#212233] p-5 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <ArrowLeftRight className="h-4 w-4 text-[#E70D5C]" />
                Alternating Shifts
              </div>
              <p className="text-sm text-[#AAADBE] leading-relaxed">
                Even moves drop tiles downward; odd moves slide even rows to the
                left and odd rows to the right.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#2F3148] bg-[#1A1B28] p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-b-4 border-[#1B1D2B] bg-gradient-to-b from-[#373952] to-[#28293D]">
              <div className="h-4 w-4 rounded-xs border border-[#474967] bg-[#212233]" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-white">
                Stone Blocks
              </h3>
              <p className="mt-1 text-sm text-[#AAADBE]">
                Stone Blocks are fixed obstacles on Medium, Hard, Expert, and
                advanced Campaign boards. Connection lines cannot pass through
                them, and sliding tiles stop against them instead of falling
                past.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: SCORING, POWER-UPS & MODES */}
        <section id="scoring-modes" className="space-y-6 scroll-mt-20">
          <div className="border-b border-[#28293D] pb-4">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
              Stars, Combos, Power-Ups &amp; Game Modes
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Stars & Scoring */}
            <div className="rounded-2xl border border-[#2F3148] bg-[#212233] p-5 space-y-4">
              <div className="flex items-center gap-2 font-heading text-lg font-extrabold text-white">
                <Star className="h-5 w-5 text-[#FFAC4A]" />
                Distance Stars &amp; Combo Scoring
              </div>
              <p className="text-sm text-[#AAADBE] leading-relaxed">
                Connecting tiles farther apart earns more stars toward your{" "}
                <strong className="text-white">25 ★ Treasure Chest</strong>:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-xl border border-[#2F3148] bg-[#13141E] px-4 py-2.5">
                  <span className="text-[#D0D2DE]">
                    Close Pair (Distance 1–2)
                  </span>
                  <span className="font-mono font-bold text-[#FFAC4A] tabular-nums">
                    +1 ★
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[#2F3148] bg-[#13141E] px-4 py-2.5">
                  <span className="text-[#D0D2DE]">
                    Medium Pair (Distance 3–5 or 4+ steps)
                  </span>
                  <span className="font-mono font-bold text-[#FFAC4A] tabular-nums">
                    +2 ★
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[#2F3148] bg-[#13141E] px-4 py-2.5">
                  <span className="text-[#D0D2DE]">
                    Long Match (Distance 6+ or 8+ steps)
                  </span>
                  <span className="font-mono font-bold text-[#FFAC4A] tabular-nums">
                    +3 ★
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#AAADBE] leading-relaxed">
                Match another pair within{" "}
                <strong className="text-white">4.2 seconds</strong> to grow
                your Combo multiplier (up to{" "}
                <span className="font-mono text-[#FFAC4A]">8x</span>, adding{" "}
                <span className="font-mono">+15 pts</span> per combo step).
              </p>
            </div>

            {/* Power-ups & Chests */}
            <div className="rounded-2xl border border-[#2F3148] bg-[#212233] p-5 space-y-4">
              <div className="flex items-center gap-2 font-heading text-lg font-extrabold text-white">
                <Gift className="h-5 w-5 text-[#FFAC4A]" />
                Power-Ups &amp; Treasure Chests
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#4AF0A7]" />
                  <p className="text-[#D0D2DE]">
                    <strong className="text-white">Hint:</strong> Highlights the
                    highest-scoring valid pair currently available on the board.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Shuffle className="mt-0.5 h-4 w-4 shrink-0 text-[#A48EFF]" />
                  <p className="text-[#D0D2DE]">
                    <strong className="text-white">Shuffle:</strong> Rearranges
                    remaining tiles into a fresh, guaranteed-solvable layout.
                    (If zero moves remain naturally, the board auto-shuffles for
                    free!)
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#FFAC4A]" />
                  <p className="text-[#D0D2DE]">
                    <strong className="text-white">+20s Time Boost:</strong>{" "}
                    Adds 20 extra seconds to the active countdown bar.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#FFAC4A]" />
                  <p className="text-[#D0D2DE]">
                    <strong className="text-white">25 ★ Chest:</strong> Opening
                    a full chest awards{" "}
                    <span className="font-mono text-white">
                      +2 Hints, +2 Shuffles, +1 Time Boost, +250 pts
                    </span>{" "}
                    and unlocks new food tiles up to all 16 dishes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Game Modes */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#2F3148] bg-[#1A1B28] p-5 space-y-2">
              <div className="flex items-center gap-2 font-heading text-base font-extrabold text-white">
                <Grid2x2 className="h-4 w-4 text-[#A48EFF]" />
                Campaign Mode
              </div>
              <p className="text-sm text-[#AAADBE] leading-relaxed">
                Progress from a calm 6×6 Bakery Starter table to 8×10 Master
                Chef tables with new dishes, stone blocks, and faster timers.
              </p>
            </div>

            <div className="rounded-2xl border border-[#2F3148] bg-[#1A1B28] p-5 space-y-2">
              <div className="flex items-center gap-2 font-heading text-base font-extrabold text-white">
                <Calendar className="h-4 w-4 text-[#4AF0A7]" />
                Daily &amp; Weekly Challenges
              </div>
              <p className="text-sm text-[#AAADBE] leading-relaxed">
                Fresh deterministic boards every day (+5 Bonus ★ &amp; Daily
                Streak) and Monday grand tables (+10 Bonus ★, +1 Hint, +1
                Shuffle).
              </p>
            </div>

            <div className="rounded-2xl border border-[#2F3148] bg-[#1A1B28] p-5 space-y-2">
              <div className="flex items-center gap-2 font-heading text-base font-extrabold text-white">
                <Wand2 className="h-4 w-4 text-[#FFAC4A]" />
                Custom Puzzle Generator
              </div>
              <p className="text-sm text-[#AAADBE] leading-relaxed">
                Pick Easy (6×6), Medium (6×8), Hard (8×8), or Expert (8×10),
                override the Tile Shift Rule, and enter or roll any shareable
                seed code.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[#28293D] pt-6 pb-4">
          <div className="text-sm text-[#AAADBE]">
            Ready to clear the table? Long matches earn triple stars.
          </div>
          <Link
            href="/"
            className="flex min-h-[48px] items-center gap-2 rounded-full bg-[#6842FF] px-6 font-heading text-sm font-extrabold text-white shadow-lg shadow-[#6842FF]/30 hover:bg-[#8668FF] active:scale-95 transition-all whitespace-nowrap"
          >
            <Play className="h-4 w-4 fill-current" />
            Return to Tasty Match
          </Link>
        </footer>
      </div>
    </main>
  );
}
