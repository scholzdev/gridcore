import { TileType, ModuleType } from '../types';
import type { ModuleConfig } from '../types';

export const CRITICAL_HIT_CONFIG: ModuleConfig = {
  id: ModuleType.CRITICAL_HIT,
  name: 'Kritischer Treffer',
  description: '15% Chance auf 3× Schaden',
  color: '#d63031',
  cost: { steel: 80, electronics: 60, data: 30 },
  appliesTo: [
    TileType.TURRET, TileType.HEAVY_TURRET, TileType.TESLA_COIL,
    TileType.PLASMA_CANNON, TileType.LASER_TURRET, TileType.DRONE_HANGAR,
  ],
  requiresUnlock: TileType.PLASMA_CANNON,
  hooks: {
    onHit(event) {
      if (Math.random() < 0.15) {
        event.damage *= 3;
        // Gold damage number for crits
        event.game.addDamageNumber(event.enemy.x, event.enemy.y - 0.3, event.damage, '#f1c40f');
      }
    },
  },
};
