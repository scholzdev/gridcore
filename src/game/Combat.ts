import { TileType, BUILDING_STATS, BUILDING_REGISTRY, ORE_BUILDINGS, getLevelMult, ModuleType } from '../config';
import type { BuildingConfig } from '../config';
import type { Enemy } from './types';
import { KILL_REWARD, ENEMY_TYPES } from './types';
import type { GameEngine } from './Engine';
import { fireOnKill, fireOnHit, fireOnCombatTick, fireOnDestroyed, fireOnEnterKillRange, fireOnAllyDamaged, fireOnAuraTick, buildingRef } from './HookSystem';
import { playKillThrottled, playShootThrottled, playCoreHit, playGameOver } from './Sound';
import { isAbilityActive } from './Abilities';
import {
  THORNS_REFLECT_FRACTION, WALL_SLOW_DURATION_MS, WALL_SLOW_FACTOR,
  ABSORBER_RANGE, ABSORBER_DAMAGE_MULT, PROJECTILE_HIT_THRESHOLD,
  PATHFINDING_WAYPOINT_THRESHOLD,
} from '../constants';

// Throttle core-hit so it doesn't spam
let lastCoreHitTime = 0;
function playCoreHitThrottled() {
  const now = performance.now();
  if (now - lastCoreHitTime < 500) return;
  lastCoreHitTime = now;
  playCoreHit();
}

/** Update turret facing angle and spawn a muzzle flash particle */
function turretFired(engine: GameEngine, tx: number, ty: number, targetX: number, targetY: number) {
  const angle = Math.atan2(targetY - (ty + 0.5), targetX - (tx + 0.5));
  if (engine.turretAngles[ty]?.[tx] !== undefined) {
    engine.turretAngles[ty][tx] = angle;
  }
  engine.muzzleFlashes.push({ x: tx + 0.5, y: ty + 0.5, life: 6 });
}

/** Apply enemy shield absorption — returns the HP damage after shield */
function applyShield(engine: GameEngine, enemy: Enemy, damage: number): number {
  if (enemy.enemyShield && enemy.enemyShield > 0) {
    const absorbed = Math.min(damage, enemy.enemyShield);
    enemy.enemyShield -= absorbed;
    damage -= absorbed;
    if (absorbed > 0) engine.addDamageNumber(enemy.x, enemy.y - 0.3, absorbed, '#3498db');
  }
  return damage;
}

function killEnemy(engine: GameEngine, enemy: Enemy, sourceX?: number, sourceY?: number) {
  if (enemy.dead) return; // Already killed this tick — prevent double-counting
  enemy.dead = true;
  playKillThrottled();
  engine.enemiesKilled++;
  engine.killPoints++;
  const typeDef = ENEMY_TYPES[enemy.enemyType || 'normal'];
  const killReward = Math.floor((KILL_REWARD.base + engine.gameTime * KILL_REWARD.perSecond) * typeDef.rewardMult);
  engine.resources.add({ scrap: killReward });
  if (engine.gameMode === 'wellen') engine.onWaveEnemyKilled();
  if (sourceX !== undefined && sourceY !== undefined) {
    engine.addTileKill(sourceX, sourceY);
    fireOnKill(engine, sourceX, sourceY, enemy);
  }
  // Explosion effect — burst of particles with size, gravity & enemy-tinted colors
  const typeDef2 = ENEMY_TYPES[enemy.enemyType || 'normal'];
  const baseColors = ['#e74c3c', '#f39c12', '#fdcb6e', '#d63031', '#ff7675'];
  const count = typeDef2.type === 'boss' ? 24 : 14 + Math.floor(Math.random() * 6);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.4;
    const speed = 0.03 + Math.random() * 0.07;
    const color = i % 3 === 0 ? typeDef2.color : baseColors[Math.floor(Math.random() * baseColors.length)];
    engine.particles.push({
      x: enemy.x, y: enemy.y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      life: 18 + Math.floor(Math.random() * 14),
      color,
      size: 1.5 + Math.random() * 3,
      gravity: 0.001 + Math.random() * 0.001,
    });
  }
}

export function detonateMines(engine: GameEngine) {
  const toDetonate: { x: number; y: number }[] = [];
  engine.enemies.forEach(e => {
    const tx = Math.floor(e.x);
    const ty = Math.floor(e.y);
    if (tx >= 0 && ty >= 0 && tx < engine.grid.size && ty < engine.grid.size) {
      if (engine.grid.tiles[ty][tx] === TileType.MINEFIELD) {
        if (!toDetonate.find(m => m.x === tx && m.y === ty)) {
          toDetonate.push({ x: tx, y: ty });
          fireOnEnterKillRange(engine, tx, ty, e, 0, 1);
        }
      }
    }
  });

  toDetonate.forEach(mine => {
    const level = engine.grid.levels[mine.y][mine.x] || 1;
    const mult = getLevelMult(level);
    const cfg = BUILDING_REGISTRY[TileType.MINEFIELD];
    const blastRadius = cfg?.combat?.blastRadius ?? 2.5;
    const mineDmg = (BUILDING_STATS[TileType.MINEFIELD]?.damage || 250) * mult * engine.prestigeDamageMult;
    engine.enemies.forEach(e => {
      const dist = Math.sqrt(Math.pow(e.x - mine.x - 0.5, 2) + Math.pow(e.y - mine.y - 0.5, 2));
      if (dist <= blastRadius) {
        const mineAfterShield = applyShield(engine, e, mineDmg);
        e.health -= mineAfterShield;
        engine.addDamageNumber(e.x, e.y, mineAfterShield, '#d63031');
        engine.addTileDamage(mine.x, mine.y, mineAfterShield);
        // Track which mine hit this enemy (for kill attribution)
        if (!(e as any)._mineSource) (e as any)._mineSource = { x: mine.x, y: mine.y };
      }
    });
    engine.grid.tiles[mine.y][mine.x] = TileType.EMPTY;
    engine.grid.levels[mine.y][mine.x] = 0;
    engine.grid.healths[mine.y][mine.x] = 0;
    engine.grid.shields[mine.y][mine.x] = 0;
    engine.grid.modules[mine.y][mine.x] = 0;
    if (engine.purchasedCounts[TileType.MINEFIELD] > 0) engine.purchasedCounts[TileType.MINEFIELD]--;
    engine.cleanupTile(mine.x, mine.y);
    // Big mine explosion
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 / 20) * i + (Math.random() - 0.5) * 0.2;
      const speed = 0.05 + Math.random() * 0.08;
      const colors = ['#d63031', '#e17055', '#fdcb6e', '#ff7675', '#fab1a0'];
      engine.particles.push({ x: mine.x + 0.5, y: mine.y + 0.5, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 20 + Math.floor(Math.random() * 10), color: colors[Math.floor(Math.random() * colors.length)] });
    }
  });

  if (toDetonate.length > 0) {
    engine.grid.invalidatePaths();
    const deadEnemies = engine.enemies.filter(e => e.health <= 0);
    engine.enemies = engine.enemies.filter(e => e.health > 0);
    deadEnemies.forEach(e => {
      const src = (e as any)._mineSource || toDetonate[0];
      killEnemy(engine, e, src.x, src.y);
    });
  }
}

// Module-level aura cache — computed per frame in turretLogic, read by updateDrones
let _fireRateBuff: number[][] = [];

export function turretLogic(engine: GameEngine) {
  const size = engine.grid.size;

  // Compute radar range buff per tile (config-driven: any building with radarRangeBuffBase)
  const radarBuff: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
  // Compute fire rate buff per tile (config-driven: any building with fireRateBuffBase)
  const fireRateBuff: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const tCfg = BUILDING_REGISTRY[engine.grid.tiles[y][x]];
      if (!tCfg?.support || !engine.activeTiles[y]?.[x]) continue;
      const level = engine.grid.levels[y][x] || 1;
      const buffRange = tCfg.range || 5;

      if (tCfg.support.radarRangeBuffBase) {
        const rangeBuff = tCfg.support.radarRangeBuffBase + (level - 1) * (tCfg.support.radarRangeBuffPerLevel ?? 1);
        for (let dy = -buffRange; dy <= buffRange; dy++) {
          for (let dx = -buffRange; dx <= buffRange; dx++) {
            const nx = x + dx; const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
            if (Math.sqrt(dx * dx + dy * dy) > buffRange) continue;
            radarBuff[ny][nx] = Math.max(radarBuff[ny][nx], rangeBuff);
          }
        }
      }

      if (tCfg.support.fireRateBuffBase) {
        const frBuff = tCfg.support.fireRateBuffBase + (level - 1) * (tCfg.support.fireRateBuffPerLevel ?? 0);
        for (let dy = -buffRange; dy <= buffRange; dy++) {
          for (let dx = -buffRange; dx <= buffRange; dx++) {
            const nx = x + dx; const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
            if (Math.sqrt(dx * dx + dy * dy) > buffRange) continue;
            fireRateBuff[ny][nx] = Math.max(fireRateBuff[ny][nx], frBuff);
          }
        }
      }
    }
  }

  // Cache for updateDrones
  _fireRateBuff = fireRateBuff;

  engine.laserBeams = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const type = engine.grid.tiles[y][x];
      const cfg = BUILDING_REGISTRY[type];
      if (!cfg?.combat) continue;

      // Skip contact-detonation buildings (e.g. Minefield) — handled by detonateMines()
      if (cfg.combat.blastRadius) continue;

      // Pulse-based AoE (e.g. Shockwave Tower) — fires every N ticks
      if (cfg.combat.pulseRadius) {
        const interval = cfg.combat.pulseInterval ?? 5;
        if (engine.gameTime % interval !== 0) continue;
        if (cfg.consumes?.energy && !engine.activeTiles[y]?.[x]) continue;
        const level = engine.grid.levels[y][x] || 1;
        const mult = getLevelMult(level);
        const pulseDmg = (BUILDING_STATS[type].damage!) * mult * engine.dataVaultBuff * engine.prestigeDamageMult;
        const pulseR = cfg.combat.pulseRadius;
        let hitAny = false;
        const pulseKilled: Enemy[] = [];
        for (const e of engine.enemies) {
          const dist = Math.sqrt(Math.pow(e.x - x, 2) + Math.pow(e.y - y, 2));
          if (dist <= pulseR) {
            const dmgAfterShield = applyShield(engine, e, pulseDmg);
            e.health -= dmgAfterShield;
            hitAny = true;
            engine.addDamageNumber(e.x, e.y, dmgAfterShield, cfg.color);
            if (e.health <= 0) {
              pulseKilled.push(e);
            } else {
              fireOnHit(engine, x, y, e, pulseDmg, false, 0);
            }
          }
        }
        // Remove dead enemies from pulse damage
        if (pulseKilled.length > 0) {
          const killedIds = new Set(pulseKilled.map(e => e.id));
          engine.enemies = engine.enemies.filter(e => !killedIds.has(e.id));
          pulseKilled.forEach(e => killEnemy(engine, e, x, y));
        }
        if (hitAny) {
          // Visual: shockwave ring
          engine.projectiles.push({
            x, y, tx: x, ty: y, speed: 0,
            color: cfg.color, damage: 0, splash: pulseR,
            active: true, age: 0, maxAge: 1,
          } as any);
        }
        continue;
      }

      // Line-beam (Annihilator) — fires a devastating beam hitting all enemies along a line
      if (cfg.combat.lineBeam) {
        const interval = cfg.combat.lineBeamInterval ?? 10;
        if (engine.gameTime % interval !== 0) continue;
        if (cfg.consumes?.energy && !engine.activeTiles[y]?.[x]) continue;
        if (engine.enemies.length === 0) continue;

        const level = engine.grid.levels[y][x] || 1;
        const mult = getLevelMult(level);
        const beamDmg = (BUILDING_STATS[type].damage!) * mult * engine.dataVaultBuff * engine.prestigeDamageMult;

        // Pick the closest enemy as target direction
        let closest = engine.enemies[0];
        let closestDist = Infinity;
        for (const e of engine.enemies) {
          const d = Math.sqrt(Math.pow(e.x - x, 2) + Math.pow(e.y - y, 2));
          if (d < closestDist) { closestDist = d; closest = e; }
        }

        // Direction vector from tower to target
        const dirX = closest.x - x;
        const dirY = closest.y - y;
        const dirLen = Math.sqrt(dirX * dirX + dirY * dirY);
        if (dirLen < 0.01) continue;
        turretFired(engine, x, y, closest.x, closest.y);
        const nDirX = dirX / dirLen;
        const nDirY = dirY / dirLen;

        // Hit all enemies within 1.5 tiles of the beam line
        const beamWidth = 1.5;
        const beamKilled: Enemy[] = [];
        for (const e of engine.enemies) {
          // Project enemy position onto beam line
          const ex = e.x - x;
          const ey = e.y - y;
          const dot = ex * nDirX + ey * nDirY;
          if (dot < 0) continue; // behind the tower
          // Perpendicular distance from enemy to beam line
          const perpX = ex - dot * nDirX;
          const perpY = ey - dot * nDirY;
          const perpDist = Math.sqrt(perpX * perpX + perpY * perpY);
          if (perpDist <= beamWidth) {
            const dmgAfterShield = applyShield(engine, e, beamDmg);
            e.health -= dmgAfterShield;
            engine.addDamageNumber(e.x, e.y, dmgAfterShield, cfg.color);
            if (e.health <= 0) {
              beamKilled.push(e);
            } else {
              fireOnHit(engine, x, y, e, beamDmg, true, 0);
            }
          }
        }
        // Remove dead enemies from beam damage
        if (beamKilled.length > 0) {
          const killedIds = new Set(beamKilled.map(e => e.id));
          engine.enemies = engine.enemies.filter(e => !killedIds.has(e.id));
          beamKilled.forEach(e => killEnemy(engine, e, x, y));
        }

        // Visual: laser beam across map
        const beamEnd = 50; // extend beam far
        engine.laserBeams.push({
          fromX: x + 0.5, fromY: y + 0.5,
          toX: x + 0.5 + nDirX * beamEnd, toY: y + 0.5 + nDirY * beamEnd,
          color: cfg.color, width: 4,
        });
        continue;
      }

      // Skip unpowered turrets that consume energy
      if (cfg.consumes?.energy && !engine.activeTiles[y]?.[x]) continue;

      // Artillery requires nearby radar coverage to fire
      if (type === TileType.ARTILLERY && radarBuff[y][x] <= 0) continue;

      const level = engine.grid.levels[y][x] || 1;
      const stats = BUILDING_STATS[type];
      const mod = engine.grid.modules[y][x];
      const baseRange = (stats.range || 6) + radarBuff[y][x] + engine.researchBuffs.rangeBuff;
      const mult = getLevelMult(level);
      const baseDmg = (stats.damage!) * mult * engine.dataVaultBuff * engine.prestigeDamageMult;
      let baseFireChance = (cfg.combat.fireChance ?? 0.9) - fireRateBuff[y][x];

      // Research: fire rate improvement (fireRateMult < 1 means faster firing)
      baseFireChance *= engine.researchBuffs.fireRateMult;

      // Overcharge ability: double fire rate (halve fireChance threshold)
      if (isAbilityActive(engine.abilities, 'overcharge')) {
        baseFireChance *= 0.5;
      }

      // Overcharge map event: 50% faster fire rate
      const eventBoost = (engine as any)._eventFireRateBoost || 0;
      if (eventBoost > 0) {
        baseFireChance *= (1 - eventBoost);
      }

      // Fire onCombatTick — hooks (building + module) can mutate damage, fireChance, effectiveRange
      const inRange = engine.enemies.filter(e => Math.sqrt(Math.pow(e.x - x, 2) + Math.pow(e.y - y, 2)) <= baseRange);
      const ctEvent = fireOnCombatTick(engine, x, y, engine.gameTime, inRange, baseRange, baseDmg, baseFireChance);
      const effectiveRange = ctEvent.effectiveRange;
      const dmg = ctEvent.damage;
      const fireChance = ctEvent.fireChance;

      // Config-driven dispatch: check combat properties instead of TileType
      if (cfg.combat.maxTargetsBase) {
        fireMultiTarget(engine, x, y, effectiveRange, dmg, fireChance, level, mod, cfg);
      } else if (cfg.combat.splash) {
        fireSplash(engine, x, y, effectiveRange, dmg, fireChance, mod, cfg);
      } else if (cfg.combat.beamColor) {
        fireBeam(engine, x, y, effectiveRange, dmg, fireChance, mod, cfg);
      } else {
        fireProjectile(engine, x, y, effectiveRange, dmg, fireChance, mod, cfg);
      }
    }
  }
}

/** Multi-target projectile — fires at N closest enemies (e.g. Tesla Coil) */
function fireMultiTarget(engine: GameEngine, x: number, y: number, range: number, dmg: number, fireChance: number, level: number, mod: number, bldg: BuildingConfig) {
  const combat = bldg.combat!;
  const maxTargets = (combat.maxTargetsBase ?? 3) + level * (combat.maxTargetsPerLevel ?? 1);
  const targets = engine.enemies.filter(e => Math.sqrt(Math.pow(e.x - x, 2) + Math.pow(e.y - y, 2)) <= range);
  const selected = targets.slice(0, maxTargets);
  if (selected.length > 0 && Math.random() > fireChance) {
    playShootThrottled();
    turretFired(engine, x, y, selected[0].x, selected[0].y);
    selected.forEach(target => {
      engine.projectiles.push({
        id: Math.random().toString(36), x: x + 0.5, y: y + 0.5,
        targetX: target.x, targetY: target.y, targetId: target.id,
        speed: combat.projectileSpeed ?? 0.6, color: combat.projectileColor ?? bldg.color, damage: dmg,
        sourceX: x, sourceY: y, modType: mod
      });
    });
  }
}

/** Splash damage projectile (e.g. Plasma Cannon) */
function fireSplash(engine: GameEngine, x: number, y: number, range: number, dmg: number, fireChance: number, mod: number, bldg: BuildingConfig) {
  const combat = bldg.combat!;
  const target = engine.enemies.find(e => Math.sqrt(Math.pow(e.x - x, 2) + Math.pow(e.y - y, 2)) <= range);
  if (target && Math.random() > (fireChance + (combat.fireChanceModifier ?? 0))) {
    playShootThrottled();
    turretFired(engine, x, y, target.x, target.y);
    engine.projectiles.push({
      id: Math.random().toString(36), x: x + 0.5, y: y + 0.5,
      targetX: target.x, targetY: target.y, targetId: target.id,
      speed: combat.projectileSpeed ?? 0.3, color: combat.projectileColor ?? bldg.color, damage: dmg, splash: combat.splash,
      sourceX: x, sourceY: y, modType: mod
    });
  }
}

/** Continuous beam with focus tracking (e.g. Laser Turret) */
function fireBeam(engine: GameEngine, x: number, y: number, range: number, dmg: number, fireChance: number, mod: number, bldg: BuildingConfig) {
  const combat = bldg.combat!;
  const target = engine.enemies.find(e => Math.sqrt(Math.pow(e.x - x, 2) + Math.pow(e.y - y, 2)) <= range);
  if (target) {
    const key = `${x},${y}`;
    turretFired(engine, x, y, target.x, target.y);
    let focus = engine.laserFocus.get(key);
    if (!focus || focus.targetId !== target.id) {
      focus = { targetId: target.id, ticks: 0 };
      engine.laserFocus.set(key, focus);
    }
    focus.ticks++;
    const focusMult = Math.min(1 + focus.ticks * (combat.focusMultRate ?? 0.02), combat.focusMultMax ?? 3);
    engine.laserBeams.push({
      fromX: x + 0.5, fromY: y + 0.5, toX: target.x, toY: target.y,
      color: combat.beamColor!, width: Math.min(1 + focus.ticks * (combat.focusMultRate ?? 0.02), combat.focusMultMax ?? 3)
    });
    if (Math.random() > fireChance) {
      const baseLaserDmg = dmg * focusMult;
      const hitEvent = fireOnHit(engine, x, y, target, baseLaserDmg, false, mod);
      const laserDmg = hitEvent.damage;
      const laserAfterShield = applyShield(engine, target, laserDmg);
      target.health -= laserAfterShield;
      engine.addDamageNumber(target.x, target.y, laserAfterShield, combat.beamColor!);
      engine.addTileDamage(x, y, laserAfterShield);
      if (target.health <= 0) {
        engine.enemies = engine.enemies.filter(e => e.id !== target.id);
        killEnemy(engine, target, x, y);
        engine.laserFocus.delete(key);
      }
    }
  } else {
    engine.laserFocus.delete(`${x},${y}`);
  }
}

/** Standard single-target projectile */
function fireProjectile(engine: GameEngine, x: number, y: number, range: number, dmg: number, fireChance: number, mod: number, bldg: BuildingConfig) {
  const combat = bldg.combat;
  const target = engine.enemies.find(e => Math.sqrt(Math.pow(e.x - x, 2) + Math.pow(e.y - y, 2)) <= range);
  if (target && Math.random() > fireChance) {
    playShootThrottled();
    turretFired(engine, x, y, target.x, target.y);
    engine.projectiles.push({
      id: Math.random().toString(36), x: x + 0.5, y: y + 0.5,
      targetX: target.x, targetY: target.y, targetId: target.id,
      speed: combat?.projectileSpeed ?? 0.4, color: combat?.projectileColor ?? bldg.color,
      damage: dmg,
      sourceX: x, sourceY: y, modType: mod
    });
  }
}

function applyHitEffects(engine: GameEngine, target: Enemy, p: { damage: number; modType?: number; sourceX?: number; sourceY?: number; color: string }) {
  // Fire onHit interceptor — module hooks can modify damage, apply slow, chain, etc.
  let finalDmg = p.damage;
  let isCrit = false;
  if (p.sourceX !== undefined && p.sourceY !== undefined) {
    const hitEvent = fireOnHit(engine, p.sourceX, p.sourceY, target, p.damage, false, p.modType ?? 0);
    finalDmg = hitEvent.damage;
    isCrit = !!(hitEvent as any)._isCrit;
  }
  // Enemy shield absorbs damage first
  finalDmg = applyShield(engine, target, finalDmg);
  target.health -= finalDmg;
  engine.addDamageNumber(target.x, target.y, finalDmg, isCrit ? '#f1c40f' : p.color);
  if (p.sourceX !== undefined && p.sourceY !== undefined) {
    engine.addTileDamage(p.sourceX, p.sourceY, finalDmg);
  }
}

export function updateProjectiles(engine: GameEngine) {
  engine.projectiles = engine.projectiles.filter(p => {
    const dx = p.targetX - p.x;
    const dy = p.targetY - p.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < PROJECTILE_HIT_THRESHOLD) {
      if (p.splash && p.splash > 0) {
        const toRemove: string[] = [];
        engine.enemies.forEach(e => {
          const dist = Math.sqrt(Math.pow(e.x - p.targetX, 2) + Math.pow(e.y - p.targetY, 2));
          if (dist <= p.splash!) {
            applyHitEffects(engine, e, p);
            if (e.health <= 0) toRemove.push(e.id);
          }
        });
        toRemove.forEach(id => {
          const dead = engine.enemies.find(e => e.id === id);
          engine.enemies = engine.enemies.filter(e => e.id !== id);
          if (dead) killEnemy(engine, dead, p.sourceX, p.sourceY);
        });
        for (let i = 0; i < 12; i++) {
          const angle = (Math.PI * 2 / 12) * i;
          const speed = 0.04 + Math.random() * 0.04;
          engine.particles.push({ x: p.targetX, y: p.targetY, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 15 + Math.floor(Math.random() * 5), color: '#fd79a8' });
        }
      } else {
        const target = engine.enemies.find(e => e.id === p.targetId);
        if (target) {
          applyHitEffects(engine, target, p);
          if (target.health <= 0) {
            engine.enemies = engine.enemies.filter(e => e.id !== target.id);
            killEnemy(engine, target, p.sourceX, p.sourceY);
          }
        }
      }
      return false;
    }
    p.x += (dx / d) * p.speed;
    p.y += (dy / d) * p.speed;
    return true;
  });
}

export function updateDrones(engine: GameEngine) {
  // Remove drones whose hangar was destroyed
  engine.drones = engine.drones.filter(d => engine.grid.tiles[d.hangarY]?.[d.hangarX] === TileType.DRONE_HANGAR);

  const size = engine.grid.size;
  const droneCfg = BUILDING_REGISTRY[TileType.DRONE_HANGAR]!;
  const droneCombat = droneCfg.combat!;
  // Spawn drones for active hangars
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (engine.grid.tiles[y][x] !== TileType.DRONE_HANGAR) continue;
      if (!engine.activeTiles[y]?.[x]) continue;
      const level = engine.grid.levels[y][x] || 1;
      const maxDrones = (droneCombat.maxDronesBase ?? 1) + level * (droneCombat.maxDronesPerLevel ?? 1);
      const currentDrones = engine.drones.filter(d => d.hangarX === x && d.hangarY === y).length;
      if (currentDrones < maxDrones) {
        engine.drones.push({ id: Math.random().toString(36), x: x + 0.5, y: y + 0.5, hangarX: x, hangarY: y });
      }
    }
  }

  // Move drones + shoot
  engine.drones.forEach(d => {
    if (!engine.activeTiles[d.hangarY]?.[d.hangarX]) {
      const dx = d.hangarX + 0.5 - d.x;
      const dy = d.hangarY + 0.5 - d.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.3) { d.x += (dx / dist) * 0.03; d.y += (dy / dist) * 0.03; }
      return;
    }

    const hangarLevel = engine.grid.levels[d.hangarY]?.[d.hangarX] || 1;
    const baseHangarRange = droneCfg.range || 10;

    // Use fireOnCombatTick to let module hooks modify range/damage/fireChance for the hangar
    const hMult = getLevelMult(hangarLevel);
    const baseDroneDmg = (droneCfg.damage || 25) * hMult * engine.dataVaultBuff * engine.prestigeDamageMult;
    const baseDroneFireChance = (droneCombat.droneFireChance ?? 0.88) - (_fireRateBuff[d.hangarY]?.[d.hangarX] ?? 0);
    const droneCtEvent = fireOnCombatTick(engine, d.hangarX, d.hangarY, engine.gameTime, [], baseHangarRange, baseDroneDmg, baseDroneFireChance);
    const hangarRange = droneCtEvent.effectiveRange;

    let nearestEnemy: Enemy | null = null;
    let nearestDist = Infinity;
    engine.enemies.forEach(e => {
      const dh = Math.sqrt(Math.pow(e.x - d.hangarX - 0.5, 2) + Math.pow(e.y - d.hangarY - 0.5, 2));
      if (dh <= hangarRange) {
        const dd = Math.sqrt(Math.pow(e.x - d.x, 2) + Math.pow(e.y - d.y, 2));
        if (dd < nearestDist) { nearestDist = dd; nearestEnemy = e; }
      }
    });

    if (nearestEnemy) {
      const ne = nearestEnemy as Enemy;
      const dx = ne.x - d.x;
      const dy = ne.y - d.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.5) { d.x += (dx / dist) * (droneCombat.droneSpeed ?? 0.06); d.y += (dy / dist) * (droneCombat.droneSpeed ?? 0.06); }
      if (dist < (droneCombat.droneAttackRange ?? 1.5) && Math.random() > droneCtEvent.fireChance) {
        const dmg = droneCtEvent.damage;
        engine.projectiles.push({
          id: Math.random().toString(36), x: d.x, y: d.y,
          targetX: ne.x, targetY: ne.y, targetId: ne.id,
          speed: droneCombat.projectileSpeed ?? 0.5, color: droneCombat.projectileColor ?? '#0984e3', damage: dmg,
          sourceX: d.hangarX, sourceY: d.hangarY
        });
      }
    } else {
      const dx = d.hangarX + 0.5 - d.x;
      const dy = d.hangarY + 0.5 - d.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.3) { d.x += (dx / dist) * 0.03; d.y += (dy / dist) * 0.03; }
    }
  });
}

export function moveEnemies(engine: GameEngine, timestamp: number) {
  engine.enemies = engine.enemies.filter(e => {
    const tx = Math.floor(e.x);
    const ty = Math.floor(e.y);
    const tile = engine.grid.tiles[ty]?.[tx];

    if (tile !== undefined && tile !== TileType.EMPTY && tile !== TileType.ORE_PATCH) {
      if (engine.gameTime - e.lastHit >= 1) {
        const typeDef = ENEMY_TYPES[e.enemyType || 'normal'];
        let dmg = Math.floor(engine.diffConfig.enemyDamage * typeDef.damageMult);

        // ── Absorber module: nearby walls with ABSORBER reduce incoming damage ──
        const absorbR = ABSORBER_RANGE;
        let absorbMult = 1;
        for (let ay = Math.max(0, ty - absorbR); ay <= Math.min(engine.grid.size - 1, ty + absorbR); ay++) {
          for (let ax = Math.max(0, tx - absorbR); ax <= Math.min(engine.grid.size - 1, tx + absorbR); ax++) {
            if (ax === tx && ay === ty) continue;
            if (engine.grid.modules[ay]?.[ax] === ModuleType.ABSORBER) {
              const dist = Math.sqrt(Math.pow(ax - tx, 2) + Math.pow(ay - ty, 2));
              if (dist <= absorbR) { absorbMult = ABSORBER_DAMAGE_MULT; break; }
            }
          }
          if (absorbMult < 1) break;
        }
        dmg = Math.floor(dmg * absorbMult);

        if (engine.grid.shields[ty]?.[tx] > 0) {
          const absorbed = Math.min(dmg, engine.grid.shields[ty][tx]);
          engine.grid.shields[ty][tx] -= absorbed;
          dmg -= absorbed;
        }
        if (dmg > 0) {
          engine.grid.healths[ty][tx] -= dmg;
          engine.addDamageNumber(tx + 0.5, ty + 0.3, dmg, '#ff6b6b');
          if (tile === TileType.CORE) playCoreHitThrottled();

          // ── Thorns module: reflect 15% damage back to enemy ──
          const tileModule = engine.grid.modules[ty]?.[tx];
          if (tileModule === ModuleType.THORNS) {
            const reflectDmg = Math.floor(engine.diffConfig.enemyDamage * THORNS_REFLECT_FRACTION);
            e.health -= reflectDmg;
            engine.addDamageNumber(e.x, e.y - 0.3, reflectDmg, '#d63031');
          }

          // ── Wall Slow module: slow attacking enemy by 30% for 4s ──
          if (tileModule === ModuleType.WALL_SLOW) {
            e.slowedUntil = engine.gameTime + 4;
            e.slowFactor = WALL_SLOW_FACTOR;
          }

          // Notify nearby buildings that an ally was damaged
          const allyRef = buildingRef(engine, tx, ty);
          const scanR = 6;
          for (let sy = Math.max(0, ty - scanR); sy <= Math.min(engine.grid.size - 1, ty + scanR); sy++) {
            for (let sx = Math.max(0, tx - scanR); sx <= Math.min(engine.grid.size - 1, tx + scanR); sx++) {
              if (sx === tx && sy === ty) continue;
              const st = engine.grid.tiles[sy]?.[sx];
              if (st && st !== TileType.EMPTY && st !== TileType.ORE_PATCH) {
                fireOnAllyDamaged(engine, sx, sy, allyRef, dmg, e);
              }
            }
          }
        }
        e.lastHit = engine.gameTime;
        if (engine.grid.healths[ty][tx] <= 0) {
          fireOnDestroyed(engine, tx, ty, tile, e);
          if (tile === TileType.CORE) { engine.gameOver = true; playGameOver(); }

          // Explosion on destroy (e.g. Hyperreaktor)
          const tileCfg = BUILDING_REGISTRY[tile];
          if (tileCfg?.explosionOnDestroy) {
            const expR = tileCfg.explosionOnDestroy;
            const expDmg = tileCfg.explosionDamage ?? 1000;
            for (let ey = Math.max(0, ty - expR); ey <= Math.min(engine.grid.size - 1, ty + expR); ey++) {
              for (let ex = Math.max(0, tx - expR); ex <= Math.min(engine.grid.size - 1, tx + expR); ex++) {
                if (ex === tx && ey === ty) continue;
                const dist = Math.sqrt(Math.pow(ex - tx, 2) + Math.pow(ey - ty, 2));
                if (dist > expR) continue;
                const nType = engine.grid.tiles[ey][ex];
                if (nType !== TileType.EMPTY && nType !== TileType.ORE_PATCH) {
                  engine.grid.healths[ey][ex] -= expDmg;
                  engine.addDamageNumber(ex + 0.5, ey + 0.3, expDmg, '#ffbe0b');
                  if (engine.grid.healths[ey][ex] <= 0) {
                    fireOnDestroyed(engine, ex, ey, nType, e);
                    if (nType === TileType.CORE) { engine.gameOver = true; playGameOver(); }
                    engine.grid.tiles[ey][ex] = ORE_BUILDINGS.includes(nType) ? TileType.ORE_PATCH : TileType.EMPTY;
                    engine.grid.levels[ey][ex] = 0;
                    engine.grid.shields[ey][ex] = 0;
                    engine.grid.modules[ey][ex] = 0;
                    if (engine.purchasedCounts[nType] > 0) engine.purchasedCounts[nType]--;
                    engine.cleanupTile(ex, ey);
                  }
                }
              }
            }
            // Visual: explosion particles
            for (let i = 0; i < 20; i++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 0.05 + Math.random() * 0.1;
              engine.particles.push({
                x: tx + 0.5, y: ty + 0.5,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life: 30 + Math.random() * 20, color: '#ffbe0b',
              });
            }
          }

          engine.grid.tiles[ty][tx] = ORE_BUILDINGS.includes(tile) ? TileType.ORE_PATCH : TileType.EMPTY;
          engine.grid.levels[ty][tx] = 0;
          engine.grid.shields[ty][tx] = 0;
          engine.grid.modules[ty][tx] = 0;
          if (engine.purchasedCounts[tile] > 0) engine.purchasedCounts[tile]--;
          engine.cleanupTile(tx, ty);
          engine.grid.invalidatePaths();
        }
      }
      return true;
    }

    // Slow field check (config-driven: any building with support.slowPct)
    let slowFactor = 1;
    const scanRange = 6;
    for (let sy = Math.max(0, ty - scanRange); sy <= Math.min(engine.grid.size - 1, ty + scanRange); sy++) {
      for (let sx = Math.max(0, tx - scanRange); sx <= Math.min(engine.grid.size - 1, tx + scanRange); sx++) {
        const sCfg = BUILDING_REGISTRY[engine.grid.tiles[sy][sx]];
        if (sCfg?.support?.slowPct) {
          const level = engine.grid.levels[sy][sx] || 1;
          const auraEvt = fireOnAuraTick(engine, sx, sy, engine.gameTime, sCfg.range || 5);
          const range = auraEvt.range;
          const dist = Math.sqrt(Math.pow(e.x - sx, 2) + Math.pow(e.y - sy, 2));
          if (dist <= range) {
            const slowPct = sCfg.support.slowPct + (level - 1) * (sCfg.support.slowPctPerLevel ?? 0);
            slowFactor = Math.min(slowFactor, 1 - slowPct);
          }
        }
      }
    }

    // Slow-on-hit module — slowFactor stored on enemy by onHit hook
    const moduleSlowFactor = (e.slowedUntil && engine.gameTime < e.slowedUntil && e.slowFactor) ? e.slowFactor : 1;

    // Gravity Cannon — pull enemies toward cannon + additional slow
    let gravitySlow = 1;
    for (let sy = Math.max(0, ty - 15); sy <= Math.min(engine.grid.size - 1, ty + 15); sy++) {
      for (let sx = Math.max(0, tx - 15); sx <= Math.min(engine.grid.size - 1, tx + 15); sx++) {
        const gCfg = BUILDING_REGISTRY[engine.grid.tiles[sy][sx]];
        if (!gCfg?.support?.gravityPull || !engine.activeTiles[sy]?.[sx]) continue;
        const gRange = gCfg.range || 12;
        const dist = Math.sqrt(Math.pow(e.x - sx, 2) + Math.pow(e.y - sy, 2));
        if (dist <= gRange && dist > 0.5) {
          // Pull enemy toward cannon
          const pullStr = gCfg.support.gravityPull;
          const pdx = sx + 0.5 - e.x;
          const pdy = sy + 0.5 - e.y;
          e.x += (pdx / dist) * pullStr;
          e.y += (pdy / dist) * pullStr;
          // Apply gravity slow
          gravitySlow = Math.min(gravitySlow, 1 - (gCfg.support.gravitySlow ?? 0));
        }
      }
    }

    const dx = engine.grid.coreX + 0.5 - e.x;
    const dy = engine.grid.coreY + 0.5 - e.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    // ── Pathfinding movement ──
    let moveX = 0, moveY = 0;

    // Repath if grid changed since path was assigned
    if (e.pathGeneration !== undefined && e.pathGeneration !== engine.grid.pathGeneration) {
      const gridX = Math.min(Math.max(0, Math.floor(e.x)), engine.grid.size - 1);
      const gridY = Math.min(Math.max(0, Math.floor(e.y)), engine.grid.size - 1);
      const newPath = engine.grid.findPath(gridX, gridY);
      if (newPath && newPath.length > 0) {
        e.path = newPath;
        e.pathIndex = 0;
      } else {
        e.path = undefined;
        e.pathIndex = undefined;
      }
      e.pathGeneration = engine.grid.pathGeneration;
    }

    if (e.path && e.path.length > 0 && e.pathIndex !== undefined) {
      const wp = e.path[e.pathIndex];
      if (wp) {
        const wpDx = wp.x + 0.5 - e.x;
        const wpDy = wp.y + 0.5 - e.y;
        const wpD = Math.sqrt(wpDx * wpDx + wpDy * wpDy);
        // Advance through waypoints we've already passed
        if (wpD < PATHFINDING_WAYPOINT_THRESHOLD) {
          e.pathIndex++;
          if (e.pathIndex >= e.path.length) {
            e.path = undefined;
            e.pathIndex = undefined;
          }
        }
        if (wpD > 0.05) {
          moveX = wpDx / wpD;
          moveY = wpDy / wpD;
        }
      } else {
        // Invalid waypoint index
        e.path = undefined;
        e.pathIndex = undefined;
      }
    }
    // Fallback: beeline if no path
    if (moveX === 0 && moveY === 0 && d > 0.1) {
      moveX = dx / d;
      moveY = dy / d;
    }

    if (d > 0.1) {
      e.x += moveX * e.speed * slowFactor * moduleSlowFactor * gravitySlow;
      e.y += moveY * e.speed * slowFactor * moduleSlowFactor * gravitySlow;
    }
    return true;
  });
}

export function updateParticles(engine: GameEngine) {
  engine.particles = engine.particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.gravity) p.vy += p.gravity;
    p.life--;
    return p.life > 0;
  });
}
