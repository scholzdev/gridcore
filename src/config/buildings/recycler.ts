import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const RECYCLER_CONFIG: BuildingConfig = {
  id: TileType.RECYCLER,
  name: 'Recycler',
  description: 'Wandelt Schrott+Energie → Stahl+Elektronik um.',
  color: '#55efc4',
  category: 'processing',

  health: 1200,
  cost: { steel: 150, electronics: 100, data: 50 },
  costIncrease: { steel: 75, electronics: 50, data: 25 },
  consumes: { energy: 40, scrap: 15 },
  income: { steel: 10, electronics: 8 },

  techTree: {
    id: 'recycler',
    killCost: 30,
    tier: 3,
    shortDescription: 'Stahl+Elektronik aus Schrott',
  },

  order: 3,
};
