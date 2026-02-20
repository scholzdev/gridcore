import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const RADAR_STATION_CONFIG: BuildingConfig = {
  id: TileType.RADAR_STATION,
  name: 'Radarstation',
  description: 'Erhöht Geschützreichweite. Reichweite 5. Verbraucht Energie.',
  color: '#fdcb6e',
  category: 'support',

  health: 600,
  range: 5,
  cost: { steel: 80, electronics: 40 },
  costIncrease: { steel: 30, electronics: 20 },
  consumes: { energy: 10 },

  support: {
    radarRangeBuffBase: 3,
    radarRangeBuffPerLevel: 1,
  },

  techTree: {
    id: 'radar',
    killCost: 30,
    tier: 3,
    shortDescription: 'Erhöht Geschützreichweite',
  },

  order: 3,
};
