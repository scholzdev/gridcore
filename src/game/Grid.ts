
// Re-export everything from config for backward compatibility
export { TileType, ModuleType, BUILDING_STATS, MODULE_DEFS, ORE_BUILDINGS, BUILDING_REGISTRY, getMaxHP } from '../config';
export type { Building, ModuleDef } from '../config';

import { TileType, ModuleType, BUILDING_STATS, BUILDING_REGISTRY, MODULE_DEFS, ORE_BUILDINGS, getMaxHP } from '../config';
import { GRID_SIZE, ORE_PATCH_COUNT, CORE_PLACEMENT_MARGIN, SEED_LENGTH, MAX_BUILDING_LEVEL } from '../constants';

/** Mulberry32 seeded PRNG — returns a function that yields [0,1) */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate a random 6-char alphanumeric seed string */
export function generateSeedString(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let s = '';
  for (let i = 0; i < SEED_LENGTH; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/** Convert a seed string to a numeric hash */
export function seedToNumber(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return h;
}

export class GameGrid {
  size: number;
  tiles: number[][];
  healths: number[][];
  shields: number[][];
  modules: number[][];  // ModuleType per tile
  levels: number[][];
  coreX: number = -1;
  coreY: number = -1;
  seed: string;

  constructor(size: number = GRID_SIZE, seed?: string) {
    this.size = size;
    this.seed = seed || generateSeedString();
    const rng = mulberry32(seedToNumber(this.seed));
    this.tiles = Array(size).fill(0).map(() => Array(size).fill(TileType.EMPTY));
    this.healths = Array(size).fill(0).map(() => Array(size).fill(0));
    this.shields = Array(size).fill(0).map(() => Array(size).fill(0));
    this.modules = Array(size).fill(0).map(() => Array(size).fill(ModuleType.NONE));
    this.levels = Array(size).fill(0).map(() => Array(size).fill(0));
    
    for (let i = 0; i < ORE_PATCH_COUNT; i++) {
      const x = Math.floor(rng() * size);
      const y = Math.floor(rng() * size);
      this.tiles[y][x] = TileType.ORE_PATCH;
    }
  }

  placeCore(x: number, y: number): boolean {
    if (x < CORE_PLACEMENT_MARGIN || y < CORE_PLACEMENT_MARGIN || x >= this.size - CORE_PLACEMENT_MARGIN || y >= this.size - CORE_PLACEMENT_MARGIN) return false;
    // Nicht auf Erz platzieren
    if (this.tiles[y][x] === TileType.ORE_PATCH) return false;
    // Clear ore patches around core (3x3)
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (this.tiles[y + dy][x + dx] === TileType.ORE_PATCH) {
          this.tiles[y + dy][x + dx] = TileType.EMPTY;
        }
      }
    }
    this.tiles[y][x] = TileType.CORE;
    this.healths[y][x] = BUILDING_STATS[TileType.CORE].health!;
    this.levels[y][x] = 1;
    this.coreX = x;
    this.coreY = y;
    return true;
  }

  placeBuilding(x: number, y: number, type: TileType): boolean {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return false;
    const current = this.tiles[y][x];
    
    // Core nicht überschreiben
    if (current === TileType.CORE) return false;

    // Regeln prüfen
    if (ORE_BUILDINGS.includes(type)) { if (current !== TileType.ORE_PATCH) return false; }
    else { if (current !== TileType.EMPTY) return false; }

    // maxCount check (e.g. Command Center: max 1)
    const cfg = BUILDING_REGISTRY[type];
    if (cfg?.maxCount) {
      let count = 0;
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          if (this.tiles[r][c] === type) count++;
        }
      }
      if (count >= cfg.maxCount) return false;
    }

    this.tiles[y][x] = type;
    this.levels[y][x] = 1;
    this.healths[y][x] = BUILDING_STATS[type]?.health || 100;
    this.shields[y][x] = 0;
    this.modules[y][x] = ModuleType.NONE;
    // Invalidate pathfinding cache & force enemy repath
    this.invalidatePaths();
    return true;
  }

  upgradeBuilding(x: number, y: number): boolean {
    if (this.levels[y][x] >= MAX_BUILDING_LEVEL) return false; // Max Level
    
    this.levels[y][x]++;
    const type = this.tiles[y][x];
    const newMaxHP = getMaxHP(type, this.levels[y][x]);
    this.healths[y][x] = newMaxHP; // Voll heilen beim Upgrade
    return true;
  }

  installModule(x: number, y: number, mod: ModuleType): boolean {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return false;
    const type = this.tiles[y][x];
    if (type === TileType.EMPTY || type === TileType.ORE_PATCH || type === TileType.CORE) return false;
    // Check if module applies to this building type
    const def = MODULE_DEFS[mod];
    if (!def || !def.appliesTo.includes(type)) return false;
    this.modules[y][x] = mod;
    return true;
  }

  removeModule(x: number, y: number): ModuleType {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return ModuleType.NONE;
    const old = this.modules[y][x];
    this.modules[y][x] = ModuleType.NONE;
    return old;
  }

  removeBuilding(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return 0;
    const type = this.tiles[y][x];
    if (type === TileType.EMPTY || type === TileType.ORE_PATCH || type === TileType.CORE) return 0;
    // Miner/Drill/Smelter steht auf Ore Patch -> zurück zu Ore Patch
    this.tiles[y][x] = ORE_BUILDINGS.includes(type) ? TileType.ORE_PATCH : TileType.EMPTY;
    const level = this.levels[y][x];
    this.levels[y][x] = 0;
    this.healths[y][x] = 0;
    this.shields[y][x] = 0;
    this.modules[y][x] = ModuleType.NONE;
    // Invalidate pathfinding cache & force enemy repath
    this.invalidatePaths();
    return level;
  }

  // ── A* Pathfinding ──────────────────────────────────────────

  /** Cache of paths from edge cells to core. Cleared when buildings change. */
  _pathCache: Map<string, { x: number; y: number }[] | null> = new Map();
  /** Incremented every time paths are invalidated so enemies know to repath */
  pathGeneration: number = 0;

  /** Check if a tile is walkable (empty or core only — enemies path around ore & buildings) */
  isWalkable(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return false;
    const t = this.tiles[y][x];
    return t === TileType.EMPTY || t === TileType.CORE;
  }

  /** Check if diagonal move is valid (both adjacent cardinal cells must be walkable) */
  isDiagonalWalkable(x: number, y: number, dx: number, dy: number): boolean {
    return this.isWalkable(x + dx, y) && this.isWalkable(x, y + dy);
  }

  /** Invalidate cached paths (call after building placement/removal) */
  invalidatePaths() {
    this._pathCache.clear();
    this.pathGeneration++;
  }

  /** Check line-of-sight between two grid cells (Bresenham-style walkability check) */
  hasLineOfSight(x0: number, y0: number, x1: number, y1: number): boolean {
    let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      if (!this.isWalkable(x0, y0)) return false;
      if (x0 === x1 && y0 === y1) return true;
      const e2 = 2 * err;
      // Check diagonal corners to prevent cutting through walls
      if (e2 > -dy && e2 < dx) {
        // Diagonal step — ensure both adjacent cells are walkable
        if (!this.isWalkable(x0 + sx, y0) || !this.isWalkable(x0, y0 + sy)) return false;
      }
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  }

  /** Smooth a path by removing unnecessary waypoints via line-of-sight */
  smoothPath(path: { x: number; y: number }[]): { x: number; y: number }[] {
    if (path.length <= 2) return path;
    const smoothed: { x: number; y: number }[] = [path[0]];
    let current = 0;
    while (current < path.length - 1) {
      let farthest = current + 1;
      for (let i = path.length - 1; i > current + 1; i--) {
        if (this.hasLineOfSight(path[current].x, path[current].y, path[i].x, path[i].y)) {
          farthest = i;
          break;
        }
      }
      smoothed.push(path[farthest]);
      current = farthest;
    }
    return smoothed;
  }

  /** A* pathfinding from (sx,sy) to core. Returns smoothed path excluding start, or null if no path. */
  findPath(sx: number, sy: number): { x: number; y: number }[] | null {
    const key = `${sx},${sy}`;
    if (this._pathCache.has(key)) return this._pathCache.get(key)!;

    const gx = this.coreX;
    const gy = this.coreY;
    if (gx < 0 || gy < 0) return null;
    if (sx === gx && sy === gy) { this._pathCache.set(key, []); return []; }

    const size = this.size;
    const SQRT2 = 1.414;

    // Flat arrays for g-scores and parent tracking (much faster than Map/Set)
    const gScore = new Float32Array(size * size).fill(Infinity);
    const parentIdx = new Int32Array(size * size).fill(-1);
    const inClosed = new Uint8Array(size * size);
    const idx = (x: number, y: number) => y * size + x;

    // Binary heap priority queue (min-heap by f-score)
    const heapNodes: number[] = []; // indices into flat arrays
    const fScore = new Float32Array(size * size).fill(Infinity);

    const heuristic = (x: number, y: number) => {
      // Octile distance (admissible for 8-dir)
      const adx = Math.abs(x - gx), ady = Math.abs(y - gy);
      return Math.max(adx, ady) + (SQRT2 - 1) * Math.min(adx, ady);
    };

    // Heap operations
    const heapPush = (nodeIdx: number) => {
      heapNodes.push(nodeIdx);
      let i = heapNodes.length - 1;
      while (i > 0) {
        const parent = (i - 1) >> 1;
        if (fScore[heapNodes[i]] < fScore[heapNodes[parent]]) {
          [heapNodes[i], heapNodes[parent]] = [heapNodes[parent], heapNodes[i]];
          i = parent;
        } else break;
      }
    };

    const heapPop = (): number => {
      const top = heapNodes[0];
      const last = heapNodes.pop()!;
      if (heapNodes.length > 0) {
        heapNodes[0] = last;
        let i = 0;
        while (true) {
          let smallest = i;
          const l = 2 * i + 1, r = 2 * i + 2;
          if (l < heapNodes.length && fScore[heapNodes[l]] < fScore[heapNodes[smallest]]) smallest = l;
          if (r < heapNodes.length && fScore[heapNodes[r]] < fScore[heapNodes[smallest]]) smallest = r;
          if (smallest !== i) {
            [heapNodes[i], heapNodes[smallest]] = [heapNodes[smallest], heapNodes[i]];
            i = smallest;
          } else break;
        }
      }
      return top;
    };

    const startIdx = idx(sx, sy);
    gScore[startIdx] = 0;
    fScore[startIdx] = heuristic(sx, sy);
    heapPush(startIdx);

    // 8-directional neighbors: [dx, dy, cost]
    const dirs: [number, number, number][] = [
      [0, -1, 1], [1, 0, 1], [0, 1, 1], [-1, 0, 1],
      [1, -1, SQRT2], [1, 1, SQRT2], [-1, 1, SQRT2], [-1, -1, SQRT2],
    ];

    let iterations = 0;
    const maxIter = size * size * 4;

    while (heapNodes.length > 0 && iterations++ < maxIter) {
      const curIdx = heapPop();
      const cx = curIdx % size;
      const cy = (curIdx - cx) / size;

      if (cx === gx && cy === gy) {
        // Reconstruct path
        const path: { x: number; y: number }[] = [];
        let ni = curIdx;
        while (ni !== -1) {
          const px = ni % size;
          const py = (ni - px) / size;
          path.unshift({ x: px, y: py });
          ni = parentIdx[ni];
        }
        // Remove start cell (enemy is already there), smooth, cache
        const trimmed = path.length > 1 ? path.slice(1) : path;
        const smoothed = this.smoothPath(trimmed);
        this._pathCache.set(key, smoothed);
        return smoothed;
      }

      if (inClosed[curIdx]) continue;
      inClosed[curIdx] = 1;

      for (const [ddx, ddy, cost] of dirs) {
        const nx = cx + ddx;
        const ny = cy + ddy;
        if (!this.isWalkable(nx, ny)) continue;
        // For diagonal moves, check corner-cutting
        if (ddx !== 0 && ddy !== 0) {
          if (!this.isWalkable(cx + ddx, cy) || !this.isWalkable(cx, cy + ddy)) continue;
        }
        const nIdx = idx(nx, ny);
        if (inClosed[nIdx]) continue;
        const ng = gScore[curIdx] + cost;
        if (ng < gScore[nIdx]) {
          gScore[nIdx] = ng;
          fScore[nIdx] = ng + heuristic(nx, ny);
          parentIdx[nIdx] = curIdx;
          heapPush(nIdx);
        }
      }
    }

    // No path found
    this._pathCache.set(key, null);
    return null;
  }

  /** Check if placing a building at (x,y) would block all paths to core */
  wouldBlockPath(x: number, y: number): boolean {
    if (this.coreX < 0 || this.coreY < 0) return false;
    // Don't block if tile is already non-walkable
    if (!this.isWalkable(x, y)) return false;

    // First check: is the core CURRENTLY reachable from any edge?
    // If core is already fully surrounded, allow placement — can't make it worse.
    if (!this._isCoreReachable()) return false;

    // Temporarily mark as blocked
    const old = this.tiles[y][x];
    this.tiles[y][x] = TileType.WALL;

    const reachable = this._isCoreReachable();

    this.tiles[y][x] = old;
    return !reachable;
  }

  /** BFS from core — returns true if any edge cell is reachable via 8-dir movement */
  private _isCoreReachable(): boolean {
    const size = this.size;
    const visited = new Uint8Array(size * size);
    const queue: number[] = [this.coreY * size + this.coreX];
    visited[this.coreY * size + this.coreX] = 1;
    let head = 0;

    const dirs: [number, number][] = [
      [0, -1], [1, 0], [0, 1], [-1, 0],
      [1, -1], [1, 1], [-1, 1], [-1, -1],
    ];

    while (head < queue.length) {
      const ci = queue[head++];
      const cx = ci % size;
      const cy = (ci - cx) / size;
      if (cx === 0 || cy === 0 || cx === size - 1 || cy === size - 1) {
        return true;
      }
      for (const [ddx, ddy] of dirs) {
        const nx = cx + ddx, ny = cy + ddy;
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
        const ni = ny * size + nx;
        if (visited[ni]) continue;
        if (!this.isWalkable(nx, ny)) continue;
        if (ddx !== 0 && ddy !== 0) {
          if (!this.isWalkable(cx + ddx, cy) || !this.isWalkable(cx, cy + ddy)) continue;
        }
        visited[ni] = 1;
        queue.push(ni);
      }
    }

    return false;
  }
}
