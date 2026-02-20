import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const REPAIR_BAY_CONFIG: BuildingConfig = {
  id: TileType.REPAIR_BAY,
  name: 'Reparaturbucht',
  description: 'Repariert Gebäude im Bereich. Reichweite 3. Verbraucht Energie.',
  color: '#e056a0',
  category: 'infrastructure',

  health: 600,
  range: 3,
  cost: { scrap: 80, energy: 30 },
  costIncrease: { scrap: 30, energy: 10 },
  consumes: { energy: 10 },

  support: {
    healPerTick: 50,
  },

  techTree: {
    id: 'repair',
    killCost: 5,
    tier: 1,
    shortDescription: 'Repariert Gebäude im Bereich',
  },

  order: 6,
};
