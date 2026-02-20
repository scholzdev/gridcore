import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const FOUNDRY_CONFIG: BuildingConfig = {
  id: TileType.FOUNDRY,
  name: 'Gießerei',
  description: 'Wandelt Schrott+Energie → Stahl um.',
  color: '#ff9f43',
  category: 'processing',

  health: 1000,
  cost: { scrap: 120, energy: 40 },
  costIncrease: { scrap: 40, energy: 20 },
  consumes: { energy: 15 },
  income: { steel: 12 },

  techTree: {
    id: 'foundry',
    killCost: 5,
    tier: 1,
    shortDescription: 'Schrott+Energie → Stahl',
  },

  order: 1,
};
