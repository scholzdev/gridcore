import { TileType, ModuleType } from '../types';
import type { ModuleConfig } from '../types';

export const DOUBLE_YIELD_CONFIG: ModuleConfig = {
  id: ModuleType.DOUBLE_YIELD,
  name: 'Doppelertrag',
  description: '20% Chance doppelter Output',
  color: '#ffeaa7',
  cost: { electronics: 100, data: 60 },
  appliesTo: [
    TileType.SOLAR_PANEL, TileType.MINER, TileType.FOUNDRY, TileType.FABRICATOR,
    TileType.LAB, TileType.RECYCLER, TileType.CRYSTAL_DRILL, TileType.STEEL_SMELTER,
  ],
  requiresUnlock: TileType.LAB,
  hooks: {
    onResourceGained(event) {
      if (Math.random() < 0.2) {
        event.incomeMult *= 2;
      }
    },
  },
};
