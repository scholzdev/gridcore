/**
 * Active Abilities — manual player-triggered powers with high costs and cooldowns.
 * Adds real-time decision-making to the gameplay loop.
 */

import type { ResourceCost } from '../config/types';

// ── Ability Definitions ──────────────────────────────────────

export interface AbilityDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  hotkey: string;
  cost: ResourceCost;
  cooldown: number;       // seconds
  duration: number;       // seconds (0 = instant)
  color: string;
}

export const ABILITIES: AbilityDef[] = [
  {
    id: 'overcharge',
    name: 'Überladung',
    description: 'Alle Türme feuern 8s lang mit doppelter Feuerrate.',
    icon: '⚡',
    hotkey: 'Q',
    cost: { energy: 5000 },
    cooldown: 60,
    duration: 8,
    color: '#f1c40f',
  },
  {
    id: 'emergency_repair',
    name: 'Notfallreparatur',
    description: 'Heilt ALLE Gebäude sofort um 50% ihrer Max-HP.',
    icon: '🔧',
    hotkey: 'W',
    cost: { energy: 5000, steel: 500 },
    cooldown: 90,
    duration: 0,
    color: '#27ae60',
  },
  {
    id: 'emp_blast',
    name: 'EMP-Schlag',
    description: 'Alle Gegner auf der Karte werden 5s lang gestunt.',
    icon: '💥',
    hotkey: 'E',
    cost: { energy: 10000 },
    cooldown: 120,
    duration: 5,
    color: '#3498db',
  },
];

// ── Ability State ────────────────────────────────────────────

export interface AbilityState {
  cooldowns: Record<string, number>;   // remaining cooldown in ticks
  active: Record<string, number>;      // remaining duration in ticks (0 = not active)
}

export function createAbilityState(): AbilityState {
  return { cooldowns: {}, active: {} };
}

export function isAbilityReady(state: AbilityState, id: string): boolean {
  return (state.cooldowns[id] || 0) <= 0;
}

export function isAbilityActive(state: AbilityState, id: string): boolean {
  return (state.active[id] || 0) > 0;
}

export function getAbilityCooldownRemaining(state: AbilityState, id: string): number {
  return Math.max(0, state.cooldowns[id] || 0);
}

export function getAbilityDef(id: string): AbilityDef | undefined {
  return ABILITIES.find(a => a.id === id);
}

/** Tick all ability timers — call once per engine tick */
export function tickAbilities(state: AbilityState): void {
  for (const id of Object.keys(state.cooldowns)) {
    if (state.cooldowns[id] > 0) state.cooldowns[id]--;
  }
  for (const id of Object.keys(state.active)) {
    if (state.active[id] > 0) state.active[id]--;
  }
}

/** Activate an ability — returns true if successfully activated */
export function activateAbility(
  state: AbilityState,
  id: string,
  canAfford: (cost: ResourceCost) => boolean,
  spend: (cost: ResourceCost) => void,
): boolean {
  const def = getAbilityDef(id);
  if (!def) return false;
  if (!isAbilityReady(state, id)) return false;
  if (!canAfford(def.cost)) return false;

  spend(def.cost);
  state.cooldowns[id] = def.cooldown; // in ticks (1 tick = 1 second)
  if (def.duration > 0) {
    state.active[id] = def.duration;
  }
  return true;
}
