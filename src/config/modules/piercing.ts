import { TileType, ModuleType } from '../types';
import type { ModuleConfig } from '../types';

export const PIERCING_CONFIG: ModuleConfig = {
  id: ModuleType.PIERCING,
  name: 'Panzerbrechend',
  description: 'Ignoriert 50% Schild',
  color: '#636e72',
  cost: { steel: 70, electronics: 50 },
  appliesTo: [
    TileType.TURRET, TileType.HEAVY_TURRET, TileType.TESLA_COIL,
    TileType.PLASMA_CANNON, TileType.LASER_TURRET, TileType.DRONE_HANGAR,
  ],
  requiresUnlock: TileType.LASER_TURRET,
  hooks: {
    onHit(event) {
      // Bypass shield scaled by moduleEffectMult
      if (event.enemy.enemyShield && event.enemy.enemyShield > 0) {
        const m = event.game.researchBuffs.moduleEffectMult;
        const bypass = Math.min(event.damage * 0.5 * m, event.enemy.enemyShield);
        event.enemy.enemyShield -= bypass;
        event.damage += bypass;
      }
    },
  },
};
