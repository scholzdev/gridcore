import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const LASER_TURRET_CONFIG: BuildingConfig = {
  id: TileType.LASER_TURRET,
  name: 'Laserturm',
  description: 'Kontinuierlicher Laserstrahl. Schaden steigt mit Fokuszeit bis 3×.',
  color: '#e84393',
  category: 'defense',

  health: 1500,
  range: 8,
  damage: 25,
  cost: { steel: 400, electronics: 200 },
  costIncrease: { steel: 100, electronics: 75 },
  consumes: { energy: 25 },

  combat: {
    fireChance: 0.9,
    beamColor: '#e84393',
    focusMultMax: 3,
    focusMultRate: 0.02,
  },

  techTree: {
    id: 'laser',
    killCost: 25,
    tier: 3,
    shortDescription: 'Strahl mit Aufladung',
  },

  order: 5,
};
