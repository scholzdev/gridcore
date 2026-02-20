import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const TESLA_COIL_CONFIG: BuildingConfig = {
  id: TileType.TESLA_COIL,
  name: 'Teslaspule',
  description: 'Trifft 3+ Ziele gleichzeitig. Reichweite 5. Verbraucht Energie.',
  color: '#6c5ce7',
  category: 'defense',

  health: 1200,
  range: 5,
  damage: 40,
  cost: { steel: 120, scrap: 80 },
  costIncrease: { steel: 60, scrap: 30 },
  consumes: { energy: 15 },

  combat: {
    fireChance: 0.9,
    projectileSpeed: 0.6,
    projectileColor: '#6c5ce7',
    maxTargetsBase: 3,
    maxTargetsPerLevel: 1,
  },

  techTree: {
    id: 'tesla',
    killCost: 15,
    tier: 2,
    shortDescription: 'Trifft 3+ Ziele gleichzeitig',
  },

  order: 3,
};
