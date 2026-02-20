import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const MINER_CONFIG: BuildingConfig = {
  id: TileType.MINER,
  name: 'Schrottbohrer',
  description: 'Baut Schrott aus Erz ab. Auf Erzvorkommen platzieren.',
  color: '#9b59b6',
  category: 'infrastructure',
  starter: true,
  requiresOre: true,

  health: 500,
  cost: { scrap: 40, energy: 10 },
  costIncrease: { scrap: 15, energy: 5 },
  income: { scrap: 25 },

  order: 2,
};
