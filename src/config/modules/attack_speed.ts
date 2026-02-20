import { TileType, ModuleType } from '../types';
import type { ModuleConfig } from '../types';

export const ATTACK_SPEED_CONFIG: ModuleConfig = {
  id: ModuleType.ATTACK_SPEED,
  name: 'Schnellfeuer',
  description: '+30% Feuerrate',
  color: '#e74c3c',
  cost: { steel: 60, electronics: 40 },
  appliesTo: [
    TileType.TURRET, TileType.HEAVY_TURRET, TileType.TESLA_COIL,
    TileType.PLASMA_CANNON, TileType.LASER_TURRET, TileType.DRONE_HANGAR,
  ],
  requiresUnlock: TileType.HEAVY_TURRET,
  hooks: {
    onCombatTick(event) {
      event.fireChance += -0.03;
    },
  },
};
