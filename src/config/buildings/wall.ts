import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const WALL_CONFIG: BuildingConfig = {
  id: TileType.WALL,
  name: 'Schwere Mauer',
  description: 'Hohe HP-Barriere. Blockiert Gegner.',
  color: '#576574',
  category: 'infrastructure',
  starter: true,

  health: 1250,
  cost: { scrap: 15 },
  costIncrease: { scrap: 5 },

  order: 3,
};
