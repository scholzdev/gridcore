import { TileType } from '../config';
import type { GameEngine } from './Engine';

/** Helper: get the seeded RNG from engine, falling back to Math.random */
function rng(engine: GameEngine): number {
  return engine.spawnRng();
}

// ── Event Definitions ────────────────────────────────────────

export interface MapEvent {
  id: string;
  name: string;
  description: string;
  color: string;
  /** Duration in ticks (0 = instant) */
  duration: number;
  /** Apply the event */
  apply: (engine: GameEngine) => void;
  /** Remove ongoing effect (called when duration expires) */
  remove?: (engine: GameEngine) => void;
}

export interface ActiveEvent {
  event: MapEvent;
  remainingTicks: number;
}

export interface EventNotification {
  text: string;
  color: string;
  life: number; // frames remaining
}

// ── Event Config ─────────────────────────────────────────────

/** Min ticks between events */
export const EVENT_MIN_INTERVAL = 60;
/** Max ticks between events */
export const EVENT_MAX_INTERVAL = 90;
/** Min game time before events start */
export const EVENT_START_TIME = 30;

// ── Event Catalog ────────────────────────────────────────────

const SOLAR_STORM: MapEvent = {
  id: 'solar_storm',
  name: '☀ Sonnensturm',
  description: 'Solarfelder produzieren 3× Energie!',
  color: '#f1c40f',
  duration: 15,
  apply: (engine) => {
    engine.solarStormMult = 3;
  },
  remove: (engine) => {
    engine.solarStormMult = 1;
  },
};

const METEOR_RAIN: MapEvent = {
  id: 'meteor_rain',
  name: '☄ Meteoritenregen',
  description: 'Meteoriten schlagen auf dem Feld ein!',
  color: '#e74c3c',
  duration: 0, // instant
  apply: (engine) => {
    const size = engine.grid.size;
    const impacts = 2 + Math.floor(rng(engine) * 2); // 2-3 impacts
    for (let i = 0; i < impacts; i++) {
      const x = Math.floor(rng(engine) * size);
      const y = Math.floor(rng(engine) * size);
      const type = engine.grid.tiles[y][x];

      // Don't destroy the core
      if (type === TileType.CORE) continue;

      // Destroy building if present
      if (type !== TileType.EMPTY && type !== TileType.ORE_PATCH) {
        engine.grid.tiles[y][x] = TileType.EMPTY;
        engine.grid.healths[y][x] = 0;
        engine.grid.shields[y][x] = 0;
        engine.grid.modules[y][x] = 0;
        engine.grid.levels[y][x] = 0;
        if (engine.purchasedCounts[type] > 0) engine.purchasedCounts[type]--;
      }

      // Impact particles
      for (let p = 0; p < 15; p++) {
        const angle = (Math.PI * 2 / 15) * p + (rng(engine) - 0.5) * 0.3;
        const speed = 0.04 + rng(engine) * 0.06;
        const colors = ['#e74c3c', '#e67e22', '#f39c12', '#d63031'];
        engine.addParticle({
          x: x + 0.5, y: y + 0.5,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: 20 + Math.floor(rng(engine) * 10),
          color: colors[Math.floor(rng(engine) * colors.length)],
        });
      }
      engine.addDamageNumber(x + 0.5, y + 0.5, 0, '#e74c3c');
    }
  },
};

const ORE_DISCOVERY: MapEvent = {
  id: 'ore_discovery',
  name: '⛏ Erzvorkommen',
  description: 'Neue Erzadern wurden entdeckt!',
  color: '#8B4513',
  duration: 0,
  apply: (engine) => {
    const size = engine.grid.size;
    let placed = 0;
    const target = 1 + Math.floor(rng(engine) * 2); // 1-2 new ore patches
    let attempts = 0;
    while (placed < target && attempts < 200) {
      attempts++;
      const x = Math.floor(rng(engine) * size);
      const y = Math.floor(rng(engine) * size);
      if (engine.grid.tiles[y][x] === TileType.EMPTY) {
        engine.grid.tiles[y][x] = TileType.ORE_PATCH;
        placed++;
        // Sparkle particles
        for (let p = 0; p < 8; p++) {
          const angle = (Math.PI * 2 / 8) * p;
          engine.addParticle({
            x: x + 0.5, y: y + 0.5,
            vx: Math.cos(angle) * 0.03, vy: Math.sin(angle) * 0.03,
            life: 15, color: '#f39c12',
          });
        }
      }
    }
  },
};

const RESOURCE_DROP: MapEvent = {
  id: 'resource_drop',
  name: '📦 Ressourcen-Drop',
  description: 'Eine Lieferung trifft ein!',
  color: '#2ecc71',
  duration: 0,
  apply: (engine) => {
    const resources = ['scrap', 'steel', 'electronics', 'energy'] as const;
    const pick = resources[Math.floor(rng(engine) * resources.length)];
    const baseAmounts: Record<string, number> = { scrap: 300, steel: 100, electronics: 60, energy: 200 };
    const amount = Math.floor(baseAmounts[pick] + engine.gameTime * 2);
    engine.resources.add({ [pick]: amount });
    const names: Record<string, string> = { scrap: 'Schrott', steel: 'Stahl', electronics: 'Elektronik', energy: 'Energie' };
    engine.addEventNotification(`+${amount} ${names[pick]}!`, '#2ecc71');
  },
};

const ENEMY_SWARM: MapEvent = {
  id: 'enemy_swarm',
  name: '🐝 Schwarmattacke',
  description: '15 Schwarm-Gegner erscheinen sofort!',
  color: '#fdcb6e',
  duration: 0,
  apply: (engine) => {
    for (let i = 0; i < 15; i++) {
      const s = engine.grid.size;
      const side = Math.floor(rng(engine) * 4);
      let x = 0, y = 0;
      if (side === 0) { x = rng(engine) * s; y = 0; }
      if (side === 1) { x = s - 1; y = rng(engine) * s; }
      if (side === 2) { x = rng(engine) * s; y = s - 1; }
      if (side === 3) { x = 0; y = rng(engine) * s; }
      const minutes = engine.gameTime / 60;
      const hp = engine.diffConfig.baseHp * 0.3 * Math.pow(1.05, minutes * 10);
      const speed = Math.min(0.12, engine.diffConfig.baseSpeed * 1.5);
      engine.enemies.push({
        id: `swarm${Date.now()}${i}`, x, y, health: hp, maxHealth: hp, speed,
        lastHit: 0, enemyType: 'swarm',
      });
    }
  },
};

const SHIELD_SURGE: MapEvent = {
  id: 'shield_surge',
  name: '🛡 Schildwelle',
  description: 'Alle Schilde werden verdoppelt!',
  color: '#74b9ff',
  duration: 20,
  apply: (engine) => {
    const size = engine.grid.size;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (engine.grid.shields[y][x] > 0) {
          engine.grid.shields[y][x] *= 2;
        }
      }
    }
  },
};

const TECH_SALVAGE: MapEvent = {
  id: 'tech_salvage',
  name: '🔧 Technologie-Fund',
  description: 'Geborgene Technologie: +15 KP!',
  color: '#9b59b6',
  duration: 0,
  apply: (engine) => {
    const bonus = 15 + Math.floor(engine.gameTime / 60) * 5;
    engine.killPoints += bonus;
    engine.addEventNotification(`+${bonus} KP!`, '#9b59b6');
  },
};

const RADIATION_LEAK: MapEvent = {
  id: 'radiation_leak',
  name: '☢ Strahlungsleck',
  description: 'Gebäude in einem Bereich nehmen Schaden!',
  color: '#00b894',
  duration: 0,
  apply: (engine) => {
    const size = engine.grid.size;
    const cx = Math.floor(rng(engine) * (size - 6)) + 3;
    const cy = Math.floor(rng(engine) * (size - 6)) + 3;
    const radius = 3;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
        if (Math.sqrt(dx * dx + dy * dy) > radius) continue;
        const type = engine.grid.tiles[ny][nx];
        if (type === TileType.CORE) continue; // Don't touch core
        if (type !== TileType.EMPTY && type !== TileType.ORE_PATCH) {
          const maxHP = engine.grid.healths[ny][nx];
          const dmg = Math.floor(maxHP * 0.25);
          engine.grid.healths[ny][nx] -= dmg;
          engine.addDamageNumber(nx + 0.5, ny + 0.5, dmg, '#00b894');
        }
      }
    }
  },
};

const OVERCHARGE_EVENT: MapEvent = {
  id: 'overcharge_event',
  name: '⚡ Energiestoß',
  description: 'Alle Türme feuern 50% schneller!',
  color: '#f39c12',
  duration: 15,
  apply: () => { /* handled by checking active event in combat */ },
};

export const ALL_EVENTS: MapEvent[] = [
  SOLAR_STORM,
  METEOR_RAIN,
  ORE_DISCOVERY,
  RESOURCE_DROP,
  ENEMY_SWARM,
  SHIELD_SURGE,
  TECH_SALVAGE,
  RADIATION_LEAK,
  OVERCHARGE_EVENT,
];

// ── Event State ──────────────────────────────────────────────

export interface MapEventState {
  /** Ticks until next event triggers */
  nextEventIn: number;
  /** Currently active timed events */
  activeEvents: ActiveEvent[];
  /** On-screen notifications */
  notifications: EventNotification[];
}

export function createMapEventState(seedRng?: () => number): MapEventState {
  const r = seedRng || Math.random;
  return {
    nextEventIn: EVENT_START_TIME + Math.floor(r() * 30),
    activeEvents: [],
    notifications: [],
  };
}

// ── Tick Logic ────────────────────────────────────────────────

export function tickMapEvents(engine: GameEngine) {
  const state = engine.mapEvents;

  // Countdown to next event
  state.nextEventIn--;
  if (state.nextEventIn <= 0) {
    // Pick random event
    const event = ALL_EVENTS[Math.floor(rng(engine) * ALL_EVENTS.length)];
    triggerEvent(engine, event);
    // Schedule next
    state.nextEventIn = EVENT_MIN_INTERVAL + Math.floor(rng(engine) * (EVENT_MAX_INTERVAL - EVENT_MIN_INTERVAL));
  }

  // Tick active events
  for (let i = state.activeEvents.length - 1; i >= 0; i--) {
    const ae = state.activeEvents[i];
    ae.remainingTicks--;
    if (ae.remainingTicks <= 0) {
      ae.event.remove?.(engine);
      state.activeEvents.splice(i, 1);
    }
  }
}

export function updateEventNotifications(engine: GameEngine) {
  const state = engine.mapEvents;
  for (let i = state.notifications.length - 1; i >= 0; i--) {
    state.notifications[i].life--;
    if (state.notifications[i].life <= 0) {
      state.notifications.splice(i, 1);
    }
  }
}

function triggerEvent(engine: GameEngine, event: MapEvent) {
  event.apply(engine);

  if (event.duration > 0) {
    engine.mapEvents.activeEvents.push({ event, remainingTicks: event.duration });
  }

  engine.addEventNotification(
    `${event.name}: ${event.description}`,
    event.color,
  );
}
