import { TileType, ModuleType } from '../types';
import type { ModuleConfig } from '../types';

export const DAMAGE_AMP_CONFIG: ModuleConfig = {
  id: ModuleType.DAMAGE_AMP,
  name: 'Schadensverstärker',
  description: '+40% Schaden',
  color: '#e67e22',
  cost: { steel: 80, electronics: 60 },
  appliesTo: [
    TileType.TURRET, TileType.HEAVY_TURRET, TileType.TESLA_COIL,
    TileType.PLASMA_CANNON, TileType.LASER_TURRET, TileType.DRONE_HANGAR,
  ],
  requiresUnlock: TileType.HEAVY_TURRET,
  hooks: {
    onCombatTick(event) {
      event.damage *= 1.4;
    },
  },
};
