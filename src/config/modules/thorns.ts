import { TileType, ModuleType } from '../types';
import type { ModuleConfig } from '../types';

export const THORNS_CONFIG: ModuleConfig = {
  id: ModuleType.THORNS,
  name: 'Dornen',
  description: 'Reflektiert 15% des erlittenen Schadens an Angreifer',
  color: '#d63031',
  cost: { steel: 60, scrap: 40 },
  appliesTo: [
    TileType.WALL, TileType.CORE,
    TileType.SHIELD_GENERATOR, TileType.REPAIR_BAY,
  ],
  requiresUnlock: TileType.WALL,
  // Thorns logic is handled directly in Combat.ts moveEnemies
  // because it needs to damage the attacking enemy, which hooks can't do.
  hooks: {},
};
