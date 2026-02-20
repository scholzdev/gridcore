import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const QUANTUM_FACTORY_CONFIG: BuildingConfig = {
  id: TileType.QUANTUM_FACTORY,
  name: 'Quantenfabrik',
  description: 'Produziert alle Ressourcen gleichzeitig: Stahl, Elektronik und Daten.',
  color: '#7209b7',
  category: 'processing',

  health: 3500,
  cost: { steel: 500, electronics: 400, data: 300 },
  costIncrease: { steel: 250, electronics: 200, data: 150 },
  consumes: { energy: 25 },

  income: {
    steel: 15,
    electronics: 10,
    data: 8,
  },

  techTree: {
    id: 'quantum_factory',
    killCost: 75,
    tier: 5,
    shortDescription: 'Produziert Stahl + Elektronik + Daten',
  },

  order: 5,
};
