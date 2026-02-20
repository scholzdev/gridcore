import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const STEEL_SMELTER_CONFIG: BuildingConfig = {
  id: TileType.STEEL_SMELTER,
  name: 'Stahlschmelze',
  description: 'Schmilzt Stahl direkt aus Erz. Auf Erzvorkommen platzieren. Verbraucht Energie.',
  color: '#e17055',
  category: 'infrastructure',
  requiresOre: true,

  health: 600,
  cost: { scrap: 60, energy: 20 },
  costIncrease: { scrap: 20, energy: 10 },
  consumes: { energy: 5 },
  income: { steel: 8 },

  techTree: {
    id: 'smelter',
    killCost: 5,
    tier: 1,
    shortDescription: 'Erz → Stahl direkt',
  },

  order: 4,
};
