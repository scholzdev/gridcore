import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const ARTILLERY_CONFIG: BuildingConfig = {
  id: TileType.ARTILLERY,
  name: 'Artillerie',
  description: 'Globale Reichweite. Massiver Splash-Schaden. Sehr langsam. Braucht Radarstation in der Nähe.',
  color: '#2c3e50',
  category: 'defense',

  health: 5000,
  range: 100, // global (entire map)
  damage: 500,
  cost: { steel: 800, electronics: 600, data: 400 },
  costIncrease: { steel: 400, electronics: 300, data: 200 },
  consumes: { energy: 25 },

  combat: {
    fireChance: 0.97, // only 3% chance per tick — very slow
    splash: 3,
    fireChanceModifier: 0,
    projectileSpeed: 0.2,
    projectileColor: '#2c3e50',
  },

  techTree: {
    id: 'artillery',
    killCost: 75,
    tier: 5,
    shortDescription: 'Globale Reichweite, massiver AoE',
  },

  order: 10,
};
