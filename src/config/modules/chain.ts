import { TileType, ModuleType } from '../types';
import type { ModuleConfig } from '../types';
import { KILL_REWARD, ENEMY_TYPES } from '../../game/types';

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
          // Apply enemy shield absorption first
          let dmg = chainDmg;
          if (e.enemyShield && e.enemyShield > 0) {
            const absorbed = Math.min(dmg, e.enemyShield);
            e.enemyShield -= absorbed;
            dmg -= absorbed;
            if (absorbed > 0) event.game.addDamageNumber(e.x, e.y - 0.3, absorbed, '#3498db');
          }
          e.health -= dmg;
          event.game.addDamageNumber(e.x, e.y, dmg, '#a29bfe');
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
            // Fire onKill hooks for proper attribution
            (event.game as any).fireOnKillDirect?.(event.building.x, event.building.y, e);
          }
          // Kill reward with proper enemy type multiplier
          const typeDef = ENEMY_TYPES[e.enemyType || 'normal'];
          const killReward = Math.floor((KILL_REWARD.base + event.game.gameTime * KILL_REWARD.perSecond) * typeDef.rewardMult);
          event.game.resources.add({ scrap: killReward });
        }
      }
    },
  },
};
