// ── Hook System Types ────────────────────────────────────────
// Defines all lifecycle hooks that building configs can implement.
// Hooks receive typed event objects — no direct Engine import needed.

import type { Enemy, Projectile, Particle } from '../game/types';
import type { ResourceCost } from './types';

// ── Building Instance Snapshot ───────────────────────────────

/** A snapshot of a placed building on the grid */
export interface BuildingRef {
  x: number;
  y: number;
  type: number;       // TileType
  level: number;
  module: number;     // ModuleType
  health: number;
  maxHealth: number;
  shield: number;
  active: boolean;    // powered / consuming ok this tick
}

// ── Game Context ─────────────────────────────────────────────
// Lean interface satisfied by GameEngine via structural typing.
// Avoids circular imports (config/ → game/).

export interface GameCtx {
  // ── State ────────────────────────
  gameTime: number;
  dataVaultBuff: number;
  prestigeDamageMult: number;
  prestigeIncomeMult: number;
  difficulty: string;
  gameMode: string;
  enemiesKilled: number;
  killPoints: number;

  // ── Grid ─────────────────────────
  grid: {
    size: number;
    tiles: number[][];
    healths: number[][];
    shields: number[][];
    modules: number[][];
    levels: number[][];
    coreX: number;
    coreY: number;
  };
  activeTiles: boolean[][];

  // ── Resources ────────────────────
  resources: {
    state: { energy: number; scrap: number; steel: number; electronics: number; data: number };
    add(r: Partial<ResourceCost>): void;
    spend(r: Partial<ResourceCost>): void;
    canAfford(r: Partial<ResourceCost>): boolean;
  };

  // ── Entities ─────────────────────
  enemies: Enemy[];
  projectiles: Projectile[];
  laserBeams: { fromX: number; fromY: number; toX: number; toY: number; color: string; width: number }[];

  // ── Actions ──────────────────────
  addDamageNumber(x: number, y: number, amount: number, color?: string): void;
  addTileDamage(x: number, y: number, damage: number): void;
  addTileKill(x: number, y: number): void;
  addParticle(p: Particle): void;

  // ── Research buffs ───────────────
  researchBuffs: {
    incomeMult: number;
    costMult: number;
    energyConsumeMult: number;
    repairMult: number;
    shieldMult: number;
    dataOutputMult: number;
    hpMult: number;
    fireRateMult: number;
    rangeBuff: number;
    moduleEffectMult: number;
  };
}

// ── Hook Event Types ─────────────────────────────────────────

/** Economy tick — production, consumption, aura effects.
 *  Mutable: modify consumes to change resource consumption. */
export interface TickEvent {
  building: BuildingRef;
  game: GameCtx;
  tick: number;
  /** Pre-computed: 1 + (level-1) * 0.5 */
  levelMult: number;
  /** Mutable: consumption multiplier — hooks can reduce/increase consumption (starts at 1) */
  consumeMult: number;
  /** Mutable: heal amount per tick (for regen-type effects, starts at 0) */
  healAmount: number;
}

/** Combat frame tick — turret firing, target selection.
 *  Mutable: modify damage/fireChance/effectiveRange. */
export interface CombatTickEvent {
  building: BuildingRef;
  game: GameCtx;
  tick: number;
  levelMult: number;
  /** Enemies within effective range */
  enemiesInRange: Enemy[];
  /** Mutable: effective range (base + radar + module) */
  effectiveRange: number;
  /** Mutable: computed damage */
  damage: number;
  /** Mutable: fire chance (lower = fires more often) */
  fireChance: number;
}

/** A resource was produced this tick — mutable: modify income to change final output */
export interface ResourceGainedEvent {
  building: BuildingRef;
  game: GameCtx;
  /** Mutable income object — hooks can modify values before they're applied */
  income: { energy: number; scrap: number; steel: number; electronics: number; data: number };
  /** Mutable multiplier — applied to all income after hooks run (starts at 1) */
  incomeMult: number;
}

/** Building was just placed on the grid */
export interface PlaceEvent {
  building: BuildingRef;
  game: GameCtx;
}

/** Building was removed / sold */
export interface RemoveEvent {
  building: BuildingRef;
  game: GameCtx;
  /** Refund given back */
  refund: Partial<ResourceCost>;
}

/** Building was upgraded */
export interface UpgradeEvent {
  building: BuildingRef;
  game: GameCtx;
  previousLevel: number;
  newLevel: number;
}

/** Building HP dropped to 0 */
export interface DestroyedEvent {
  building: BuildingRef;
  game: GameCtx;
  /** Enemy that dealt the killing blow, if any */
  enemy?: Enemy;
}

/** A projectile hit an enemy (per-turret) — mutable: modify damage */
export interface HitEvent {
  building: BuildingRef;
  game: GameCtx;
  enemy: Enemy;
  /** Mutable: damage dealt */
  damage: number;
  isSplash: boolean;
  /** Module on the turret that fired */
  module: number;
}

/** An enemy was killed by this building */
export interface KillEvent {
  building: BuildingRef;
  game: GameCtx;
  enemy: Enemy;
}

/** Enemy entered this building's kill range (mines, traps) */
export interface EnterRangeEvent {
  building: BuildingRef;
  game: GameCtx;
  enemy: Enemy;
  distance: number;
  range: number;
}

/** Aura/support effect tick (repair, shield, slow, radar, vault)
 *  Mutable: modify range to change effective aura range. */
export interface AuraTickEvent {
  building: BuildingRef;
  game: GameCtx;
  tick: number;
  levelMult: number;
  /** Mutable: effective aura range — hooks can modify */
  range: number;
}

/** A nearby allied building took damage */
export interface AllyDamagedEvent {
  building: BuildingRef;
  game: GameCtx;
  ally: BuildingRef;
  damage: number;
  enemy?: Enemy;
}

/** Wave started or ended */
export interface WaveEvent {
  game: GameCtx;
  wave: number;
  enemyCount: number;
  /** Only on waveEnd */
  enemiesKilled?: number;
  /** Per-building reference (each building gets this event) */
  building?: BuildingRef;
}

/** Game just started */
export interface GameStartEvent {
  game: GameCtx;
  difficulty: string;
  mode: string;
}

/** Prestige reset triggered */
export interface PrestigeEvent {
  game: GameCtx;
  pointsEarned: number;
  totalPoints: number;
}

/** Tech tree node unlocked */
export interface UnlockTechEvent {
  game: GameCtx;
  techId: string;
  techName: string;
  /** TileType that was unlocked */
  unlockedBuilding: number;
}

// ── Building Hooks Interface ─────────────────────────────────

export interface BuildingHooks {
  /** Economy tick: production, consumption */
  onTick?: (event: TickEvent) => void;
  /** Combat frame: turret firing */
  onCombatTick?: (event: CombatTickEvent) => void;
  /** Resource was produced */
  onResourceGained?: (event: ResourceGainedEvent) => void;
  /** Building placed on grid */
  onPlace?: (event: PlaceEvent) => void;
  /** Building removed / sold */
  onRemove?: (event: RemoveEvent) => void;
  /** Building upgraded */
  onUpgrade?: (event: UpgradeEvent) => void;
  /** Building destroyed (HP=0) */
  onDestroyed?: (event: DestroyedEvent) => void;
  /** Projectile hit an enemy */
  onHit?: (event: HitEvent) => void;
  /** Enemy killed by this building */
  onKill?: (event: KillEvent) => void;
  /** Enemy entered kill range */
  onEnterKillRange?: (event: EnterRangeEvent) => void;
  /** Aura/support tick */
  onAuraTick?: (event: AuraTickEvent) => void;
  /** Nearby ally took damage */
  onAllyDamaged?: (event: AllyDamagedEvent) => void;
  /** Wave started */
  onWaveStart?: (event: WaveEvent) => void;
  /** Wave ended */
  onWaveEnd?: (event: WaveEvent) => void;
  /** Game started */
  onGameStart?: (event: GameStartEvent) => void;
  /** Prestige triggered */
  onPrestige?: (event: PrestigeEvent) => void;
  /** Tech node unlocked */
  onUnlockTech?: (event: UnlockTechEvent) => void;
}
