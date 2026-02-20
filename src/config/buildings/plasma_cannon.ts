import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const PLASMA_CANNON_CONFIG: BuildingConfig = {
  id: TileType.PLASMA_CANNON,
  name: 'Plasmakanone',
  description: 'Flächenschaden-Kanone. Reichweite 10. Verbraucht Energie.',
  color: '#fd79a8',
  category: 'defense',

  health: 4000,
  range: 10,
  damage: 300,
  cost: { steel: 500, electronics: 400, data: 200 },
  costIncrease: { steel: 300, electronics: 200, data: 100 },
  consumes: { energy: 30 },

  combat: {
    fireChance: 0.9,
    fireChanceModifier: 0.05,
    projectileSpeed: 0.3,
    projectileColor: '#fd79a8',
    splash: 2,
  },

  techTree: {
    id: 'plasma',
    killCost: 200,
    tier: 4,
    shortDescription: 'Massiver Flächenschaden',
  },

  order: 4,
};
