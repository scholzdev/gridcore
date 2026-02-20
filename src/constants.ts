// ══════════════════════════════════════════════════════════════
// GRIDCORE — Zentrale Konstanten
// ══════════════════════════════════════════════════════════════

// ── Grid ─────────────────────────────────────────────────────
export const GRID_SIZE = 30;
export const ORE_PATCH_COUNT = 40;
export const CORE_PLACEMENT_MARGIN = 2;
export const SEED_LENGTH = 6;

// ── Gebäude ──────────────────────────────────────────────────
export const MAX_BUILDING_LEVEL = 10;
export const LEVEL_SCALING = 0.25;
export const DEFAULT_ZOOM = 40;

// ── Wirtschaft ───────────────────────────────────────────────
export const TICK_RATE_MS = 1000;
export const STARTING_SCRAP = 500;
export const STARTING_ENERGY = 100;
export const REFUND_PERCENTAGE = 0.4;
export const COST_SCALING_BASE = 1.15;          // pro zusätzlichem Gebäude
export const UPGRADE_COST_BASE_MULT = 1.5;
export const UPGRADE_COST_SCALING_BASE = 2.5;   // pro Level
export const MAINTENANCE_COST_PER_LEVEL = 0.5;

// ── Solar Diminishing Returns ────────────────────────────────
export const SOLAR_DIMINISHING_THRESHOLD = 15;
export const SOLAR_DIMINISHING_PENALTY = 0.05;  // pro Panel über Threshold
export const SOLAR_MIN_EFFICIENCY = 0.3;

// ── Markt ────────────────────────────────────────────────────
export const MARKET_SELL_PRESSURE = 0.002;
export const MARKET_BUY_PRESSURE = 0.003;
export const MARKET_PRICE_MIN = 0.3;
export const MARKET_PRICE_MAX = 3.0;
export const MARKET_PRICE_RECOVERY_RATE = 0.005;
export const TRADE_AMOUNTS = [10, 50, 100] as const;

// ── Prestige ─────────────────────────────────────────────────
export const PRESTIGE_DAMAGE_PER_LEVEL = 0.1;
export const PRESTIGE_INCOME_PER_LEVEL = 0.1;
export const PRESTIGE_COST_REDUCTION_PER_LEVEL = 0.05;
export const PRESTIGE_HP_PER_LEVEL = 0.1;
export const PRESTIGE_RESEARCH_PER_LEVEL = 0.1;
export const PRESTIGE_ABILITY_CD_PER_LEVEL = 0.1;
export const PRESTIGE_MIN_MULT = 0.5;
export const PRESTIGE_START_RESOURCE_PER_LEVEL = 20;

// ── Kampf ────────────────────────────────────────────────────
export const ENEMY_MAX_SPEED = 0.12;
export const PROJECTILE_HIT_THRESHOLD = 0.3;
export const PATHFINDING_WAYPOINT_THRESHOLD = 0.4;

// ── Module ───────────────────────────────────────────────────
export const THORNS_REFLECT_FRACTION = 0.15;
export const WALL_SLOW_DURATION_MS = 4000;
export const WALL_SLOW_FACTOR = 0.7;
export const ABSORBER_RANGE = 3;
export const ABSORBER_DAMAGE_MULT = 0.75;

// ── Abilities ────────────────────────────────────────────────
export const EMP_STUN_DURATION_MS = 5000;
export const EMERGENCY_REPAIR_HEAL_FRACTION = 0.5;

// ── Visuals ──────────────────────────────────────────────────
export const DAMAGE_NUMBER_LIFETIME = 30;
export const DAMAGE_NUMBER_DRIFT_SPEED = 0.02;
export const EVENT_NOTIFICATION_LIFETIME = 120;
export const MAX_GAME_SPEED = 3;

// ── Canvas ───────────────────────────────────────────────────
export const CANVAS_MIN_SIZE = 300;
export const SIDEBAR_WIDTH_OFFSET = 400;
export const TOPBAR_HEIGHT_OFFSET = 150;

// ── Spawning ─────────────────────────────────────────────────
export const SPAWN_RNG_OFFSET = 7919;
export const ENDLESS_HP_SCALING_FACTOR = 0.08;
export const ENDLESS_SPEED_SCALING_FACTOR = 2;
