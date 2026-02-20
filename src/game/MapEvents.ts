import { TileType } from '../config';
import type { GameEngine } from './Engine';

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
    const impacts = 2 + Math.floor(Math.random() * 2); // 2-3 impacts
    for (let i = 0; i < impacts; i++) {
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
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
        const angle = (Math.PI * 2 / 15) * p + (Math.random() - 0.5) * 0.3;
        const speed = 0.04 + Math.random() * 0.06;
        const colors = ['#e74c3c', '#e67e22', '#f39c12', '#d63031'];
        engine.addParticle({
          x: x + 0.5, y: y + 0.5,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: 20 + Math.floor(Math.random() * 10),
          color: colors[Math.floor(Math.random() * colors.length)],
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
    const target = 1 + Math.floor(Math.random() * 2); // 1-2 new ore patches
    let attempts = 0;
    while (placed < target && attempts < 200) {
      attempts++;
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
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
    const pick = resources[Math.floor(Math.random() * resources.length)];
    const amounts: Record<string, number> = { scrap: 300, steel: 100, electronics: 60, energy: 200 };
    const amount = amounts[pick];
    engine.resources.add({ [pick]: amount });
    const names: Record<string, string> = { scrap: 'Schrott', steel: 'Stahl', electronics: 'Elektronik', energy: 'Energie' };
    // Override notification with specific info
    engine.addEventNotification(`+${amount} ${names[pick]}!`, '#2ecc71');
  },
};

export const ALL_EVENTS: MapEvent[] = [
  SOLAR_STORM,
  METEOR_RAIN,
  ORE_DISCOVERY,
  RESOURCE_DROP,
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

export function createMapEventState(): MapEventState {
  return {
    nextEventIn: EVENT_START_TIME + Math.floor(Math.random() * 30),
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
    const event = ALL_EVENTS[Math.floor(Math.random() * ALL_EVENTS.length)];
    triggerEvent(engine, event);
    // Schedule next
    state.nextEventIn = EVENT_MIN_INTERVAL + Math.floor(Math.random() * (EVENT_MAX_INTERVAL - EVENT_MIN_INTERVAL));
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
