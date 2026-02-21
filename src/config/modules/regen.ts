import { TileType, ModuleType } from '../types';
import type { ModuleConfig } from '../types';

export const REGEN_CONFIG: ModuleConfig = {
  id: ModuleType.REGEN,
  name: 'Regeneration',
  description: 'Selbstheilung 2% HP/s',
  color: '#00b894',
  cost: { steel: 40, electronics: 30 },
  appliesTo: [
    TileType.WALL, TileType.CORE,
    TileType.SOLAR_PANEL, TileType.MINER, TileType.FOUNDRY, TileType.FABRICATOR,
    TileType.LAB, TileType.RECYCLER, TileType.CRYSTAL_DRILL, TileType.STEEL_SMELTER,
    TileType.REPAIR_BAY, TileType.SHIELD_GENERATOR,
  ],
  requiresUnlock: TileType.REPAIR_BAY,
  hooks: {
    onTick(event) {
      const m = event.game.researchBuffs.moduleEffectMult;
      event.healAmount += event.building.maxHealth * 0.02 * m;
    },
  },
};
