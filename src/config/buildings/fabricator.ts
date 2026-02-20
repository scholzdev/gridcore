import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const FABRICATOR_CONFIG: BuildingConfig = {
  id: TileType.FABRICATOR,
  name: 'E-Fabrik',
  description: 'Wandelt Energie → Elektronik um.',
  color: '#1dd1a1',
  category: 'processing',

  health: 1000,
  cost: { scrap: 200, energy: 100 },
  costIncrease: { scrap: 70, energy: 50 },
  consumes: { energy: 20 },
  income: { electronics: 8 },

  techTree: {
    id: 'efab',
    killCost: 15,
    tier: 2,
    shortDescription: 'Schrott+Energie → Elektronik',
  },

  order: 2,
};
