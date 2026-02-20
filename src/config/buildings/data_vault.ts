import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const DATA_VAULT_CONFIG: BuildingConfig = {
  id: TileType.DATA_VAULT,
  name: 'Datentresor',
  description: 'Verstärkt Geschützschaden +15%. Verbraucht Energie+Daten.',
  color: '#00cec9',
  category: 'research',

  health: 1500,
  cost: { steel: 200, electronics: 150, data: 100 },
  costIncrease: { steel: 100, electronics: 75, data: 50 },
  consumes: { energy: 25, data: 10 },

  support: {
    damageBuff: 0.15,
  },

  techTree: {
    id: 'vault',
    killCost: 50,
    tier: 4,
    shortDescription: '+15% Geschützschaden global',
  },

  order: 2,
};
