// ── Tile Types ───────────────────────────────────────────────
export enum TileType {
  EMPTY = 0,
  WALL = 1,
  CORE = 2,
  SOLAR_PANEL = 3,
  MINER = 4,
  TURRET = 5,
  ORE_PATCH = 6,
  FOUNDRY = 7,
  FABRICATOR = 8,
  LAB = 9,
  HEAVY_TURRET = 10,
  REPAIR_BAY = 11,
  SLOW_FIELD = 12,
  TESLA_COIL = 13,
  SHIELD_GENERATOR = 14,
  RADAR_STATION = 15,
  DATA_VAULT = 16,
  PLASMA_CANNON = 17,
  RECYCLER = 18,
  LASER_TURRET = 19,
  MINEFIELD = 20,
  DRONE_HANGAR = 21,
  CRYSTAL_DRILL = 22,
  STEEL_SMELTER = 23,
  ENERGY_RELAY = 24,
  FUSION_REACTOR = 25,
  ARTILLERY = 26,
  COMMAND_CENTER = 27,
  ION_CANNON = 28,
  QUANTUM_FACTORY = 29,
  SHOCKWAVE_TOWER = 30,
  NANITE_DOME = 31,
  ANNIHILATOR = 32,
  HYPER_REACTOR = 33,
  GRAVITY_CANNON = 34,
  OVERDRIVE_TURRET = 35,
}

// ── Module Types ─────────────────────────────────────────────
export enum ModuleType {
  NONE = 0,
  ATTACK_SPEED = 1,
  RANGE_BOOST = 2,
  DAMAGE_AMP = 3,
  EFFICIENCY = 4,
  OVERCHARGE = 5,
  CHAIN = 6,
  PIERCING = 7,
  REGEN = 8,
  SLOW_HIT = 9,
  DOUBLE_YIELD = 10,
  CRITICAL_HIT = 11,
  THORNS = 12,
  WALL_SLOW = 13,
  ABSORBER = 14,
}

// ── Resource Cost ────────────────────────────────────────────
export interface ResourceCost {
  energy?: number;
  scrap?: number;
  steel?: number;
  electronics?: number;
  data?: number;
}

// ── Building Category ────────────────────────────────────────
export type BuildingCategory =
  | 'infrastructure'
  | 'defense'
  | 'support'
  | 'processing'
  | 'research'
  | 'core';

// ── Building Config ──────────────────────────────────────────
import type { BuildingHooks } from './hooks';

export interface BuildingConfig {
  id: TileType;
  name: string;
  description: string;
  color: string;
  category: BuildingCategory;

  /** Available from game start without tech-tree unlock */
  starter?: boolean;
  /** Must be placed on an ore patch */
  requiresOre?: boolean;

  // ── Base Stats ───────────────────────────────────────────
  health: number;
  range?: number;
  damage?: number;
  cost?: ResourceCost;
  costIncrease?: ResourceCost;
  income?: ResourceCost;
  consumes?: ResourceCost;

  /** HP multiplier per level above 1 (default 0.5 → +50%/lvl) */
  levelScaling?: number;

  // ── Combat (turrets only) ────────────────────────────────
  combat?: {
    fireChance?: number;
    projectileSpeed?: number;
    projectileColor?: string;
    /** Tesla: base targets (before +level) */
    maxTargetsBase?: number;
    maxTargetsPerLevel?: number;
    /** Plasma: splash radius */
    splash?: number;
    /** Plasma: added to fireChance (makes it fire slower) */
    fireChanceModifier?: number;
    /** Laser: beam color */
    beamColor?: string;
    /** Laser: max focus damage multiplier */
    focusMultMax?: number;
    /** Laser: focus multiplier increase per tick */
    focusMultRate?: number;
    /** Minefield: blast radius */
    blastRadius?: number;
    /** Drone: movement speed */
    droneSpeed?: number;
    /** Drone: attack engagement range */
    droneAttackRange?: number;
    /** Drone: fire chance per tick */
    droneFireChance?: number;
    /** Drone: base drones before +level */
    maxDronesBase?: number;
    maxDronesPerLevel?: number;
    /** Shockwave: pulse radius */
    pulseRadius?: number;
    /** Shockwave: ticks between pulses */
    pulseInterval?: number;
    /** Annihilator: line-beam width (fires a beam hitting all enemies in a line) */
    lineBeam?: boolean;
    /** Annihilator: ticks between line-beam shots */
    lineBeamInterval?: number;
  };

  // ── Support (non-combat active buildings) ────────────────
  support?: {
    /** Repair Bay: HP healed per tick */
    healPerTick?: number;
    /** Shield Generator: max shield per building */
    shieldCap?: number;
    /** Data Vault: +damage % per level-mult */
    damageBuff?: number;
    /** Slow Field: base slow percentage */
    slowPct?: number;
    /** Slow Field: slow % increase per level */
    slowPctPerLevel?: number;
    /** Radar: base range buff granted */
    radarRangeBuffBase?: number;
    /** Radar: range buff increase per level */
    radarRangeBuffPerLevel?: number;
    /** Energy Relay: base fire rate buff (subtracted from fireChance) */
    fireRateBuffBase?: number;
    /** Energy Relay: fire rate buff increase per level */
    fireRateBuffPerLevel?: number;
    /** Gravity Cannon: pull strength (tiles per tick enemies are pulled toward cannon) */
    gravityPull?: number;
    /** Gravity Cannon: slow percentage applied to enemies in range */
    gravitySlow?: number;
  };

  // ── Tech Tree ────────────────────────────────────────────
  techTree?: {
    id: string;
    killCost: number;
    tier: number;
    shortDescription: string;
  };

  /** Explosion radius when destroyed (damages nearby buildings) */
  explosionOnDestroy?: number;
  /** Explosion damage when destroyed */
  explosionDamage?: number;

  /** Maximum number of this building allowed on the map (e.g. 1 for Command Center) */
  maxCount?: number;

  /** Display order within category in the sidebar */
  order?: number;

  // ── Lifecycle Hooks ──────────────────────────────────────
  /** Optional lifecycle hooks — called by the game engine at specific events */
  hooks?: BuildingHooks;
}

// ── Module Config ────────────────────────────────────────────
export interface ModuleConfig {
  id: ModuleType;
  name: string;
  description: string;
  color: string;
  cost: ResourceCost;
  appliesTo: TileType[];
  requiresUnlock?: TileType;

  /** Lifecycle hooks — fired in the context of the building this module is installed on.
   *  Hooks are interceptors: they can mutate the event to change game behaviour. */
  hooks?: BuildingHooks;
}
