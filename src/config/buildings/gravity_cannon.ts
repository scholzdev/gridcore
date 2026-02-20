import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const GRAVITY_CANNON_CONFIG: BuildingConfig = {
  id: TileType.GRAVITY_CANNON,
  name: 'Gravitationskanone',
  description: 'Zieht alle Gegner im Radius 12 zum Zentrum und verlangsamt sie um 80%. Perfekte AoE-Combo. Max 1.',
  color: '#8338ec',
  category: 'support',

  health: 8000,
  range: 12,
  cost: { steel: 1100, electronics: 850, data: 650 },
  costIncrease: { steel: 550, electronics: 425, data: 325 },
  consumes: { energy: 90 },

  support: {
    gravityPull: 0.03,
    gravitySlow: 0.8,
  },

  maxCount: 1,

  techTree: {
    id: 'gravity_cannon',
    killCost: 100,
    tier: 6,
    shortDescription: 'Zieht Gegner zusammen + 80% Slow',
  },

  order: 15,
};
