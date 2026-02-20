import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const ENERGY_RELAY_CONFIG: BuildingConfig = {
  id: TileType.ENERGY_RELAY,
  name: 'Energierelais',
  description: 'Erhöht Feuerrate aller Geschütze im Bereich. Reichweite 5. Verbraucht Energie.',
  color: '#f9ca24',
  category: 'support',

  health: 700,
  range: 5,
  cost: { steel: 150, electronics: 100, data: 50 },
  costIncrease: { steel: 75, electronics: 50, data: 25 },
  consumes: { energy: 20 },

  support: {
    fireRateBuffBase: 0.04,
    fireRateBuffPerLevel: 0.01,
  },

  techTree: {
    id: 'relay',
    killCost: 50,
    tier: 4,
    shortDescription: 'Erhöht Geschütz-Feuerrate',
  },

  order: 4,
};
