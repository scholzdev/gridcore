import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const ION_CANNON_CONFIG: BuildingConfig = {
  id: TileType.ION_CANNON,
  name: 'Ionenkanone',
  description: 'Fokussierter Energiestrahl. Schaden steigt bis 5× mit Aufladung. Hohe Reichweite.',
  color: '#00b4d8',
  category: 'defense',

  health: 4000,
  range: 15,
  damage: 120,
  cost: { steel: 700, electronics: 500, data: 350 },
  costIncrease: { steel: 350, electronics: 250, data: 175 },
  consumes: { energy: 35, data: 3 },

  combat: {
    fireChance: 0.85,
    beamColor: '#00b4d8',
    focusMultMax: 5,
    focusMultRate: 0.015,
  },

  techTree: {
    id: 'ion_cannon',
    killCost: 75,
    tier: 5,
    shortDescription: 'Strahl mit 5× Aufladung',
  },

  order: 11,
};
