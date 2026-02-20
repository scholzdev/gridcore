import { TileType, ModuleType } from '../types';
import type { ModuleConfig } from '../types';

export const WALL_SLOW_CONFIG: ModuleConfig = {
  id: ModuleType.WALL_SLOW,
  name: 'Haftfeld',
  description: 'Angreifende Gegner werden um 30% verlangsamt (4s)',
  color: '#74b9ff',
  cost: { steel: 50, electronics: 30 },
  appliesTo: [
    TileType.WALL, TileType.CORE,
    TileType.SHIELD_GENERATOR,
  ],
  requiresUnlock: TileType.SLOW_FIELD,
  // Slow logic is handled directly in Combat.ts moveEnemies
  hooks: {},
};
