// ── Hook System ──────────────────────────────────────────────
// Central dispatcher: fires building hooks THEN module hooks.
// Hooks are INTERCEPTORS — they can mutate event objects.
// Callers read back modified values (e.g. event.incomeMult).

import { BUILDING_REGISTRY, MODULE_REGISTRY, ALL_BUILDINGS, getLevelMult } from '../config';
import type { BuildingRef, GameCtx, BuildingHooks } from '../config';
import type { TickEvent, CombatTickEvent, ResourceGainedEvent, HitEvent, AuraTickEvent } from '../config/hooks';
import type { Enemy } from './types';
import type { ResourceCost } from '../config';

// ── Helpers ──────────────────────────────────────────────────

/** Build a BuildingRef snapshot for a tile on the grid */
export function buildingRef(game: GameCtx, x: number, y: number): BuildingRef {
  const type = game.grid.tiles[y][x];
  const level = game.grid.levels[y][x] || 1;
  return {
    x, y, type, level,
    module: game.grid.modules[y][x] || 0,
    health: game.grid.healths[y][x],
    maxHealth: game.getMaxHP(type, level),
    shield: game.grid.shields[y][x],
    active: game.activeTiles[y]?.[x] ?? false,
  };
}

/** Get the chain of hooks to fire: building first, then module (if any) */
function _getHookChain(game: GameCtx, type: number, x: number, y: number): BuildingHooks[] {
  const chain: BuildingHooks[] = [];
  const bh = BUILDING_REGISTRY[type]?.hooks;
  if (bh) chain.push(bh);
  const mod = game.grid.modules[y]?.[x];
  if (mod) {
    const mh = MODULE_REGISTRY[mod]?.hooks;
    if (mh) chain.push(mh);
  }
  return chain;
}

// ── Per-Building Hook Dispatchers (interceptor pattern) ──────

/** Fire onTick — returns mutable TickEvent so caller can read consumeMult & healAmount */
export function fireOnTick(game: GameCtx, x: number, y: number, tick: number): TickEvent {
  const type = game.grid.tiles[y][x];
  const level = game.grid.levels[y][x] || 1;
  const event: TickEvent = {
    building: buildingRef(game, x, y),
    game, tick,
    levelMult: getLevelMult(level),
    consumeMult: 1,
    healAmount: 0,
  };
  for (const hooks of _getHookChain(game, type, x, y)) {
    hooks.onTick?.(event);
  }
  return event;
}

/** Fire onCombatTick — returns mutable event (damage, fireChance, effectiveRange) */
export function fireOnCombatTick(
  game: GameCtx, x: number, y: number, tick: number,
  enemiesInRange: Enemy[], effectiveRange: number, damage: number, fireChance: number,
): CombatTickEvent {
  const type = game.grid.tiles[y][x];
  const level = game.grid.levels[y][x] || 1;
  const event: CombatTickEvent = {
    building: buildingRef(game, x, y),
    game, tick,
    levelMult: getLevelMult(level),
    enemiesInRange, effectiveRange, damage, fireChance,
  };
  for (const hooks of _getHookChain(game, type, x, y)) {
    hooks.onCombatTick?.(event);
  }
  return event;
}

/** Fire onResourceGained — returns mutable event (income, incomeMult) */
export function fireOnResourceGained(
  game: GameCtx, x: number, y: number,
  income: ResourceGainedEvent['income'],
): ResourceGainedEvent {
  const type = game.grid.tiles[y][x];
  const event: ResourceGainedEvent = {
    building: buildingRef(game, x, y),
    game, income, incomeMult: 1,
  };
  for (const hooks of _getHookChain(game, type, x, y)) {
    hooks.onResourceGained?.(event);
  }
  return event;
}

/** Fire onPlace when a building is placed */
export function fireOnPlace(game: GameCtx, x: number, y: number) {
  const type = game.grid.tiles[y][x];
  const event = { building: buildingRef(game, x, y), game };
  for (const hooks of _getHookChain(game, type, x, y)) {
    hooks.onPlace?.(event);
  }
}

/** Fire onRemove when a building is removed */
export function fireOnRemove(game: GameCtx, x: number, y: number, type: number, level: number, refund: Partial<ResourceCost>) {
  const bh = BUILDING_REGISTRY[type]?.hooks;
  const event = {
    building: { x, y, type, level, module: 0, health: 0, maxHealth: game.getMaxHP(type, level), shield: 0, active: false },
    game, refund,
  };
  bh?.onRemove?.(event);
  // Module is already gone by remove time — no module hooks
}

/** Fire onUpgrade when a building is upgraded */
export function fireOnUpgrade(game: GameCtx, x: number, y: number, previousLevel: number, newLevel: number) {
  const type = game.grid.tiles[y][x];
  const event = { building: buildingRef(game, x, y), game, previousLevel, newLevel };
  for (const hooks of _getHookChain(game, type, x, y)) {
    hooks.onUpgrade?.(event);
  }
}

/** Fire onDestroyed when a building's HP drops to 0 */
export function fireOnDestroyed(game: GameCtx, x: number, y: number, type: number, enemy?: Enemy) {
  const level = game.grid.levels[y][x] || 1;
  const event = {
    building: { x, y, type, level, module: game.grid.modules[y][x] || 0, health: 0, maxHealth: game.getMaxHP(type, level), shield: 0, active: false },
    game, enemy,
  };
  for (const hooks of _getHookChain(game, type, x, y)) {
    hooks.onDestroyed?.(event);
  }
}

/** Fire onHit — returns mutable event (damage) */
export function fireOnHit(
  game: GameCtx, x: number, y: number, enemy: Enemy, damage: number, isSplash: boolean, mod: number,
): HitEvent {
  const type = game.grid.tiles[y][x];
  const event: HitEvent = {
    building: buildingRef(game, x, y),
    game, enemy, damage, isSplash, module: mod,
  };
  for (const hooks of _getHookChain(game, type, x, y)) {
    hooks.onHit?.(event);
  }
  return event;
}

/** Fire onKill when this building kills an enemy */
export function fireOnKill(game: GameCtx, x: number, y: number, enemy: Enemy) {
  const type = game.grid.tiles[y][x];
  const event = { building: buildingRef(game, x, y), game, enemy };
  for (const hooks of _getHookChain(game, type, x, y)) {
    hooks.onKill?.(event);
  }
}

/** Fire onEnterKillRange (e.g. mines) */
export function fireOnEnterKillRange(game: GameCtx, x: number, y: number, enemy: Enemy, distance: number, range: number) {
  const type = game.grid.tiles[y][x];
  const event = { building: buildingRef(game, x, y), game, enemy, distance, range };
  for (const hooks of _getHookChain(game, type, x, y)) {
    hooks.onEnterKillRange?.(event);
  }
}

/** Fire onAuraTick — returns mutable event (range can be modified by hooks) */
export function fireOnAuraTick(game: GameCtx, x: number, y: number, tick: number, range: number): AuraTickEvent {
  const type = game.grid.tiles[y][x];
  const level = game.grid.levels[y][x] || 1;
  const event: AuraTickEvent = {
    building: buildingRef(game, x, y),
    game, tick,
    levelMult: getLevelMult(level),
    range,
  };
  for (const hooks of _getHookChain(game, type, x, y)) {
    hooks.onAuraTick?.(event);
  }
  return event;
}

/** Fire onAllyDamaged when a nearby ally takes damage */
export function fireOnAllyDamaged(game: GameCtx, x: number, y: number, ally: BuildingRef, damage: number, enemy?: Enemy) {
  const type = game.grid.tiles[y][x];
  const event = { building: buildingRef(game, x, y), game, ally, damage, enemy };
  for (const hooks of _getHookChain(game, type, x, y)) {
    hooks.onAllyDamaged?.(event);
  }
}

// ── Global Event Dispatchers (fire on ALL buildings) ─────────

/** Fire onWaveStart on every placed building + its module */
export function fireOnWaveStart(game: GameCtx, wave: number, enemyCount: number) {
  _forEachBuilding(game, (type, x, y) => {
    const event = { game, wave, enemyCount, building: buildingRef(game, x, y) };
    for (const hooks of _getHookChain(game, type, x, y)) {
      hooks.onWaveStart?.(event);
    }
  });
}

/** Fire onWaveEnd on every placed building + its module */
export function fireOnWaveEnd(game: GameCtx, wave: number, enemyCount: number, enemiesKilled: number) {
  _forEachBuilding(game, (type, x, y) => {
    const event = { game, wave, enemyCount, enemiesKilled, building: buildingRef(game, x, y) };
    for (const hooks of _getHookChain(game, type, x, y)) {
      hooks.onWaveEnd?.(event);
    }
  });
}

/** Fire onGameStart (global — fires on all building configs) */
export function fireOnGameStart(game: GameCtx) {
  ALL_BUILDINGS.forEach(cfg => {
    cfg.hooks?.onGameStart?.({ game, difficulty: game.difficulty, mode: game.gameMode });
  });
}

/** Fire onPrestige (global) */
export function fireOnPrestige(game: GameCtx, pointsEarned: number, totalPoints: number) {
  ALL_BUILDINGS.forEach(cfg => {
    cfg.hooks?.onPrestige?.({ game, pointsEarned, totalPoints });
  });
}

/** Fire onUnlockTech (global) */
export function fireOnUnlockTech(game: GameCtx, techId: string, techName: string, unlockedBuilding: number) {
  ALL_BUILDINGS.forEach(cfg => {
    cfg.hooks?.onUnlockTech?.({ game, techId, techName, unlockedBuilding });
  });
}

// ── Internal ─────────────────────────────────────────────────

function _forEachBuilding(game: GameCtx, fn: (type: number, x: number, y: number) => void) {
  const size = game.grid.size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const type = game.grid.tiles[y][x];
      if (type > 1) fn(type, x, y);
    }
  }
}
