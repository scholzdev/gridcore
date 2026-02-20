import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const CRYSTAL_DRILL_CONFIG: BuildingConfig = {
  id: TileType.CRYSTAL_DRILL,
  name: 'Kristallbohrer',
  description: 'Baut Elektronik direkt aus Erz ab. Auf Erzvorkommen platzieren. Verbraucht Energie.',
  color: '#1abc9c',
  category: 'infrastructure',
  requiresOre: true,

  health: 600,
  cost: { scrap: 80, steel: 40 },
  costIncrease: { scrap: 30, steel: 15 },
  consumes: { energy: 20 },
  income: { electronics: 5 },

  techTree: {
    id: 'crystal',
    killCost: 15,
    tier: 2,
    shortDescription: 'Erz → Elektronik direkt',
  },

  order: 5,
};
