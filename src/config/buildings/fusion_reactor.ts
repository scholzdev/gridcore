import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const FUSION_REACTOR_CONFIG: BuildingConfig = {
  id: TileType.FUSION_REACTOR,
  name: 'Fusionsreaktor',
  description: 'Erzeugt massive Energie. Verbraucht Stahl+Daten.',
  color: '#00b894',
  category: 'infrastructure',

  health: 1200,
  cost: { steel: 350, electronics: 200, data: 150 },
  costIncrease: { steel: 150, electronics: 100, data: 75 },
  income: { energy: 120 },

  techTree: {
    id: 'fusion',
    killCost: 30,
    tier: 3,
    shortDescription: 'Massive Energieproduktion',
  },

  order: 5,
};
