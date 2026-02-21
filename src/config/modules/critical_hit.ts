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
        const m = event.game.researchBuffs.moduleEffectMult;
        event.damage *= 1 + 2 * m;
        // Mark as crit so caller shows gold color (no extra damage number here)
        (event as any)._isCrit = true;
      }
    },
  },
};
