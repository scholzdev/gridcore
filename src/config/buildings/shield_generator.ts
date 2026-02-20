import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const SHIELD_GENERATOR_CONFIG: BuildingConfig = {
  id: TileType.SHIELD_GENERATOR,
  name: 'Schildgenerator',
  description: 'Schirmt Gebäude im Bereich ab. Reichweite 4. Verbraucht Energie.',
  color: '#74b9ff',
  category: 'support',

  health: 800,
  range: 4,
  cost: { steel: 100, energy: 50 },
  costIncrease: { steel: 50, energy: 25 },
  consumes: { energy: 25 },

  support: {
    shieldCap: 500,
  },

  techTree: {
    id: 'shield',
    killCost: 15,
    tier: 2,
    shortDescription: 'Schirmt Gebäude ab',
  },

  order: 2,
};
