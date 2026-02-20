import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const DRONE_HANGAR_CONFIG: BuildingConfig = {
  id: TileType.DRONE_HANGAR,
  name: 'Drohnenhangar',
  description: 'Spawnt autonome Drohnen die Gegner verfolgen. 2+Level Drohnen.',
  color: '#0984e3',
  category: 'defense',

  health: 2000,
  range: 10,
  damage: 45,
  cost: { steel: 250, electronics: 200, data: 50 },
  costIncrease: { steel: 125, electronics: 100, data: 25 },
  consumes: { energy: 25 },

  combat: {
    projectileSpeed: 0.5,
    projectileColor: '#0984e3',
    droneSpeed: 0.06,
    droneAttackRange: 1.5,
    droneFireChance: 0.88,
    maxDronesBase: 1,
    maxDronesPerLevel: 1,
  },

  techTree: {
    id: 'drones',
    killCost: 50,
    tier: 4,
    shortDescription: 'Autonome Angriffsdrohnen',
  },

  order: 7,
};
