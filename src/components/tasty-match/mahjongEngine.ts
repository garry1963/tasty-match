import { FOOD_TILES } from "./data";
import type {
  BoardCell,
  FoodTileId,
  GravityMode,
  GridPoint,
  LevelConfig,
} from "@/types/tastyMatch";

const DIRS: readonly GridPoint[] = [
  { r: -1, c: 0 },
  { r: 0, c: 1 },
  { r: 1, c: 0 },
  { r: 0, c: -1 },
];

/**
 * Deterministic PRNG (Mulberry32 seeded via FNV-1a string hash)
 * Used so Daily & Weekly challenges and custom seeds generate identical boards.
 */
export function createSeededRng(seedStr: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function findConnectPath(
  grid: BoardCell[][],
  a: GridPoint,
  b: GridPoint
): GridPoint[] | null {
  if (a.r === b.r && a.c === b.c) return null;
  const cellA = grid[a.r]?.[a.c];
  const cellB = grid[b.r]?.[b.c];
  if (!cellA || !cellB || !cellA.tileId || !cellB.tileId) return null;
  if (cellA.isBlocker || cellB.isBlocker) return null;
  if (cellA.tileId !== cellB.tileId) return null;

  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const pRows = rows + 2;
  const pCols = cols + 2;

  const sr = a.r + 1;
  const sc = a.c + 1;
  const tr = b.r + 1;
  const tc = b.c + 1;

  const isPassable = (pr: number, pc: number): boolean => {
    if (pr < 0 || pr >= pRows || pc < 0 || pc >= pCols) return false;
    if (pr === tr && pc === tc) return true;
    if (pr === 0 || pr === pRows - 1 || pc === 0 || pc === pCols - 1) {
      return true;
    }
    const cell = grid[pr - 1][pc - 1];
    return cell.tileId === null && !cell.isBlocker;
  };

  const bestTurns: number[][][] = Array.from({ length: pRows }, () =>
    Array.from({ length: pCols }, () => [99, 99, 99, 99])
  );
  const bestSteps: number[][][] = Array.from({ length: pRows }, () =>
    Array.from({ length: pCols }, () => [9999, 9999, 9999, 9999])
  );

  interface Node {
    r: number;
    c: number;
    dir: number;
    turns: number;
    steps: number;
    path: GridPoint[];
  }

  const queue: Node[] = [];

  for (let d = 0; d < 4; d++) {
    const nr = sr + DIRS[d].r;
    const nc = sc + DIRS[d].c;
    if (!isPassable(nr, nc)) continue;
    const node: Node = {
      r: nr,
      c: nc,
      dir: d,
      turns: 0,
      steps: 1,
      path: [
        { r: sr, c: sc },
        { r: nr, c: nc },
      ],
    };
    if (nr === tr && nc === tc) {
      return node.path;
    }
    bestTurns[nr][nc][d] = 0;
    bestSteps[nr][nc][d] = 1;
    queue.push(node);
  }

  let bestSolution: { turns: number; steps: number; path: GridPoint[] } | null =
    null;

  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    if (
      bestSolution &&
      (cur.turns > bestSolution.turns ||
        (cur.turns === bestSolution.turns && cur.steps >= bestSolution.steps))
    ) {
      continue;
    }

    for (let nd = 0; nd < 4; nd++) {
      if ((cur.dir + 2) % 4 === nd) continue;
      const nextTurns = cur.dir === nd ? cur.turns : cur.turns + 1;
      if (nextTurns > 2) continue;

      const nr = cur.r + DIRS[nd].r;
      const nc = cur.c + DIRS[nd].c;
      if (!isPassable(nr, nc)) continue;

      const nextSteps = cur.steps + 1;
      if (nr === tr && nc === tc) {
        const candidatePath = [...cur.path, { r: nr, c: nc }];
        if (
          !bestSolution ||
          nextTurns < bestSolution.turns ||
          (nextTurns === bestSolution.turns && nextSteps < bestSolution.steps)
        ) {
          bestSolution = {
            turns: nextTurns,
            steps: nextSteps,
            path: candidatePath,
          };
        }
        continue;
      }

      const prevT = bestTurns[nr][nc][nd];
      const prevS = bestSteps[nr][nc][nd];
      if (
        nextTurns < prevT ||
        (nextTurns === prevT && nextSteps < prevS)
      ) {
        bestTurns[nr][nc][nd] = nextTurns;
        bestSteps[nr][nc][nd] = nextSteps;
        queue.push({
          r: nr,
          c: nc,
          dir: nd,
          turns: nextTurns,
          steps: nextSteps,
          path: [...cur.path, { r: nr, c: nc }],
        });
      }
    }
  }

  return bestSolution ? bestSolution.path : null;
}

export function computeMatchReward(
  a: GridPoint,
  b: GridPoint,
  path: GridPoint[],
  combo: number
): { starsEarned: number; pointsEarned: number; distance: number; isLongMatch: boolean } {
  const manhattan = Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
  const pathLen = Math.max(1, path.length - 1);
  const effectiveDist = Math.max(manhattan, Math.floor(pathLen * 0.75));

  let starsEarned = 1;
  if (effectiveDist >= 6 || pathLen >= 8) {
    starsEarned = 3;
  } else if (effectiveDist >= 3 || pathLen >= 4) {
    starsEarned = 2;
  }

  const isLongMatch = starsEarned >= 2 && effectiveDist >= 4;
  const comboBonus = Math.min(combo, 8) * 15;
  const pointsEarned = 50 + effectiveDist * 20 + starsEarned * 35 + comboBonus;

  return {
    starsEarned,
    pointsEarned,
    distance: effectiveDist,
    isLongMatch,
  };
}

export function findAllValidPairs(
  grid: BoardCell[][]
): Array<{ a: GridPoint; b: GridPoint; path: GridPoint[]; score: number }> {
  const buckets = new Map<FoodTileId, GridPoint[]>();
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const cell = grid[r][c];
      if (cell.tileId && !cell.isBlocker) {
        const list = buckets.get(cell.tileId) ?? [];
        list.push({ r, c });
        buckets.set(cell.tileId, list);
      }
    }
  }

  const pairs: Array<{ a: GridPoint; b: GridPoint; path: GridPoint[]; score: number }> = [];
  for (const positions of buckets.values()) {
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const path = findConnectPath(grid, positions[i], positions[j]);
        if (path) {
          const dist =
            Math.abs(positions[i].r - positions[j].r) +
            Math.abs(positions[i].c - positions[j].c);
          pairs.push({
            a: positions[i],
            b: positions[j],
            path,
            score: dist + path.length,
          });
        }
      }
    }
  }

  pairs.sort((x, y) => y.score - x.score);
  return pairs;
}

function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateSolvableBoard(config: LevelConfig): BoardCell[][] {
  const { rows, cols, tileTypesCount, blockerCount, seed } = config;
  const rng = seed ? createSeededRng(seed) : Math.random;

  const blockerSet = new Set<string>();
  if (blockerCount > 0 && rows >= 6 && cols >= 6) {
    const midR = Math.floor(rows / 2);
    const midC = Math.floor(cols / 2);
    const candidates: GridPoint[] = [
      { r: midR - 1, c: midC - 1 },
      { r: midR, c: midC },
      { r: midR - 1, c: midC },
      { r: midR, c: midC - 1 },
      { r: 1, c: 1 },
      { r: rows - 2, c: cols - 2 },
      { r: 1, c: cols - 2 },
      { r: rows - 2, c: 1 },
    ];
    for (const pt of candidates) {
      if (blockerSet.size >= blockerCount) break;
      blockerSet.add(`${pt.r},${pt.c}`);
    }
  }

  let playableCount = rows * cols - blockerSet.size;
  if (playableCount % 2 !== 0 && blockerSet.size > 0) {
    const firstKey = blockerSet.values().next().value;
    if (firstKey) blockerSet.delete(firstKey);
    playableCount = rows * cols - blockerSet.size;
  }

  const pairCount = playableCount / 2;
  const activePool = FOOD_TILES.slice(
    0,
    Math.min(FOOD_TILES.length, Math.max(4, tileTypesCount))
  );

  const tiles: FoodTileId[] = [];
  for (let i = 0; i < pairCount; i++) {
    const tile = activePool[i % activePool.length].id;
    tiles.push(tile, tile);
  }

  let bestGrid: BoardCell[][] = [];
  for (let attempt = 0; attempt < 25; attempt++) {
    const shuffled = shuffleArray(tiles, rng);
    let idx = 0;
    const grid: BoardCell[][] = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => {
        const isBlocker = blockerSet.has(`${r},${c}`);
        return {
          row: r,
          col: c,
          tileId: isBlocker ? null : shuffled[idx++],
          isBlocker,
          uid: `cell-${r}-${c}-${attempt}`,
        };
      })
    );

    const valid = findAllValidPairs(grid);
    if (valid.length >= 3) {
      return grid;
    }
    bestGrid = grid;
  }

  return bestGrid;
}

export function shuffleRemainingTiles(grid: BoardCell[][]): BoardCell[][] {
  const remainingCoords: GridPoint[] = [];
  const remainingIds: FoodTileId[] = [];

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const cell = grid[r][c];
      if (cell.tileId && !cell.isBlocker) {
        remainingCoords.push({ r, c });
        remainingIds.push(cell.tileId);
      }
    }
  }

  if (remainingIds.length < 2) return grid;

  for (let attempt = 0; attempt < 30; attempt++) {
    const shuffled = shuffleArray(remainingIds, Math.random);
    const nextGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    remainingCoords.forEach((pt, idx) => {
      nextGrid[pt.r][pt.c].tileId = shuffled[idx];
    });
    if (findAllValidPairs(nextGrid).length > 0) {
      return nextGrid;
    }
  }

  const nextGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
  if (remainingCoords.length >= 2) {
    const firstId = remainingIds[0];
    const mateIdx = remainingIds.findIndex((id, i) => i > 0 && id === firstId);
    if (mateIdx > 0) {
      const c1 = remainingCoords[1];
      const cm = remainingCoords[mateIdx];
      const tmp = nextGrid[c1.r][c1.c].tileId;
      nextGrid[c1.r][c1.c].tileId = nextGrid[cm.r][cm.c].tileId;
      nextGrid[cm.r][cm.c].tileId = tmp;
      if (findAllValidPairs(nextGrid).length > 0) return nextGrid;
    }
  }
  return nextGrid;
}

export function applyBoardGravity(
  grid: BoardCell[][],
  mode: GravityMode,
  moveCount: number
): BoardCell[][] {
  if (mode === "none") return grid;

  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const next = grid.map((row) => row.map((cell) => ({ ...cell })));

  if (mode === "down" || (mode === "alternate" && moveCount % 2 === 0)) {
    for (let c = 0; c < cols; c++) {
      let writeR = rows - 1;
      for (let r = rows - 1; r >= 0; r--) {
        if (next[r][c].isBlocker) {
          writeR = r - 1;
          continue;
        }
        if (next[r][c].tileId !== null) {
          if (writeR !== r) {
            next[writeR][c].tileId = next[r][c].tileId;
            next[r][c].tileId = null;
          }
          writeR--;
        }
      }
    }
  } else if (mode === "center") {
    const mid = Math.floor(rows / 2);
    for (let c = 0; c < cols; c++) {
      let writeTop = mid - 1;
      for (let r = mid - 1; r >= 0; r--) {
        if (next[r][c].isBlocker) {
          writeTop = r - 1;
          continue;
        }
        if (next[r][c].tileId !== null) {
          if (writeTop !== r) {
            next[writeTop][c].tileId = next[r][c].tileId;
            next[r][c].tileId = null;
          }
          writeTop--;
        }
      }
      let writeBot = mid;
      for (let r = mid; r < rows; r++) {
        if (next[r][c].isBlocker) {
          writeBot = r + 1;
          continue;
        }
        if (next[r][c].tileId !== null) {
          if (writeBot !== r) {
            next[writeBot][c].tileId = next[r][c].tileId;
            next[r][c].tileId = null;
          }
          writeBot++;
        }
      }
    }
  } else if (mode === "alternate") {
    for (let r = 0; r < rows; r++) {
      if (r % 2 === 0) {
        let writeC = 0;
        for (let c = 0; c < cols; c++) {
          if (next[r][c].isBlocker) {
            writeC = c + 1;
            continue;
          }
          if (next[r][c].tileId !== null) {
            if (writeC !== c) {
              next[r][writeC].tileId = next[r][c].tileId;
              next[r][c].tileId = null;
            }
            writeC++;
          }
        }
      } else {
        let writeC = cols - 1;
        for (let c = cols - 1; c >= 0; c--) {
          if (next[r][c].isBlocker) {
            writeC = c - 1;
            continue;
          }
          if (next[r][c].tileId !== null) {
            if (writeC !== c) {
              next[r][writeC].tileId = next[r][c].tileId;
              next[r][c].tileId = null;
            }
            writeC--;
          }
        }
      }
    }
  }

  return next;
}

export function countRemainingTiles(grid: BoardCell[][]): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.tileId && !cell.isBlocker) count++;
    }
  }
  return count;
}
