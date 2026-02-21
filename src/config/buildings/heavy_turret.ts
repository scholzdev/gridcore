import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const HEAVY_TURRET_CONFIG: BuildingConfig = {
  id: TileType.HEAVY_TURRET,
  name: 'Sturmgeschütz',
  description: 'Hoher Schaden, große Reichweite. Reichweite 12.',
  color: '#c0392b',
  category: 'defense',

  health: 3000,
  range: 10,
  damage: 125,
  cost: { steel: 400, electronics: 300 },
  costIncrease: { steel: 200, electronics: 150 },
  consumes: { energy: 7.5 },

  combat: {
    fireChance: 0.9,
    projectileSpeed: 0.4,
    projectileColor: '#c0392b',
  },

  techTree: {
    id: 'storm',
    killCost: 15,
    tier: 2,
    shortDescription: 'Hoher Schaden, große Reichweite',
  },

  order: 2,
};
