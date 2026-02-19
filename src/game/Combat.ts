import { TileType, BUILDING_STATS, ModuleType } from './Grid';
import type { Enemy } from './types';
import type { GameEngine } from './Engine';

export function detonateMines(engine: GameEngine) {
  const toDetonate: { x: number; y: number }[] = [];
  engine.enemies.forEach(e => {
    const tx = Math.floor(e.x);
    const ty = Math.floor(e.y);
    if (tx >= 0 && ty >= 0 && tx < engine.grid.size && ty < engine.grid.size) {
      if (engine.grid.tiles[ty][tx] === TileType.MINEFIELD) {
        if (!toDetonate.find(m => m.x === tx && m.y === ty)) {
          toDetonate.push({ x: tx, y: ty });
        }
      }
    }
  });

  toDetonate.forEach(mine => {
    const level = engine.grid.levels[mine.y][mine.x] || 1;
    const mult = 1 + (level - 1) * 0.5;
    const mineDmg = (BUILDING_STATS[TileType.MINEFIELD]?.damage || 250) * mult;
    engine.enemies.forEach(e => {
      const dist = Math.sqrt(Math.pow(e.x - mine.x - 0.5, 2) + Math.pow(e.y - mine.y - 0.5, 2));
      if (dist <= 2.5) e.health -= mineDmg;
    });
    engine.grid.tiles[mine.y][mine.x] = TileType.EMPTY;
    engine.grid.levels[mine.y][mine.x] = 0;
    engine.grid.healths[mine.y][mine.x] = 0;
    engine.grid.shields[mine.y][mine.x] = 0;
    engine.grid.modules[mine.y][mine.x] = 0;
    if (engine.purchasedCounts[TileType.MINEFIELD] > 0) engine.purchasedCounts[TileType.MINEFIELD]--;
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i;
      engine.particles.push({ x: mine.x + 0.5, y: mine.y + 0.5, vx: Math.cos(angle) * 0.08, vy: Math.sin(angle) * 0.08, life: 20, color: '#d63031' });
    }
  });

  if (toDetonate.length > 0) {
    engine.enemies = engine.enemies.filter(e => {
      if (e.health <= 0) {
        engine.enemiesKilled++;
        engine.killPoints++;
        engine.resources.add({ scrap: 30 });
        if (engine.gameMode === 'wellen') engine.onWaveEnemyKilled();
        return false;
      }
      return true;
    });
  }
}

export function turretLogic(engine: GameEngine) {
  const size = engine.grid.size;

  // Compute radar range buff per tile
  const radarBuff: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (engine.grid.tiles[y][x] === TileType.RADAR_STATION && engine.activeTiles[y]?.[x]) {
        const level = engine.grid.levels[y][x] || 1;
        const buffRange = BUILDING_STATS[TileType.RADAR_STATION].range || 5;
        const rangeBuff = 3 + (level - 1);
        for (let dy = -buffRange; dy <= buffRange; dy++) {
          for (let dx = -buffRange; dx <= buffRange; dx++) {
            const nx = x + dx; const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
            if (Math.sqrt(dx * dx + dy * dy) > buffRange) continue;
            radarBuff[ny][nx] = Math.max(radarBuff[ny][nx], rangeBuff);
          }
        }
      }
    }
  }

  engine.laserBeams = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const type = engine.grid.tiles[y][x];
      if (type !== TileType.TURRET && type !== TileType.HEAVY_TURRET && type !== TileType.TESLA_COIL && type !== TileType.PLASMA_CANNON && type !== TileType.LASER_TURRET) continue;

      // Skip unpowered turrets
      if ((type === TileType.TESLA_COIL || type === TileType.PLASMA_CANNON || type === TileType.LASER_TURRET) && !engine.activeTiles[y]?.[x]) continue;

      const level = engine.grid.levels[y][x] || 1;
      const stats = BUILDING_STATS[type];
      const mod = engine.grid.modules[y][x];
      const effectiveRange = (stats.range || 6) + radarBuff[y][x] + (mod === ModuleType.RANGE_BOOST ? 3 : 0);
      const mult = 1 + (level - 1) * 0.5;
      const dmgMult = mod === ModuleType.DAMAGE_AMP ? 1.4 : 1;
      const dmg = (stats.damage!) * mult * engine.dataVaultBuff * dmgMult;
      const fireChance = mod === ModuleType.ATTACK_SPEED ? 0.87 : 0.9;

      if (type === TileType.TESLA_COIL) {
        fireTesla(engine, x, y, effectiveRange, dmg, fireChance, level);
      } else if (type === TileType.PLASMA_CANNON) {
        firePlasma(engine, x, y, effectiveRange, dmg, fireChance);
      } else if (type === TileType.LASER_TURRET) {
        fireLaser(engine, x, y, effectiveRange, dmg, fireChance);
      } else {
        fireNormal(engine, x, y, type, effectiveRange, dmg, fireChance);
      }
    }
  }
}

function fireTesla(engine: GameEngine, x: number, y: number, range: number, dmg: number, fireChance: number, level: number) {
  const maxTargets = 3 + level;
  const targets = engine.enemies.filter(e => Math.sqrt(Math.pow(e.x - x, 2) + Math.pow(e.y - y, 2)) <= range);
  const selected = targets.slice(0, maxTargets);
  if (selected.length > 0 && Math.random() > fireChance) {
    selected.forEach(target => {
      engine.projectiles.push({
        id: Math.random().toString(36), x: x + 0.5, y: y + 0.5,
        targetX: target.x, targetY: target.y, targetId: target.id,
        speed: 0.6, color: '#6c5ce7', damage: dmg
      });
    });
  }
}

function firePlasma(engine: GameEngine, x: number, y: number, range: number, dmg: number, fireChance: number) {
  const target = engine.enemies.find(e => Math.sqrt(Math.pow(e.x - x, 2) + Math.pow(e.y - y, 2)) <= range);
  if (target && Math.random() > (fireChance + 0.05)) {
    engine.projectiles.push({
      id: Math.random().toString(36), x: x + 0.5, y: y + 0.5,
      targetX: target.x, targetY: target.y, targetId: target.id,
      speed: 0.3, color: '#fd79a8', damage: dmg, splash: 2
    });
  }
}

function fireLaser(engine: GameEngine, x: number, y: number, range: number, dmg: number, fireChance: number) {
  const target = engine.enemies.find(e => Math.sqrt(Math.pow(e.x - x, 2) + Math.pow(e.y - y, 2)) <= range);
  if (target) {
    const key = `${x},${y}`;
    let focus = engine.laserFocus.get(key);
    if (!focus || focus.targetId !== target.id) {
      focus = { targetId: target.id, ticks: 0 };
      engine.laserFocus.set(key, focus);
    }
    focus.ticks++;
    const focusMult = Math.min(1 + focus.ticks * 0.02, 3);
    engine.laserBeams.push({
      fromX: x + 0.5, fromY: y + 0.5, toX: target.x, toY: target.y,
      color: '#e84393', width: Math.min(1 + focus.ticks * 0.02, 3)
    });
    if (Math.random() > fireChance) {
      const laserDmg = dmg * focusMult;
      target.health -= laserDmg;
      if (target.health <= 0) {
        engine.enemies = engine.enemies.filter(e => e.id !== target.id);
        engine.enemiesKilled++;
        engine.killPoints++;
        engine.resources.add({ scrap: 30 });
        if (engine.gameMode === 'wellen') engine.onWaveEnemyKilled();
        engine.laserFocus.delete(key);
      }
    }
  } else {
    engine.laserFocus.delete(`${x},${y}`);
  }
}

function fireNormal(engine: GameEngine, x: number, y: number, type: TileType, range: number, dmg: number, fireChance: number) {
  const target = engine.enemies.find(e => Math.sqrt(Math.pow(e.x - x, 2) + Math.pow(e.y - y, 2)) <= range);
  if (target && Math.random() > fireChance) {
    engine.projectiles.push({
      id: Math.random().toString(36), x: x + 0.5, y: y + 0.5,
      targetX: target.x, targetY: target.y, targetId: target.id,
      speed: 0.4, color: type === TileType.HEAVY_TURRET ? '#c0392b' : '#e67e22',
      damage: dmg
    });
  }
}

export function updateProjectiles(engine: GameEngine) {
  engine.projectiles = engine.projectiles.filter(p => {
    const dx = p.targetX - p.x;
    const dy = p.targetY - p.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 0.3) {
      if (p.splash && p.splash > 0) {
        const toRemove: string[] = [];
        engine.enemies.forEach(e => {
          const dist = Math.sqrt(Math.pow(e.x - p.targetX, 2) + Math.pow(e.y - p.targetY, 2));
          if (dist <= p.splash!) {
            e.health -= p.damage;
            if (e.health <= 0) toRemove.push(e.id);
          }
        });
        toRemove.forEach(id => {
          engine.enemies = engine.enemies.filter(e => e.id !== id);
          engine.enemiesKilled++;
          engine.killPoints++;
          engine.resources.add({ scrap: 30 });
          if (engine.gameMode === 'wellen') engine.onWaveEnemyKilled();
        });
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 / 8) * i;
          engine.particles.push({ x: p.targetX, y: p.targetY, vx: Math.cos(angle) * 0.05, vy: Math.sin(angle) * 0.05, life: 15, color: '#fd79a8' });
        }
      } else {
        const target = engine.enemies.find(e => e.id === p.targetId);
        if (target) {
          target.health -= p.damage;
          if (target.health <= 0) {
            engine.enemies = engine.enemies.filter(e => e.id !== target.id);
            engine.enemiesKilled++;
            engine.killPoints++;
            engine.resources.add({ scrap: 30 });
            if (engine.gameMode === 'wellen') engine.onWaveEnemyKilled();
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
  // Spawn drones for active hangars
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (engine.grid.tiles[y][x] !== TileType.DRONE_HANGAR) continue;
      if (!engine.activeTiles[y]?.[x]) continue;
      const level = engine.grid.levels[y][x] || 1;
      const maxDrones = 1 + level;
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
    const hMod = engine.grid.modules[d.hangarY]?.[d.hangarX] || 0;
    const hangarRange = (BUILDING_STATS[TileType.DRONE_HANGAR]?.range || 10) + (hMod === ModuleType.RANGE_BOOST ? 3 : 0);

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
      if (dist > 0.5) { d.x += (dx / dist) * 0.06; d.y += (dy / dist) * 0.06; }
      if (dist < 1.5 && Math.random() > 0.88) {
        const hMult = 1 + (hangarLevel - 1) * 0.5;
        const dmgMult = hMod === ModuleType.DAMAGE_AMP ? 1.4 : 1;
        const dmg = (BUILDING_STATS[TileType.DRONE_HANGAR]?.damage || 25) * hMult * engine.dataVaultBuff * dmgMult;
        engine.projectiles.push({
          id: Math.random().toString(36), x: d.x, y: d.y,
          targetX: ne.x, targetY: ne.y, targetId: ne.id,
          speed: 0.5, color: '#0984e3', damage: dmg,
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
      if (timestamp - e.lastHit > 1000) {
        let dmg = engine.diffConfig.enemyDamage;
        if (engine.grid.shields[ty]?.[tx] > 0) {
          const absorbed = Math.min(dmg, engine.grid.shields[ty][tx]);
          engine.grid.shields[ty][tx] -= absorbed;
          dmg -= absorbed;
        }
        if (dmg > 0) engine.grid.healths[ty][tx] -= dmg;
        e.lastHit = timestamp;
        if (engine.grid.healths[ty][tx] <= 0) {
          if (tile === TileType.CORE) engine.gameOver = true;
          engine.grid.tiles[ty][tx] = (tile === TileType.MINER || tile === TileType.CRYSTAL_DRILL || tile === TileType.STEEL_SMELTER) ? TileType.ORE_PATCH : TileType.EMPTY;
          engine.grid.levels[ty][tx] = 0;
          engine.grid.shields[ty][tx] = 0;
        }
      }
      return true;
    }

    // Slow field check
    let slowFactor = 1;
    const scanRange = 6;
    for (let sy = Math.max(0, ty - scanRange); sy <= Math.min(engine.grid.size - 1, ty + scanRange); sy++) {
      for (let sx = Math.max(0, tx - scanRange); sx <= Math.min(engine.grid.size - 1, tx + scanRange); sx++) {
        if (engine.grid.tiles[sy][sx] === TileType.SLOW_FIELD) {
          const level = engine.grid.levels[sy][sx] || 1;
          const mod = engine.grid.modules[sy][sx];
          const range = (BUILDING_STATS[TileType.SLOW_FIELD].range || 5) + (mod === ModuleType.RANGE_BOOST ? 3 : 0);
          const dist = Math.sqrt(Math.pow(e.x - sx, 2) + Math.pow(e.y - sy, 2));
          if (dist <= range) {
            const slowPct = 0.4 + (level - 1) * 0.1;
            slowFactor = Math.min(slowFactor, 1 - slowPct);
          }
        }
      }
    }

    const dx = 15 - e.x;
    const dy = 15 - e.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > 0.1) {
      e.x += (dx / d) * e.speed * slowFactor;
      e.y += (dy / d) * e.speed * slowFactor;
    }
    return true;
  });
}

export function updateParticles(engine: GameEngine) {
  engine.particles = engine.particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    return p.life > 0;
  });
}
