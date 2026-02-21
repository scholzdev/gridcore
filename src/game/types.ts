export type Difficulty = 'leicht' | 'mittel' | 'schwer';
export type GameMode = 'endlos' | 'wellen';

export interface DifficultyConfig {
  label: string;
  baseHp: number;
  hpPerSec: number;
  baseSpeed: number;
  speedPerSec: number;
  spawnBase: number;
  spawnReduction: number;
  spawnMin: number;
  enemyDamage: number;
}

export const DIFFICULTY_PRESETS: Record<Difficulty, DifficultyConfig> = {
  leicht: { label: 'Leicht', baseHp: 120, hpPerSec: 4, baseSpeed: 0.018, speedPerSec: 0.00008, spawnBase: 4000, spawnReduction: 15, spawnMin: 500, enemyDamage: 80 },
  mittel: { label: 'Mittel', baseHp: 180, hpPerSec: 6, baseSpeed: 0.022, speedPerSec: 0.00012, spawnBase: 3000, spawnReduction: 18, spawnMin: 350, enemyDamage: 120 },
  schwer: { label: 'Schwer', baseHp: 250, hpPerSec: 10, baseSpeed: 0.028, speedPerSec: 0.00018, spawnBase: 2000, spawnReduction: 20, spawnMin: 200, enemyDamage: 180 },
};

// ── Enemy Types ──────────────────────────────────────────────
export type EnemyType = 'normal' | 'fast' | 'tank' | 'shielded' | 'swarm' | 'boss';

export interface EnemyTypeDef {
  type: EnemyType;
  name: string;
  color: string;
  hpMult: number;
  speedMult: number;
  sizeMult: number;
  damageMult: number;
  /** Number of sides for shape (0 = circle, 3 = triangle, 4 = diamond, 6 = hexagon) */
  shape: number;
  /** Kill reward multiplier */
  rewardMult: number;
  /** Shield HP (fraction of maxHP, 0 = none) */
  shieldFraction: number;
}

export const ENEMY_TYPES: Record<EnemyType, EnemyTypeDef> = {
  normal:   { type: 'normal',   name: 'Normal',    color: '#2d3436', hpMult: 1,    speedMult: 1,    sizeMult: 1,   damageMult: 1,   shape: 0, rewardMult: 1,   shieldFraction: 0 },
  fast:     { type: 'fast',     name: 'Sprinter',  color: '#00b894', hpMult: 0.5,  speedMult: 2.0,  sizeMult: 0.7, damageMult: 0.6, shape: 3, rewardMult: 1.2, shieldFraction: 0 },
  tank:     { type: 'tank',     name: 'Panzer',    color: '#6c5ce7', hpMult: 3.0,  speedMult: 0.5,  sizeMult: 1.5, damageMult: 2.0, shape: 4, rewardMult: 2,   shieldFraction: 0 },
  shielded: { type: 'shielded', name: 'Schild',    color: '#0984e3', hpMult: 1.5,  speedMult: 0.8,  sizeMult: 1.2, damageMult: 1.2, shape: 6, rewardMult: 1.5, shieldFraction: 0.5 },
  swarm:    { type: 'swarm',    name: 'Schwarm',   color: '#fdcb6e', hpMult: 0.3,  speedMult: 1.5,  sizeMult: 0.5, damageMult: 0.3, shape: 0, rewardMult: 0.5, shieldFraction: 0 },
  boss:     { type: 'boss',     name: 'Boss',      color: '#d63031', hpMult: 15.0, speedMult: 0.35, sizeMult: 2.5, damageMult: 5.0, shape: 6, rewardMult: 10,  shieldFraction: 0.3 },
};

/** Wave composition: which enemy types appear and at what weight */
export interface WaveComposition {
  type: EnemyType;
  weight: number;
}

/** Get enemy type mix for a given wave number */
export function getWaveComposition(wave: number): WaveComposition[] {
  const comp: WaveComposition[] = [{ type: 'normal', weight: 10 }];
  if (wave >= 3) comp.push({ type: 'fast', weight: 3 + Math.floor(wave / 3) });
  if (wave >= 5) comp.push({ type: 'tank', weight: 2 + Math.floor(wave / 5) });
  if (wave >= 7) comp.push({ type: 'shielded', weight: 1 + Math.floor(wave / 7) });
  if (wave >= 4) comp.push({ type: 'swarm', weight: 4 + Math.floor(wave / 2) });
  // Boss every 10th wave
  if (wave % 10 === 0 && wave > 0) comp.push({ type: 'boss', weight: 1 });
  return comp;
}

/** Pick a random enemy type from composition using provided rng */
export function pickEnemyType(composition: WaveComposition[], rng: () => number): EnemyType {
  const totalWeight = composition.reduce((sum, c) => sum + c.weight, 0);
  let roll = rng() * totalWeight;
  for (const c of composition) {
    roll -= c.weight;
    if (roll <= 0) return c.type;
  }
  return 'normal';
}

/** Get enemy type for endless mode based on game time */
export function getEndlessEnemyType(gameTime: number, rng: () => number): EnemyType {
  const minutes = gameTime / 60;
  const comp: WaveComposition[] = [{ type: 'normal', weight: 10 }];
  if (minutes >= 2) comp.push({ type: 'fast', weight: 3 + Math.floor(minutes) });
  if (minutes >= 4) comp.push({ type: 'tank', weight: 2 + Math.floor(minutes / 2) });
  if (minutes >= 6) comp.push({ type: 'shielded', weight: 1 + Math.floor(minutes / 3) });
  if (minutes >= 3) comp.push({ type: 'swarm', weight: 4 + Math.floor(minutes * 1.5) });
  return pickEnemyType(comp, rng);
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  lastHit: number;
  slowedUntil?: number;
  slowFactor?: number;
  dead?: boolean;
  /** Enemy type — determines visuals, stats, behavior */
  enemyType: EnemyType;
  /** Shield HP for shielded enemies */
  enemyShield?: number;
  /** Max shield */
  enemyShieldMax?: number;
  /** Pathfinding target — next waypoint */
  pathTarget?: { x: number; y: number };
  /** Cached path (list of grid cells) */
  path?: { x: number; y: number }[];
  /** Index into path array */
  pathIndex?: number;
  /** Grid pathGeneration when path was assigned — used for live repathing */
  pathGeneration?: number;
}

// ── Wave Mode Constants ──────────────────────────────────────
export const WAVE_CONFIG = {
  /** Base enemy count for wave 1 */
  enemiesBase: 8,
  /** Exponential growth factor per wave */
  enemiesGrowth: 1.11,
  /** Base delay between spawns (ms) */
  spawnDelayBase: 1200,
  /** Delay reduction per wave (ms) */
  spawnDelayPerWave: 50,
  /** Minimum spawn delay (ms) */
  spawnDelayMin: 300,
  /** HP scaling multiplier per wave (exponential base) */
  hpScalingPerWave: 0.35,
  /** Speed scaling multiplier per wave (exponential base) */
  speedScalingPerWave: 0.06,
  /** Initial build phase duration (ticks) */
  initialBuildTime: 30,
  /** Between-waves build phase duration (ticks) */
  betweenWavesBuildTime: 15,
};

// ── Kill Reward Formula ──────────────────────────────────────
export const KILL_REWARD = {
  /** Base scrap reward per kill */
  base: 15,
  /** Additional scrap per second of game time */
  perSecond: 0.1,
};

export interface Projectile {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  color: string;
  damage: number;
  targetId: string;
  splash?: number;
  sourceX?: number;
  sourceY?: number;
  modType?: number; // module on the turret that fired this
}

export interface DamageNumber {
  x: number;
  y: number;
  amount: number;
  life: number;
  color: string;
}

export interface TileStats {
  totalDamage: number;
  kills: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  /** Particle radius in pixels (default 2) */
  size?: number;
  /** Gravity applied to vy each frame */
  gravity?: number;
}

export interface Drone {
  id: string;
  x: number;
  y: number;
  hangarX: number;
  hangarY: number;
}

export interface LaserBeam {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  width: number;
}

export interface LaserFocus {
  targetId: string;
  ticks: number;
}
