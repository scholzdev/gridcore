import { TileType, ModuleType } from '../types';
import type { ModuleConfig } from '../types';

export const EFFICIENCY_CONFIG: ModuleConfig = {
  id: ModuleType.EFFICIENCY,
  name: 'Effizienz',
  description: '-50% Verbrauch',
  color: '#2ecc71',
  cost: { electronics: 50, data: 30 },
  appliesTo: [
    TileType.SOLAR_PANEL, TileType.MINER, TileType.FOUNDRY, TileType.FABRICATOR,
    TileType.LAB, TileType.RECYCLER, TileType.CRYSTAL_DRILL, TileType.STEEL_SMELTER,
    TileType.SHIELD_GENERATOR, TileType.DATA_VAULT,
  ],
  requiresUnlock: TileType.FABRICATOR,
  hooks: {
    onTick(event) {
      event.consumeMult *= 0.5;
    },
  },
};
