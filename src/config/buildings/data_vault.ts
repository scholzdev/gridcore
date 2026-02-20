import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const DATA_VAULT_CONFIG: BuildingConfig = {
  id: TileType.DATA_VAULT,
  name: 'Datentresor',
  description: 'Verstärkt Geschützschaden +15%. Verbraucht Energie+Daten.',
  color: '#00cec9',
  category: 'research',

  health: 1500,
  cost: { steel: 300, electronics: 200, data: 150 },
  costIncrease: { steel: 150, electronics: 100, data: 75 },
  consumes: { energy: 15 },

  support: {
    damageBuff: 0.15,
  },

  techTree: {
    id: 'vault',
    killCost: 200,
    tier: 4,
    shortDescription: '+15% Geschützschaden global',
  },

  order: 2,
};
