import { TileType, ModuleType } from '../types';
import type { ModuleConfig } from '../types';

export const CHAIN_CONFIG: ModuleConfig = {
  id: ModuleType.CHAIN,
  name: 'Kettenblitz',
  description: 'Trifft 2 Extra-Ziele (30% Dmg)',
  color: '#a29bfe',
  cost: { steel: 100, electronics: 80 },
  appliesTo: [
    TileType.TURRET, TileType.HEAVY_TURRET, TileType.TESLA_COIL,
    TileType.PLASMA_CANNON, TileType.LASER_TURRET, TileType.DRONE_HANGAR,
  ],
  requiresUnlock: TileType.TESLA_COIL,
  hooks: {
    onHit(event) {
      const chainDmg = event.damage * 0.3;
      const maxTargets = 2;
      const chainRange = 3;
      let count = 0;
      for (const e of event.game.enemies) {
        if (e.id === event.enemy.id || count >= maxTargets) continue;
        const dist = Math.sqrt(Math.pow(e.x - event.enemy.x, 2) + Math.pow(e.y - event.enemy.y, 2));
        if (dist <= chainRange) {
          e.health -= chainDmg;
          // Chain lightning visual
          event.game.laserBeams.push({
            fromX: event.enemy.x, fromY: event.enemy.y,
            toX: e.x, toY: e.y, color: '#a29bfe', width: 1.5,
          });
          event.game.addParticle({
            x: e.x, y: e.y, vx: 0, vy: -0.02, life: 8, color: '#a29bfe',
          });
          count++;
        }
      }
    },
  },
};
