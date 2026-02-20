// ── Config Index ─────────────────────────────────────────────
// Single source of truth — all building & module data assembled here.
// Import from this file, not from individual configs.

export { TileType, ModuleType } from './types';
export type { BuildingConfig, ModuleConfig, ResourceCost, BuildingCategory } from './types';
export type { BuildingHooks, BuildingRef, GameCtx, TickEvent, CombatTickEvent,
  ResourceGainedEvent, PlaceEvent, RemoveEvent, UpgradeEvent, DestroyedEvent,
  HitEvent, KillEvent, EnterRangeEvent, AuraTickEvent, AllyDamagedEvent,
  WaveEvent, GameStartEvent, PrestigeEvent, UnlockTechEvent } from './hooks';

// ── Building Configs ─────────────────────────────────────────
import { CORE_CONFIG } from './buildings/core';
import { SOLAR_PANEL_CONFIG } from './buildings/solar_panel';
import { MINER_CONFIG } from './buildings/miner';
import { WALL_CONFIG } from './buildings/wall';
import { TURRET_CONFIG } from './buildings/turret';
import { HEAVY_TURRET_CONFIG } from './buildings/heavy_turret';
import { TESLA_COIL_CONFIG } from './buildings/tesla_coil';
import { PLASMA_CANNON_CONFIG } from './buildings/plasma_cannon';
import { LASER_TURRET_CONFIG } from './buildings/laser_turret';
import { MINEFIELD_CONFIG } from './buildings/minefield';
import { DRONE_HANGAR_CONFIG } from './buildings/drone_hangar';
import { SLOW_FIELD_CONFIG } from './buildings/slow_field';
import { SHIELD_GENERATOR_CONFIG } from './buildings/shield_generator';
import { RADAR_STATION_CONFIG } from './buildings/radar_station';
import { REPAIR_BAY_CONFIG } from './buildings/repair_bay';
import { FOUNDRY_CONFIG } from './buildings/foundry';
import { FABRICATOR_CONFIG } from './buildings/fabricator';
import { RECYCLER_CONFIG } from './buildings/recycler';
import { LAB_CONFIG } from './buildings/lab';
import { DATA_VAULT_CONFIG } from './buildings/data_vault';
import { CRYSTAL_DRILL_CONFIG } from './buildings/crystal_drill';
import { STEEL_SMELTER_CONFIG } from './buildings/steel_smelter';
import { ENERGY_RELAY_CONFIG } from './buildings/energy_relay';
import { FUSION_REACTOR_CONFIG } from './buildings/fusion_reactor';
import { ARTILLERY_CONFIG } from './buildings/artillery';
import { COMMAND_CENTER_CONFIG } from './buildings/command_center';
import { ION_CANNON_CONFIG } from './buildings/ion_cannon';
import { QUANTUM_FACTORY_CONFIG } from './buildings/quantum_factory';
import { SHOCKWAVE_TOWER_CONFIG } from './buildings/shockwave_tower';
import { NANITE_DOME_CONFIG } from './buildings/nanite_dome';
import { ANNIHILATOR_CONFIG } from './buildings/annihilator';
import { HYPER_REACTOR_CONFIG } from './buildings/hyper_reactor';
import { GRAVITY_CANNON_CONFIG } from './buildings/gravity_cannon';
import { OVERDRIVE_TURRET_CONFIG } from './buildings/overdrive_turret';

// ── Module Configs ───────────────────────────────────────────
import { ATTACK_SPEED_CONFIG } from './modules/attack_speed';
import { RANGE_BOOST_CONFIG } from './modules/range_boost';
import { DAMAGE_AMP_CONFIG } from './modules/damage_amp';
import { EFFICIENCY_CONFIG } from './modules/efficiency';
import { OVERCHARGE_CONFIG } from './modules/overcharge';
import { CHAIN_CONFIG } from './modules/chain';
import { PIERCING_CONFIG } from './modules/piercing';
import { REGEN_CONFIG } from './modules/regen';
import { SLOW_HIT_CONFIG } from './modules/slow_hit';
import { DOUBLE_YIELD_CONFIG } from './modules/double_yield';
import { CRITICAL_HIT_CONFIG } from './modules/critical_hit';
import { THORNS_CONFIG } from './modules/thorns';
import { WALL_SLOW_CONFIG } from './modules/wall_slow';
import { ABSORBER_CONFIG } from './modules/absorber';

import type { BuildingConfig, ModuleConfig } from './types';
import { TileType } from './types';

// ── All Buildings Array ──────────────────────────────────────
export const ALL_BUILDINGS: BuildingConfig[] = [
  CORE_CONFIG,
  SOLAR_PANEL_CONFIG,
  MINER_CONFIG,
  WALL_CONFIG,
  TURRET_CONFIG,
  HEAVY_TURRET_CONFIG,
  TESLA_COIL_CONFIG,
  PLASMA_CANNON_CONFIG,
  LASER_TURRET_CONFIG,
  MINEFIELD_CONFIG,
  DRONE_HANGAR_CONFIG,
  SLOW_FIELD_CONFIG,
  SHIELD_GENERATOR_CONFIG,
  RADAR_STATION_CONFIG,
  REPAIR_BAY_CONFIG,
  FOUNDRY_CONFIG,
  FABRICATOR_CONFIG,
  RECYCLER_CONFIG,
  LAB_CONFIG,
  DATA_VAULT_CONFIG,
  CRYSTAL_DRILL_CONFIG,
  STEEL_SMELTER_CONFIG,
  ENERGY_RELAY_CONFIG,
  FUSION_REACTOR_CONFIG,
  ARTILLERY_CONFIG,
  COMMAND_CENTER_CONFIG,
  ION_CANNON_CONFIG,
  QUANTUM_FACTORY_CONFIG,
  SHOCKWAVE_TOWER_CONFIG,
  NANITE_DOME_CONFIG,
  ANNIHILATOR_CONFIG,
  HYPER_REACTOR_CONFIG,
  GRAVITY_CANNON_CONFIG,
  OVERDRIVE_TURRET_CONFIG,
];

// ── All Modules Array ────────────────────────────────────────
export const ALL_MODULES: ModuleConfig[] = [
  ATTACK_SPEED_CONFIG,
  RANGE_BOOST_CONFIG,
  DAMAGE_AMP_CONFIG,
  EFFICIENCY_CONFIG,
  OVERCHARGE_CONFIG,
  CHAIN_CONFIG,
  PIERCING_CONFIG,
  REGEN_CONFIG,
  SLOW_HIT_CONFIG,
  DOUBLE_YIELD_CONFIG,
  CRITICAL_HIT_CONFIG,
  THORNS_CONFIG,
  WALL_SLOW_CONFIG,
  ABSORBER_CONFIG,
];

// ── Lookup Maps ──────────────────────────────────────────────
/** Full config per TileType */
export const BUILDING_REGISTRY: Record<number, BuildingConfig> = {};
ALL_BUILDINGS.forEach(b => { BUILDING_REGISTRY[b.id] = b; });

/** Full config per ModuleType */
export const MODULE_REGISTRY: Record<number, ModuleConfig> = {};
ALL_MODULES.forEach(m => { MODULE_REGISTRY[m.id] = m; });

// ── Derived: Legacy BUILDING_STATS (backward-compatible shape) ──
export interface Building {
  type: TileType;
  health: number;
  maxHealth: number;
  range?: number;
  damage?: number;
  income: { energy?: number; scrap?: number; data?: number; steel?: number; electronics?: number; };
  consumes?: { energy?: number; scrap?: number; electronics?: number; data?: number; };
  cost: { energy?: number; scrap?: number; steel?: number; electronics?: number; data?: number; };
  costIncrease: { energy?: number; scrap?: number; steel?: number; electronics?: number; data?: number; };
}

export const BUILDING_STATS: Record<number, Partial<Building>> = {};
ALL_BUILDINGS.forEach(b => {
  BUILDING_STATS[b.id] = {
    health: b.health,
    maxHealth: b.health,
    ...(b.range !== undefined && { range: b.range }),
    ...(b.damage !== undefined && { damage: b.damage }),
    ...(b.income && { income: b.income }),
    ...(b.consumes && { consumes: b.consumes }),
    ...(b.cost && { cost: b.cost }),
    ...(b.costIncrease && { costIncrease: b.costIncrease }),
  };
});

// ── Derived: MODULE_DEFS (backward-compatible shape) ─────────
export interface ModuleDef {
  name: string;
  description: string;
  color: string;
  cost: { scrap?: number; steel?: number; electronics?: number; data?: number; };
  appliesTo: TileType[];
  requiresUnlock?: TileType;
}

export const MODULE_DEFS: Record<number, ModuleDef> = {};
ALL_MODULES.forEach(m => {
  MODULE_DEFS[m.id] = {
    name: m.name,
    description: m.description,
    color: m.color,
    cost: m.cost,
    appliesTo: m.appliesTo,
    ...(m.requiresUnlock !== undefined && { requiresUnlock: m.requiresUnlock }),
  };
});

// ── Derived: Name / Description / Color Maps ─────────────────
export const BUILDING_NAMES: Record<number, string> = {};
export const BUILDING_DESC: Record<number, string> = {};
export const BUILDING_COLORS: Record<number, string> = {};
export const TILE_COLORS: Record<number, string> = {
  [TileType.ORE_PATCH]: '#ced6e0',
};

ALL_BUILDINGS.forEach(b => {
  BUILDING_NAMES[b.id] = b.name;
  BUILDING_DESC[b.id] = b.description;
  BUILDING_COLORS[b.id] = b.color;
  TILE_COLORS[b.id] = b.color;
});

// ── Derived: Category Groups ─────────────────────────────────
export const ORE_BUILDINGS: TileType[] = ALL_BUILDINGS
  .filter(b => b.requiresOre)
  .map(b => b.id);

export const STARTER_BUILDINGS: TileType[] = ALL_BUILDINGS
  .filter(b => b.starter)
  .map(b => b.id);

export const TURRETS: TileType[] = ALL_BUILDINGS
  .filter(b => b.category === 'defense' && b.combat)
  .map(b => b.id);

export const PRODUCERS: TileType[] = ALL_BUILDINGS
  .filter(b => b.income && b.category !== 'core')
  .map(b => b.id);

// ── Derived: Tech Tree ───────────────────────────────────────
export interface TechNode {
  id: string;
  name: string;
  unlocks: TileType;
  killCost: number;
  tier: number;
  description: string;
}

export const TECH_TREE: TechNode[] = ALL_BUILDINGS
  .filter(b => b.techTree)
  .sort((a, b) => {
    const ta = a.techTree!;
    const tb = b.techTree!;
    if (ta.tier !== tb.tier) return ta.tier - tb.tier;
    return ta.killCost - tb.killCost;
  })
  .map(b => ({
    id: b.techTree!.id,
    name: b.name,
    unlocks: b.id,
    killCost: b.techTree!.killCost,
    tier: b.techTree!.tier,
    description: b.techTree!.shortDescription,
  }));

// ── Derived: Sidebar Groups ─────────────────────────────────
export interface SidebarGroup {
  label: string;
  buildings: BuildingConfig[];
}

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    label: 'Infrastruktur',
    buildings: ALL_BUILDINGS.filter(b => b.category === 'infrastructure').sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
  },
  {
    label: 'Verteidigung',
    buildings: ALL_BUILDINGS.filter(b => b.category === 'defense').sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
  },
  {
    label: 'Unterstützung',
    buildings: ALL_BUILDINGS.filter(b => b.category === 'support').sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
  },
  {
    label: 'Verarbeitung',
    buildings: ALL_BUILDINGS.filter(b => b.category === 'processing').sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
  },
  {
    label: 'Forschung',
    buildings: ALL_BUILDINGS.filter(b => b.category === 'research').sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
  },
];

// ── Derived: Guide Categories ────────────────────────────────
export const GUIDE_CATEGORIES = [
  {
    title: '⚔️ Verteidigung',
    types: ALL_BUILDINGS.filter(b => b.category === 'defense').sort((a, b) => (a.order ?? 99) - (b.order ?? 99)).map(b => b.id),
  },
  {
    title: '🏭 Produktion',
    types: ALL_BUILDINGS.filter(b => ['infrastructure', 'processing', 'research'].includes(b.category) && b.category !== 'core').sort((a, b) => (a.order ?? 99) - (b.order ?? 99)).map(b => b.id),
  },
  {
    title: '🛡️ Unterstützung',
    types: ALL_BUILDINGS.filter(b => b.category === 'support').sort((a, b) => (a.order ?? 99) - (b.order ?? 99)).map(b => b.id),
  },
];

// ── Utility ──────────────────────────────────────────────────
export const scaleVals = (base: number) =>
  [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25].map(m => Math.round(base * m * 10) / 10).join(' / ');

/** Default level scaling: HP multiplier = 1 + (level-1) * LEVEL_SCALING */
export const LEVEL_SCALING = 0.25;

/** Get the effective max HP for a building at a given level */
export function getMaxHP(type: number, level: number): number {
  const baseHP = BUILDING_STATS[type]?.maxHealth || 100;
  return baseHP * (1 + (level - 1) * LEVEL_SCALING);
}

/** Get the level multiplier for income/damage/etc */
export function getLevelMult(level: number): number {
  return 1 + (level - 1) * LEVEL_SCALING;
}
