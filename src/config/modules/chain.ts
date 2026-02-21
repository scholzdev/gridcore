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
      const m = event.game.researchBuffs.moduleEffectMult;
      const chainDmg = event.damage * 0.3 * m;
      const maxTargets = 2;
      const chainRange = 3;
      let count = 0;
      const killed: typeof event.game.enemies = [];
      for (const e of event.game.enemies) {
        if (e.id === event.enemy.id || count >= maxTargets) continue;
        const dist = Math.sqrt(Math.pow(e.x - event.enemy.x, 2) + Math.pow(e.y - event.enemy.y, 2));
        if (dist <= chainRange) {
          e.health -= chainDmg;
          event.game.addDamageNumber(e.x, e.y, chainDmg, '#a29bfe');
          if (e.health <= 0) {
            killed.push(e);
          }
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
      // Remove chain-killed enemies and award kills
      if (killed.length > 0) {
        const killedIds = new Set(killed.map(e => e.id));
        event.game.enemies = event.game.enemies.filter(e => !killedIds.has(e.id));
        for (const e of killed) {
          e.dead = true;
          event.game.enemiesKilled++;
          event.game.killPoints++;
          if (event.game.gameMode === 'wellen') (event.game as any).onWaveEnemyKilled();
          if (event.building) {
            event.game.addTileKill(event.building.x, event.building.y);
          }
          // Kill reward
          const rewardBase = 15 + event.game.gameTime * 0.1;
          event.game.resources.add({ scrap: Math.floor(rewardBase) });
        }
      }
    },
  },
};
