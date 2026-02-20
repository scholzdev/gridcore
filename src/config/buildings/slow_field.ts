import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const SLOW_FIELD_CONFIG: BuildingConfig = {
  id: TileType.SLOW_FIELD,
  name: 'EMP-Feld',
  description: 'Verlangsamt Gegner im Bereich. Reichweite 5. Verbraucht Energie.',
  color: '#a29bfe',
  category: 'support',

  health: 500,
  range: 5,
  cost: { scrap: 100, energy: 40 },
  costIncrease: { scrap: 40, energy: 15 },
  consumes: { energy: 15 },

  support: {
    slowPct: 0.4,
    slowPctPerLevel: 0.1,
  },

  techTree: {
    id: 'emp',
    killCost: 5,
    tier: 1,
    shortDescription: 'Verlangsamt Gegner',
  },

  order: 1,
};
