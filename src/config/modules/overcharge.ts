import { TileType, ModuleType } from '../types';
import type { ModuleConfig } from '../types';

export const OVERCHARGE_CONFIG: ModuleConfig = {
  id: ModuleType.OVERCHARGE,
  name: 'Überladung',
  description: '+60% Einkommen',
  color: '#f39c12',
  cost: { electronics: 80, data: 50 },
  appliesTo: [
    TileType.SOLAR_PANEL, TileType.MINER, TileType.FOUNDRY, TileType.FABRICATOR,
    TileType.LAB, TileType.RECYCLER, TileType.CRYSTAL_DRILL, TileType.STEEL_SMELTER,
  ],
  requiresUnlock: TileType.RECYCLER,
  hooks: {
    onResourceGained(event) {
      const m = event.game.researchBuffs.moduleEffectMult;
      event.incomeMult *= 1 + 0.6 * m;
    },
  },
};
