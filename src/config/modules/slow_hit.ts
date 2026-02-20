import { TileType, ModuleType } from '../types';
import type { ModuleConfig } from '../types';

export const SLOW_HIT_CONFIG: ModuleConfig = {
  id: ModuleType.SLOW_HIT,
  name: 'Verlangsamung',
  description: 'Getroffene -30% Speed (3s)',
  color: '#81ecec',
  cost: { electronics: 60, data: 40 },
  appliesTo: [
    TileType.TURRET, TileType.HEAVY_TURRET, TileType.TESLA_COIL,
    TileType.PLASMA_CANNON, TileType.LASER_TURRET, TileType.DRONE_HANGAR,
  ],
  requiresUnlock: TileType.SLOW_FIELD,
  hooks: {
    onHit(event) {
      event.enemy.slowedUntil = Date.now() + 3000;
      event.enemy.slowFactor = 0.7;
    },
  },
};
