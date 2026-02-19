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
  leicht: { label: 'Leicht', baseHp: 100, hpPerSec: 3, baseSpeed: 0.015, speedPerSec: 0.00006, spawnBase: 2500, spawnReduction: 10, spawnMin: 600, enemyDamage: 60 },
  mittel: { label: 'Mittel', baseHp: 150, hpPerSec: 5, baseSpeed: 0.02, speedPerSec: 0.0001, spawnBase: 2000, spawnReduction: 12, spawnMin: 400, enemyDamage: 100 },
  schwer: { label: 'Schwer', baseHp: 200, hpPerSec: 8, baseSpeed: 0.025, speedPerSec: 0.00015, spawnBase: 1500, spawnReduction: 15, spawnMin: 250, enemyDamage: 150 },
};

export interface Enemy {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  lastHit: number;
  slowedUntil?: number; // timestamp until which enemy is slowed
}

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
