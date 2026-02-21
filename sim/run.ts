#!/usr/bin/env npx tsx
// ══════════════════════════════════════════════════════════════
// GRIDCORE — Headless AI Simulation Agent
// Runs N games with a simple AI strategy, collects stats.
//
// Usage:  npx tsx sim/run.ts [--games 100] [--mode wellen|endlos] [--diff leicht|mittel|schwer] [--speed]
// ══════════════════════════════════════════════════════════════

// ── Mock Browser APIs before any game imports ────────────────
// @ts-nocheck

const noopFn = () => {};
const noopObj = new Proxy({}, { get: () => noopFn });

// Mock localStorage
globalThis.localStorage = {
  _data: {} as Record<string, string>,
  getItem(k: string) { return this._data[k] ?? null; },
  setItem(k: string, v: string) { this._data[k] = v; },
  removeItem(k: string) { delete this._data[k]; },
  clear() { this._data = {}; },
  get length() { return Object.keys(this._data).length; },
  key(i: number) { return Object.keys(this._data)[i] ?? null; },
} as any;

// Mock window
globalThis.window = {
  innerWidth: 1200,
  innerHeight: 900,
  addEventListener: noopFn,
  removeEventListener: noopFn,
} as any;

// Mock AudioContext — full recursive proxy so any method chain works
const deepProxy: any = new Proxy(() => deepProxy, {
  get: (_t, prop) => {
    if (prop === 'then') return undefined; // prevent Promise detection
    if (prop === 'value') return 0;
    if (prop === 'state') return 'running';
    if (prop === 'currentTime') return 0;
    if (prop === 'sampleRate') return 44100;
    if (prop === 'destination') return {};
    if (prop === 'length') return 0;
    if (prop === 'getChannelData') return () => new Float32Array(22050);
    return deepProxy;
  },
  set: () => true,
  apply: () => deepProxy,
});

globalThis.AudioContext = class {
  state = 'running';
  currentTime = 0;
  sampleRate = 44100;
  destination = {};
  resume() { return Promise.resolve(); }
  createOscillator() { return deepProxy; }
  createGain() { return deepProxy; }
  createBuffer() { return deepProxy; }
  createBufferSource() { return deepProxy; }
  createBiquadFilter() { return deepProxy; }
} as any;

// Mock HTMLCanvasElement
class MockCanvas {
  width = 800;
  height = 800;
  style = {};
  getContext() {
    return new Proxy({}, {
      get: (_t, prop) => {
        if (prop === 'canvas') return this;
        if (prop === 'measureText') return () => ({ width: 10 });
        if (prop === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
        return noopFn;
      },
      set: () => true,
    });
  }
  addEventListener = noopFn;
  removeEventListener = noopFn;
  getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 800 }; }
}

// Mock document (some modules might reference it)
globalThis.document = {
  createElement: () => new MockCanvas(),
  addEventListener: noopFn,
  removeEventListener: noopFn,
  body: { appendChild: noopFn },
} as any;

// ── Now import game modules ──────────────────────────────────
import { GameEngine } from '../src/game/Engine';
import { TileType, BUILDING_STATS, BUILDING_REGISTRY, TECH_TREE, ALL_BUILDINGS, ORE_BUILDINGS, getMaxHP, ModuleType, MODULE_DEFS, ALL_MODULES } from '../src/config/index';
import type { TechNode } from '../src/config/index';
import { GRID_SIZE } from '../src/constants';
import { tickMapEvents } from '../src/game/MapEvents';
import { detonateMines, moveEnemies, turretLogic, updateProjectiles, updateDrones } from '../src/game/Combat';
import { tickAbilities } from '../src/game/Abilities';
import { RESEARCH_NODES, canResearch, getResearchCost, getResearchLevel } from '../src/game/Research';
import * as fs from 'fs';
import * as path from 'path';
import type { ReplayAction, ReplayData } from '../src/game/Replay';
export type { ReplayAction, ReplayData };

// ── CLI Args ─────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name: string, def: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : def;
}
const NUM_GAMES = parseInt(getArg('games', '20'));
const GAME_MODE = getArg('mode', 'wellen') as 'wellen' | 'endlos';
const DIFFICULTY = getArg('diff', 'mittel') as 'leicht' | 'mittel' | 'schwer';
const SAVE_REPLAYS = args.includes('--save-replays');
const VERBOSE = args.includes('--verbose');

// ── AI Strategy ──────────────────────────────────────────────

interface BuildOrder {
  type: TileType;
  priority: number;
  requiresOre: boolean;
  maxCount?: number;
}

// Priority phases: economy first, then defense, then tech
function getAIBuildOrders(engine: GameEngine, phase: 'early' | 'mid' | 'late'): BuildOrder[] {
  const orders: BuildOrder[] = [];
  const unlocked = engine.unlockedBuildings;

  // Count existing buildings
  const counts: Record<number, number> = {};
  const size = engine.grid.size;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const t = engine.grid.tiles[y][x];
      if (t !== TileType.EMPTY && t !== TileType.ORE_PATCH)
        counts[t] = (counts[t] || 0) + 1;
    }

  const ct = (t: TileType) => counts[t] || 0;
  const netEnergy = engine.netIncome.energy;
  const netScrap = engine.netIncome.scrap;

  // Helper: add building if unlocked and below cap
  const want = (type: TileType, max: number, prio: number, needOre = false) => {
    if (!unlocked.has(type)) return;
    if (ct(type) >= max) return;
    orders.push({ type, priority: prio, requiresOre: needOre });
  };

  // Energy shortage: prefer Fusion/Hyper reactor if unlocked, else solar
  if (netEnergy < 5) {
    if (unlocked.has(TileType.HYPER_REACTOR) && ct(TileType.HYPER_REACTOR) < 1)
      orders.push({ type: TileType.HYPER_REACTOR, priority: 100, requiresOre: false });
    else if (unlocked.has(TileType.FUSION_REACTOR) && ct(TileType.FUSION_REACTOR) < 3)
      orders.push({ type: TileType.FUSION_REACTOR, priority: 100, requiresOre: false });
    else if (ct(TileType.SOLAR_PANEL) < 8)
      orders.push({ type: TileType.SOLAR_PANEL, priority: 100, requiresOre: false });
  }

  if (phase === 'early') {
    // Early: solar → miner → turret → wall (limited solar cap)
    if (ct(TileType.SOLAR_PANEL) < 3) orders.push({ type: TileType.SOLAR_PANEL, priority: 10, requiresOre: false });
    if (ct(TileType.MINER) < 3) orders.push({ type: TileType.MINER, priority: 9, requiresOre: true });
    if (ct(TileType.TURRET) < 3) orders.push({ type: TileType.TURRET, priority: 8, requiresOre: false });
    if (ct(TileType.WALL) < 6) orders.push({ type: TileType.WALL, priority: 7, requiresOre: false });
    if (ct(TileType.SOLAR_PANEL) < 5) orders.push({ type: TileType.SOLAR_PANEL, priority: 6, requiresOre: false });
    if (ct(TileType.MINER) < 4) orders.push({ type: TileType.MINER, priority: 5, requiresOre: true });
  }

  if (phase === 'mid') {
    // Mid: steel chain, heavy turrets, economy diversification
    want(TileType.STEEL_SMELTER, 3, 10, true);
    want(TileType.HEAVY_TURRET, 4, 9);
    if (ct(TileType.TURRET) < 4) orders.push({ type: TileType.TURRET, priority: 8, requiresOre: false });
    if (ct(TileType.WALL) < 12) orders.push({ type: TileType.WALL, priority: 7, requiresOre: false });
    want(TileType.FABRICATOR, 2, 6.5);
    want(TileType.LAB, 2, 6); // more labs for data
    want(TileType.REPAIR_BAY, 2, 5.5);
    want(TileType.SLOW_FIELD, 2, 5);
    want(TileType.SHIELD_GENERATOR, 1, 4.5);
    // Mid energy: prefer Fusion Reactor over solar spam
    want(TileType.FUSION_REACTOR, 1, 4);
    if (ct(TileType.MINER) < 5) orders.push({ type: TileType.MINER, priority: 3, requiresOre: true });
    // Only build solar if low on energy AND no fusion available
    if (netEnergy < 20 && !unlocked.has(TileType.FUSION_REACTOR) && ct(TileType.SOLAR_PANEL) < 8) {
      orders.push({ type: TileType.SOLAR_PANEL, priority: 2, requiresOre: false });
    }
  }

  if (phase === 'late') {
    // Late: big guns, Hyper Reactor, Quantum Factory, all late-game items
    want(TileType.HYPER_REACTOR, 1, 12); // #1 priority: massive energy
    want(TileType.FUSION_REACTOR, 3, 11); // backup energy
    want(TileType.QUANTUM_FACTORY, 2, 10.5); // produces steel+electronics+data
    want(TileType.DATA_VAULT, 1, 10); // buffs data production
    want(TileType.ION_CANNON, 3, 9.5);
    want(TileType.PLASMA_CANNON, 3, 9);
    want(TileType.GRAVITY_CANNON, 1, 8.5); // AoE slow + pull
    want(TileType.SHOCKWAVE_TOWER, 2, 8); // AoE pulse damage
    want(TileType.HEAVY_TURRET, 8, 7.5);
    want(TileType.ARTILLERY, 3, 7);
    want(TileType.OVERDRIVE_TURRET, 2, 6.5); // high risk high reward
    want(TileType.SHIELD_GENERATOR, 2, 6);
    want(TileType.SLOW_FIELD, 3, 5.5);
    want(TileType.RADAR_STATION, 2, 5);
    want(TileType.COMMAND_CENTER, 1, 4.5);
    if (ct(TileType.WALL) < 20) orders.push({ type: TileType.WALL, priority: 4, requiresOre: false });
    want(TileType.ANNIHILATOR, 1, 3.5);
    want(TileType.LASER_TURRET, 3, 3);
    want(TileType.NANITE_DOME, 1, 2.5);
    want(TileType.LAB, 3, 2); // more data production in late game
    // Solar only as last resort, very limited
    if (netEnergy < 30 && ct(TileType.SOLAR_PANEL) < 8 && ct(TileType.FUSION_REACTOR) >= 2) {
      orders.push({ type: TileType.SOLAR_PANEL, priority: 1, requiresOre: false });
    }
  }

  return orders.sort((a, b) => b.priority - a.priority);
}

function getPhase(engine: GameEngine): 'early' | 'mid' | 'late' {
  if (engine.gameMode === 'wellen') {
    if (engine.currentWave <= 3) return 'early';
    if (engine.currentWave <= 8) return 'mid';
    return 'late';
  }
  if (engine.gameTime < 60) return 'early';
  if (engine.gameTime < 180) return 'mid';
  return 'late';
}

function findPlacement(engine: GameEngine, type: TileType): { x: number; y: number } | null {
  const size = engine.grid.size;
  const needsOre = ORE_BUILDINGS.includes(type);
  const cx = engine.grid.coreX;
  const cy = engine.grid.coreY;

  // Check maxCount
  const cfg = BUILDING_REGISTRY[type];
  if (cfg?.maxCount) {
    let count = 0;
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (engine.grid.tiles[r][c] === type) count++;
    if (count >= cfg.maxCount) return null;
  }

  // Find closest valid tile to core
  let best: { x: number; y: number; dist: number } | null = null;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const tile = engine.grid.tiles[y][x];
      const valid = needsOre ? tile === TileType.ORE_PATCH : tile === TileType.EMPTY;
      if (!valid) continue;
      const dist = Math.abs(x - cx) + Math.abs(y - cy);
      // Turrets/defense: prefer slightly away from core (ring)
      const isCombat = cfg?.category === 'defense';
      const targetDist = isCombat ? Math.abs(dist - 4) : dist;
      if (!best || targetDist < best.dist) {
        best = { x, y, dist: targetDist };
      }
    }
  }
  return best;
}

// Current replay action log (set per game)
let replayLog: ReplayAction[] = [];
let currentTick = 0;

function aiTryUnlockTech(engine: GameEngine) {
  // Unlock cheapest available tech
  const sortedTech = [...TECH_TREE].sort((a, b) => a.killCost - b.killCost);
  for (const node of sortedTech) {
    if (engine.unlockedBuildings.has(node.unlocks)) continue;
    if (engine.killPoints >= node.killCost) {
      engine.unlockBuilding(node);
      replayLog.push({ tick: currentTick, action: 'unlock', techId: node.id });
      return;
    }
  }
}

function aiTryBuild(engine: GameEngine) {
  const phase = getPhase(engine);
  const orders = getAIBuildOrders(engine, phase);

  for (const order of orders) {
    if (!engine.unlockedBuildings.has(order.type) && order.type !== TileType.SOLAR_PANEL && order.type !== TileType.MINER && order.type !== TileType.WALL && order.type !== TileType.TURRET) continue;
    const cost = engine.getCurrentCost(order.type);
    if (!engine.resources.canAfford(cost)) continue;

    const spot = findPlacement(engine, order.type);
    if (!spot) continue;

    if (engine.grid.placeBuilding(spot.x, spot.y, order.type)) {
      engine.resources.spend(cost);
      engine.firePlaceHook(spot.x, spot.y);
      engine.grid.healths[spot.y][spot.x] = Math.round(engine.getMaxHP(order.type, 1));
      engine.purchasedCounts[order.type] = (engine.purchasedCounts[order.type] || 0) + 1;
      engine.buildingsPlaced++;
      replayLog.push({ tick: currentTick, action: 'place', x: spot.x, y: spot.y, type: order.type });
      return; // One building per tick
    }
  }

  // If nothing to build, try upgrading existing combat buildings
  aiTryUpgrade(engine);
}

function aiTryUpgrade(engine: GameEngine) {
  const size = engine.grid.size;
  // Find lowest-level combat building to upgrade
  let best: { x: number; y: number; type: number; level: number } | null = null;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const type = engine.grid.tiles[y][x];
      if (type === TileType.EMPTY || type === TileType.ORE_PATCH || type === TileType.CORE) continue;
      const cfg = BUILDING_REGISTRY[type];
      if (!cfg || cfg.category !== 'defense') continue;
      const level = engine.grid.levels[y][x];
      if (level >= 5) continue; // Don't go crazy with upgrades
      if (!best || level < best.level) {
        best = { x, y, type, level };
      }
    }
  }
  if (!best) return;
  const upgradeCost = engine.getUpgradeCost(best.type, best.level);
  if (upgradeCost && engine.resources.canAfford(upgradeCost)) {
    if (engine.grid.upgradeBuilding(best.x, best.y)) {
      engine.resources.spend(upgradeCost);
      engine.fireUpgradeHook(best.x, best.y, best.level, best.level + 1);
      engine.grid.healths[best.y][best.x] = Math.round(engine.getMaxHP(best.type, best.level + 1));
      replayLog.push({ tick: currentTick, action: 'upgrade', x: best.x, y: best.y, type: best.type });
    }
  }
}

// ── AI: Research with Data ───────────────────────────────────

/** Priority order for research — buy the best affordable node */
const RESEARCH_PRIORITY = [
  'fireRate',    // turrets fire faster
  'armor',       // more HP on everything
  'cheapBuild',  // cheaper buildings
  'yield',       // more income
  'efficiency',  // less energy drain
  'shieldBoost', // stronger shields
  'range',       // more turret range
  'dataCompress',// more data output
  'repairBoost', // better healing
  'moduleSynergy', // module effects +20%
];

function aiTryResearch(engine: GameEngine) {
  const data = engine.resources.state.data;
  if (data < 25) return; // save data for early game

  for (const nodeId of RESEARCH_PRIORITY) {
    const node = RESEARCH_NODES.find(n => n.id === nodeId);
    if (!node) continue;
    if (canResearch(engine.research, node, data, engine.prestigeResearchCostMult ?? 1)) {
      if (engine.buyResearch(nodeId)) {
        replayLog.push({ tick: currentTick, action: 'research', researchId: nodeId });
        return;
      }
    }
  }
}

// ── AI: Module Installation ──────────────────────────────────

/** Module priorities: what to install on which building type */
interface ModulePlan {
  moduleType: ModuleType;
  targetCategory: 'defense' | 'infrastructure' | 'processing' | 'support';
  targetTypes?: TileType[]; // specific types, or use category
  priority: number;
}

const MODULE_PLANS: ModulePlan[] = [
  // Combat modules on defense buildings (high priority)
  { moduleType: ModuleType.DAMAGE_AMP,    targetCategory: 'defense', priority: 10 },
  { moduleType: ModuleType.ATTACK_SPEED,  targetCategory: 'defense', priority: 9 },
  { moduleType: ModuleType.CRITICAL_HIT,  targetCategory: 'defense', priority: 8 },
  { moduleType: ModuleType.CHAIN,         targetCategory: 'defense', priority: 7 },
  { moduleType: ModuleType.PIERCING,      targetCategory: 'defense', priority: 6 },
  { moduleType: ModuleType.SLOW_HIT,      targetCategory: 'defense', priority: 5 },
  { moduleType: ModuleType.RANGE_BOOST,   targetCategory: 'defense', priority: 4 },
  // Defense modules on walls
  { moduleType: ModuleType.THORNS,        targetCategory: 'defense', targetTypes: [TileType.WALL], priority: 3.5 },
  { moduleType: ModuleType.ABSORBER,      targetCategory: 'defense', targetTypes: [TileType.WALL], priority: 3.2 },
  { moduleType: ModuleType.WALL_SLOW,     targetCategory: 'defense', targetTypes: [TileType.WALL], priority: 3 },
  // Economy modules on production buildings
  { moduleType: ModuleType.DOUBLE_YIELD,  targetCategory: 'processing', priority: 2.5 },
  { moduleType: ModuleType.EFFICIENCY,    targetCategory: 'infrastructure', priority: 2 },
  { moduleType: ModuleType.OVERCHARGE,    targetCategory: 'processing', priority: 1.5 },
  // Regen on support buildings
  { moduleType: ModuleType.REGEN,         targetCategory: 'support', priority: 1 },
];

function aiTryInstallModule(engine: GameEngine) {
  const size = engine.grid.size;
  const phase = getPhase(engine);
  if (phase === 'early') return; // don't waste resources on modules early

  for (const plan of MODULE_PLANS) {
    const modDef = MODULE_DEFS[plan.moduleType];
    if (!modDef) continue;

    // Check if module is unlocked (requiresUnlock)
    if (modDef.requiresUnlock && !engine.unlockedBuildings.has(modDef.requiresUnlock)) continue;

    // Can afford?
    if (!engine.resources.canAfford(modDef.cost)) continue;

    // Find a building without a module that this module applies to
    let bestTarget: { x: number; y: number; level: number } | null = null;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const type = engine.grid.tiles[y][x];
        if (type === TileType.EMPTY || type === TileType.ORE_PATCH || type === TileType.CORE) continue;
        // Already has a module — skip
        if (engine.grid.modules[y][x] !== ModuleType.NONE) continue;

        const cfg = BUILDING_REGISTRY[type];
        if (!cfg) continue;

        // Check category or specific types
        if (plan.targetTypes) {
          if (!plan.targetTypes.includes(type)) continue;
        } else {
          if (cfg.category !== plan.targetCategory) continue;
        }

        // Check if module actually applies to this building type
        if (!modDef.appliesTo.includes(type)) continue;

        const level = engine.grid.levels[y][x] || 1;
        // Prefer higher-level buildings for modules
        if (!bestTarget || level > bestTarget.level) {
          bestTarget = { x, y, level };
        }
      }
    }

    if (bestTarget) {
      if (engine.grid.installModule(bestTarget.x, bestTarget.y, plan.moduleType)) {
        engine.resources.spend(modDef.cost);
        replayLog.push({
          tick: currentTick,
          action: 'module',
          x: bestTarget.x,
          y: bestTarget.y,
          moduleType: plan.moduleType,
        });
        return; // One module per tick
      }
    }
  }
}

// ── AI: Building Value Rating ─────────────────────────────────

/** Rate a building's value (higher = more valuable, should keep).
 *  Low-value buildings are candidates for removal & replacement. */
function rateBuildingValue(engine: GameEngine, x: number, y: number): number {
  const type = engine.grid.tiles[y][x];
  if (type === TileType.EMPTY || type === TileType.ORE_PATCH || type === TileType.CORE) return Infinity;

  const cfg = BUILDING_REGISTRY[type];
  if (!cfg) return 0;
  const level = engine.grid.levels[y][x] || 1;
  const stats = BUILDING_STATS[type];
  if (!stats) return 0;

  const phase = getPhase(engine);
  let value = 0;

  // Base value by category
  if (cfg.category === 'defense') {
    // Combat buildings: value = damage potential × level
    const baseDmg = stats.damage || 0;
    const range = stats.range || 0;
    value = baseDmg * level * (1 + range * 0.1);

    // High-tier combat is more valuable
    const tierBonus: Record<number, number> = {
      [TileType.ION_CANNON]: 8,
      [TileType.PLASMA_CANNON]: 7,
      [TileType.ANNIHILATOR]: 10,
      [TileType.GRAVITY_CANNON]: 6,
      [TileType.SHOCKWAVE_TOWER]: 5,
      [TileType.HEAVY_TURRET]: 4,
      [TileType.ARTILLERY]: 4,
      [TileType.OVERDRIVE_TURRET]: 5,
      [TileType.LASER_TURRET]: 3,
      [TileType.TESLA_COIL]: 2,
      [TileType.TURRET]: 1,
    };
    value += (tierBonus[type] || 0) * 10 * level;
  } else if (cfg.category === 'infrastructure') {
    // Energy buildings: value based on phase
    if (type === TileType.SOLAR_PANEL) {
      // Solar panels lose value over time as better alternatives exist
      value = phase === 'early' ? 30 : phase === 'mid' ? 15 : 5;
    } else if (type === TileType.FUSION_REACTOR) {
      value = 60 * level;
    } else if (type === TileType.HYPER_REACTOR) {
      value = 120 * level;
    } else if (type === TileType.ENERGY_RELAY) {
      value = 20 * level;
    } else {
      value = 20 * level;
    }
  } else if (cfg.category === 'processing') {
    // Economy: miners, smelters, fabricators, etc.
    if (type === TileType.MINER) {
      value = phase === 'early' ? 40 : 25;
    } else if (type === TileType.STEEL_SMELTER) {
      value = 50 * level;
    } else if (type === TileType.FABRICATOR) {
      value = 55 * level;
    } else if (type === TileType.QUANTUM_FACTORY) {
      value = 80 * level;
    } else if (type === TileType.RECYCLER) {
      value = 35 * level;
    } else if (type === TileType.FOUNDRY) {
      value = 45 * level;
    } else {
      value = 30 * level;
    }
  } else if (cfg.category === 'support') {
    // Support: shields, repair, slow, etc.
    if (type === TileType.SHIELD_GENERATOR) value = 50 * level;
    else if (type === TileType.REPAIR_BAY) value = 40 * level;
    else if (type === TileType.SLOW_FIELD) value = 35 * level;
    else if (type === TileType.RADAR_STATION) value = 30 * level;
    else if (type === TileType.COMMAND_CENTER) value = 60 * level;
    else if (type === TileType.NANITE_DOME) value = 55 * level;
    else if (type === TileType.DATA_VAULT) value = 45 * level;
    else value = 25 * level;
  }

  // Module bonus: buildings with modules are more valuable
  if (engine.grid.modules[y][x] !== ModuleType.NONE) {
    value *= 1.5;
  }

  // Wall value depends on position (closer to core = more important)
  if (type === TileType.WALL || type === TileType.MINEFIELD) {
    const cx = engine.grid.coreX;
    const cy = engine.grid.coreY;
    const dist = Math.abs(x - cx) + Math.abs(y - cy);
    value = dist <= 3 ? 60 : dist <= 6 ? 40 : 20;
    value *= level;
  }

  // Tile stats bonus: buildings that are actually doing damage/income are more valuable
  const tileKey = `${x},${y}`;
  const ts = engine.tileStats.get(tileKey);
  if (ts) {
    value += (ts.totalDamage || 0) * 0.01;
    value += (ts.totalKills || 0) * 2;
  }

  return value;
}

/** AI: remove and replace low-value buildings when the board is full
 *  or when a much better building could take its place. */
function aiTryRemove(engine: GameEngine) {
  const phase = getPhase(engine);
  if (phase === 'early') return; // don't sell in early game

  const size = engine.grid.size;

  // Count empty tiles
  let emptyCount = 0;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      if (engine.grid.tiles[y][x] === TileType.EMPTY) emptyCount++;

  // Only consider removal when board is getting crowded (few empty tiles)
  // or in late game for optimization
  if (emptyCount > 30 && phase !== 'late') return;
  if (emptyCount > 15 && phase === 'late') return;

  // Find the lowest-value building
  let worstBuilding: { x: number; y: number; value: number; type: number } | null = null;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const type = engine.grid.tiles[y][x];
      if (type === TileType.EMPTY || type === TileType.ORE_PATCH || type === TileType.CORE) continue;

      // Never remove critical buildings
      const cfg = BUILDING_REGISTRY[type];
      if (!cfg) continue;

      const value = rateBuildingValue(engine, x, y);

      if (!worstBuilding || value < worstBuilding.value) {
        worstBuilding = { x, y, value, type };
      }
    }
  }

  if (!worstBuilding) return;

  // Check if the best available build order has much higher priority
  const orders = getAIBuildOrders(engine, phase);
  if (orders.length === 0) return;

  const bestOrder = orders[0]; // highest priority
  const bestCfg = BUILDING_REGISTRY[bestOrder.type];
  if (!bestCfg) return;

  // Check if we can already build the best order (has a placement spot)
  // If we can, no need to remove
  const spot = findPlacement(engine, bestOrder.type);
  if (spot) return; // There's room, no need to remove

  // Only remove if the best order priority is significantly higher than worst building value
  // (prevents thrashing)
  const improvementThreshold = phase === 'late' ? 10 : 25;
  if (bestOrder.priority * 10 - worstBuilding.value < improvementThreshold) return;

  // Remove the worst building
  const type = worstBuilding.type;
  const level = engine.grid.levels[worstBuilding.y][worstBuilding.x];
  const refund = engine.getRefund(type, level);
  const removed = engine.grid.removeBuilding(worstBuilding.x, worstBuilding.y);
  if (removed > 0) {
    engine.resources.add(refund);
    engine.fireRemoveHook(worstBuilding.x, worstBuilding.y, type, removed, refund);
    if (engine.purchasedCounts[type] > 0) engine.purchasedCounts[type]--;
    engine.cleanupTile(worstBuilding.x, worstBuilding.y);
    replayLog.push({
      tick: currentTick,
      action: 'remove',
      x: worstBuilding.x,
      y: worstBuilding.y,
      type,
    });
  }
}

// ── Game Stats Collection ────────────────────────────────────

interface GameResult {
  seed: string;
  mode: string;
  difficulty: string;
  gameTime: number;
  wavesReached: number;
  enemiesKilled: number;
  buildingsPlaced: number;
  finalResources: { energy: number; scrap: number; steel: number; electronics: number; data: number };
  netIncome: { energy: number; scrap: number; steel: number; electronics: number; data: number };
  buildingCounts: Record<string, number>;
  totalDamage: number;
  coreHP: number;
  maxCoreHP: number;
  killPoints: number;
  unlockedCount: number;
  replay?: ReplayData;
}

// ── Headless Game Runner ─────────────────────────────────────

function runGame(gameIndex: number): GameResult {
  const canvas = new MockCanvas() as any;
  const engine = new GameEngine(canvas);
  engine.setDifficulty(DIFFICULTY);
  engine.setGameMode(GAME_MODE);

  // Place core at center
  const cx = Math.floor(GRID_SIZE / 2);
  const cy = Math.floor(GRID_SIZE / 2);
  engine.placeCore(cx, cy);

  // Init replay log
  replayLog = [];
  currentTick = 0;
  const gameId = `${engine.seed}-${Date.now().toString(36)}`;

  // Set initial build time for wave mode
  if (GAME_MODE === 'wellen') {
    engine.waveBuildPhase = true;
  }

  // Simulation constants
  const MAX_TICKS = GAME_MODE === 'wellen' ? 1200 : 600; // 20min waves, 10min endless
  const AI_BUILD_INTERVAL = 2; // Try to build every 2 ticks
  const fakeTimestamp = { v: 1000 };

  // Unlock all buildings for the AI (fresh start with just starters)
  localStorage.clear();
  engine.unlockedBuildings = new Set([
    TileType.SOLAR_PANEL, TileType.MINER, TileType.WALL, TileType.TURRET,
  ]);

  // Main simulation loop
  for (let tick = 0; tick < MAX_TICKS && !engine.gameOver; tick++) {
    currentTick = tick;
    // AI decisions
    if (tick % AI_BUILD_INTERVAL === 0) {
      aiTryUnlockTech(engine);
      aiTryRemove(engine); // Remove low-value buildings before trying to build
      aiTryBuild(engine);
      aiTryResearch(engine);
      aiTryInstallModule(engine);
    }

    // Advance game by calling tick + combat directly
    // We simulate what update() does but without rendering
    engine.gameTime++;
    engine.tick();

    // Wave mode: handle build phase countdown
    if (engine.gameMode === 'wellen' && engine.waveBuildPhase) {
      engine.waveBuildTimer--;
      if (engine.waveBuildTimer <= 0) engine.startNextWave();
    }

    // Map events tick
    tickMapEvents(engine);

    // Combat: spawning + combat logic
    fakeTimestamp.v += 1000;
    const ts = fakeTimestamp.v;

    if (engine.gameMode === 'endlos') {
      if (engine.gameTime >= 15) {
        engine.spawnEnemy();
      }
    } else if (engine.gameMode === 'wellen' && engine.waveActive && engine.waveEnemiesSpawned < engine.waveEnemiesTotal) {
      // Spawn all enemies for wave quickly (simulate spawn delays)
      const toSpawn = Math.min(2, engine.waveEnemiesTotal - engine.waveEnemiesSpawned);
      for (let s = 0; s < toSpawn; s++) {
        engine.spawnWaveEnemy();
        engine.waveEnemiesSpawned++;
      }
    }

    // Run combat subsystems — in real game this runs at 60fps
    // We simulate ~60 frames per tick (1 tick = 1 second)
    for (let frame = 0; frame < 60; frame++) {
      detonateMines(engine);
      moveEnemies(engine, ts + frame * 16);
      turretLogic(engine);
      updateProjectiles(engine);
      updateDrones(engine);
    }

    // Abilities tick
    tickAbilities(engine.abilities);
  }

  // Collect results
  const buildingCounts: Record<string, number> = {};
  const size = engine.grid.size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const type = engine.grid.tiles[y][x];
      if (type === TileType.EMPTY || type === TileType.ORE_PATCH) continue;
      const cfg = BUILDING_REGISTRY[type];
      const name = cfg?.name || `Type${type}`;
      buildingCounts[name] = (buildingCounts[name] || 0) + 1;
    }
  }

  const coreX = engine.grid.coreX;
  const coreY = engine.grid.coreY;

  const replay: ReplayData = {
    id: gameId,
    seed: engine.seed,
    mode: GAME_MODE,
    difficulty: DIFFICULTY,
    coreX: cx,
    coreY: cy,
    actions: replayLog,
    result: {
      wavesReached: engine.currentWave,
      enemiesKilled: engine.enemiesKilled,
      gameTime: engine.gameTime,
      gameOver: engine.gameOver,
    },
  };

  return {
    seed: engine.seed,
    mode: GAME_MODE,
    difficulty: DIFFICULTY,
    gameTime: engine.gameTime,
    wavesReached: engine.currentWave,
    enemiesKilled: engine.enemiesKilled,
    buildingsPlaced: engine.buildingsPlaced,
    finalResources: { ...engine.resources.state },
    netIncome: { ...engine.netIncome },
    buildingCounts,
    totalDamage: engine.globalStats.totalDamage,
    coreHP: coreX >= 0 ? engine.grid.healths[coreY][coreX] : 0,
    maxCoreHP: Math.round(engine.getMaxHP(TileType.CORE, 1)),
    killPoints: engine.killPoints,
    unlockedCount: engine.unlockedBuildings.size,
    replay,
  };
}

// ── Main ─────────────────────────────────────────────────────

console.log('╔══════════════════════════════════════════════════╗');
console.log('║        GRIDCORE — AI Simulation Agent           ║');
console.log('╚══════════════════════════════════════════════════╝');
console.log(`Mode: ${GAME_MODE} | Difficulty: ${DIFFICULTY} | Games: ${NUM_GAMES}`);
console.log('');

const results: GameResult[] = [];

for (let i = 0; i < NUM_GAMES; i++) {
  // Clear localStorage between games (fresh prestige/unlocks)
  localStorage.clear();

  const result = runGame(i);
  results.push(result);

  if (VERBOSE) {
    console.log(`Game ${i + 1}: Wave ${result.wavesReached} | Kills: ${result.enemiesKilled} | Time: ${result.gameTime}s | Buildings: ${result.buildingsPlaced} | Core: ${Math.round(result.coreHP)}/${result.maxCoreHP}`);
  } else {
    process.stdout.write(`\rRunning... ${i + 1}/${NUM_GAMES}`);
  }
}

if (!VERBOSE) console.log('');

// Save replays if requested
if (SAVE_REPLAYS) {
  const replayDir = path.join(process.cwd(), 'sim', 'replays');
  if (!fs.existsSync(replayDir)) fs.mkdirSync(replayDir, { recursive: true });
  for (const r of results) {
    if (!r.replay) continue;
    const filePath = path.join(replayDir, `${r.replay.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(r.replay, null, 2));
  }
  console.log(`Replays gespeichert in sim/replays/ (${results.length} Dateien)`);
}
console.log('');

// ── Aggregate Stats ──────────────────────────────────────────

const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
const min = (arr: number[]) => Math.min(...arr);
const max = (arr: number[]) => Math.max(...arr);
const median = (arr: number[]) => {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const waves = results.map(r => r.wavesReached);
const kills = results.map(r => r.enemiesKilled);
const times = results.map(r => r.gameTime);
const buildings = results.map(r => r.buildingsPlaced);
const gameOvers = results.filter(r => r.coreHP <= 0).length;

console.log('═══════════════════════════════════════════════════');
console.log('                 SIMULATION RESULTS                ');
console.log('═══════════════════════════════════════════════════');
console.log('');

if (GAME_MODE === 'wellen') {
  console.log(`Wellen erreicht:  Avg: ${avg(waves).toFixed(1)} | Med: ${median(waves)} | Min: ${min(waves)} | Max: ${max(waves)}`);
}
console.log(`Spielzeit (s):    Avg: ${avg(times).toFixed(0)} | Med: ${median(times)} | Min: ${min(times)} | Max: ${max(times)}`);
console.log(`Kills:            Avg: ${avg(kills).toFixed(0)} | Med: ${median(kills)} | Min: ${min(kills)} | Max: ${max(kills)}`);
console.log(`Gebäude platziert: Avg: ${avg(buildings).toFixed(0)} | Med: ${median(buildings)} | Min: ${min(buildings)} | Max: ${max(buildings)}`);
console.log(`Game Over Rate:   ${gameOvers}/${NUM_GAMES} (${((gameOvers / NUM_GAMES) * 100).toFixed(0)}%)`);
console.log('');

// Average final resources
console.log('── Durchschnittliche End-Ressourcen ──');
const resKeys = ['energy', 'scrap', 'steel', 'electronics', 'data'] as const;
for (const key of resKeys) {
  const vals = results.map(r => r.finalResources[key]);
  console.log(`  ${key.padEnd(14)} ${Math.round(avg(vals)).toString().padStart(8)}`);
}
console.log('');

// Average net income
console.log('── Durchschnittliches Netto-Einkommen/s ──');
for (const key of resKeys) {
  const vals = results.map(r => r.netIncome[key]);
  const a = avg(vals);
  console.log(`  ${key.padEnd(14)} ${(a >= 0 ? '+' : '') + a.toFixed(1).padStart(7)}`);
}
console.log('');

// Building distribution
console.log('── Gebäude-Verteilung (Durchschnitt) ──');
const allBuildingNames = new Set<string>();
results.forEach(r => Object.keys(r.buildingCounts).forEach(n => allBuildingNames.add(n)));
const buildingAvgs: { name: string; avg: number }[] = [];
for (const name of allBuildingNames) {
  const vals = results.map(r => r.buildingCounts[name] || 0);
  buildingAvgs.push({ name, avg: avg(vals) });
}
buildingAvgs.sort((a, b) => b.avg - a.avg);
for (const { name, avg: v } of buildingAvgs) {
  console.log(`  ${name.padEnd(22)} ${v.toFixed(1).padStart(5)}`);
}
console.log('');

// Tech unlock stats
console.log('── Tech Unlocks ──');
const kpVals = results.map(r => r.killPoints);
const unlockVals = results.map(r => r.unlockedCount);
console.log(`  Kill-Punkte:    Avg: ${avg(kpVals).toFixed(0)} | Med: ${median(kpVals)}`);
console.log(`  Unlocked:       Avg: ${avg(unlockVals).toFixed(1)} / ${TECH_TREE.length + 4} (inkl. Starter)`);
console.log('');

// Best & worst game
const bestGame = results.reduce((best, r) => (GAME_MODE === 'wellen' ? r.wavesReached > best.wavesReached : r.gameTime > best.gameTime) ? r : best);
const worstGame = results.reduce((worst, r) => (GAME_MODE === 'wellen' ? r.wavesReached < worst.wavesReached : r.gameTime < worst.gameTime) ? r : worst);

console.log('── Bestes Spiel ──');
console.log(`  Seed: ${bestGame.seed} | Welle: ${bestGame.wavesReached} | Kills: ${bestGame.enemiesKilled} | Zeit: ${bestGame.gameTime}s`);
console.log(`  Layout: ${JSON.stringify(bestGame.buildingCounts)}`);
console.log('');
console.log('── Schlechtestes Spiel ──');
console.log(`  Seed: ${worstGame.seed} | Welle: ${worstGame.wavesReached} | Kills: ${worstGame.enemiesKilled} | Zeit: ${worstGame.gameTime}s`);
console.log(`  Layout: ${JSON.stringify(worstGame.buildingCounts)}`);
console.log('');

// Damage stats
const dmgVals = results.map(r => r.totalDamage);
console.log('── Schadensstatistik ──');
console.log(`  Gesamtschaden:  Avg: ${Math.round(avg(dmgVals))} | Max: ${Math.round(max(dmgVals))}`);
console.log('');
console.log('Simulation abgeschlossen.');
