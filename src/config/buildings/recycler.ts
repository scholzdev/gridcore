import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const RECYCLER_CONFIG: BuildingConfig = {
  id: TileType.RECYCLER,
  name: 'Recycler',
  description: 'Wandelt Schrott+Energie → Stahl+Elektronik um.',
  color: '#55efc4',
  category: 'processing',

  health: 1200,
  cost: { steel: 250, electronics: 150, data: 80 },
  costIncrease: { steel: 100, electronics: 75, data: 40 },
  consumes: { energy: 25 },
  income: { steel: 10, electronics: 8 },

  techTree: {
    id: 'recycler',
    killCost: 30,
    tier: 3,
    shortDescription: 'Stahl+Elektronik aus Schrott',
  },

  order: 3,
};
