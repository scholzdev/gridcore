import { TileType, ModuleType } from '../config';
import { TILE_COLORS, MODULE_DEFS, BUILDING_REGISTRY, BUILDING_STATS, getMaxHP } from '../config';
import type { Enemy, Drone, LaserBeam, DamageNumber } from './types';
import { ENEMY_TYPES } from './types';
import type { GameEngine } from './Engine';

// Building icons/glyphs for visual clarity
const BUILDING_ICONS: Partial<Record<number, string>> = {
  [TileType.SOLAR_PANEL]: '⚡',
  [TileType.MINER]: '⛏',
  [TileType.WALL]: '▣',
  [TileType.TURRET]: '⌖',
  [TileType.HEAVY_TURRET]: '⊕',
  [TileType.TESLA_COIL]: '϶',
  [TileType.PLASMA_CANNON]: '◎',
  [TileType.LASER_TURRET]: '⊙',
  [TileType.ARTILLERY]: '⊗',
  [TileType.ION_CANNON]: '⊛',
  [TileType.ANNIHILATOR]: '✹',
  [TileType.CORE]: '◆',
  [TileType.REPAIR_BAY]: '+',
  [TileType.SHIELD_GENERATOR]: '◇',
  [TileType.SLOW_FIELD]: '◌',
  [TileType.RADAR_STATION]: '◉',
  [TileType.DRONE_HANGAR]: '▲',
  [TileType.STEEL_SMELTER]: '♨',
  [TileType.FOUNDRY]: '⚒',
  [TileType.FABRICATOR]: '⚙',
  [TileType.RECYCLER]: '♻',
  [TileType.FUSION_REACTOR]: '☢',
  [TileType.HYPER_REACTOR]: '★',
  [TileType.LAB]: '🔬',
  [TileType.CRYSTAL_DRILL]: '◈',
  [TileType.DATA_VAULT]: '▤',
  [TileType.MINEFIELD]: '✕',
  [TileType.ENERGY_RELAY]: '↯',
  [TileType.COMMAND_CENTER]: '⚑',
  [TileType.NANITE_DOME]: '◍',
  [TileType.GRAVITY_CANNON]: '❂',
  [TileType.QUANTUM_FACTORY]: '⬡',
  [TileType.SHOCKWAVE_TOWER]: '⟐',
};

// Buildings that have a rotating turret barrel
const TURRET_TYPES = new Set<number>([
  TileType.TURRET, TileType.HEAVY_TURRET, TileType.TESLA_COIL,
  TileType.PLASMA_CANNON, TileType.LASER_TURRET, TileType.ARTILLERY,
  TileType.ION_CANNON, TileType.ANNIHILATOR, TileType.GRAVITY_CANNON,
]);

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  draw(engine: GameEngine) {
    const { ctx, canvas } = this;
    const { grid } = engine;
    const zoom = engine.zoom;

    ctx.fillStyle = '#f1f2f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = '#dfe4ea';
    ctx.lineWidth = 1;
    for (let i = 0; i <= grid.size; i++) {
      ctx.beginPath(); ctx.moveTo(i * zoom, 0); ctx.lineTo(i * zoom, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * zoom); ctx.lineTo(canvas.width, i * zoom); ctx.stroke();
    }

    // Tiles
    for (let y = 0; y < grid.size; y++) {
      for (let x = 0; x < grid.size; x++) {
        const type = grid.tiles[y][x];
        const level = grid.levels[y][x] || 1;
        const px = x * zoom;
        const py = y * zoom;

        if (type === TileType.ORE_PATCH || (BUILDING_REGISTRY[type]?.requiresOre)) {
          ctx.fillStyle = TILE_COLORS[TileType.ORE_PATCH];
          ctx.fillRect(px + 2, py + 2, zoom - 4, zoom - 4);
        }

        if (type !== TileType.EMPTY && type !== TileType.ORE_PATCH) {
          ctx.fillStyle = TILE_COLORS[type] || '#ff00ff';
          this.drawBuildingRect(px, py, zoom, level, type);

          // Turret barrel — rotates toward last target
          if (TURRET_TYPES.has(type) && engine.turretAngles[y]?.[x] !== undefined) {
            const angle = engine.turretAngles[y][x];
            const cx = px + zoom / 2;
            const cy = py + zoom / 2;
            const barrelLen = zoom * 0.38;
            const barrelW = zoom * 0.08;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(0, -barrelW, barrelLen, barrelW * 2);
            // Barrel tip highlight
            ctx.fillStyle = TILE_COLORS[type] || '#636e72';
            ctx.fillRect(barrelLen - barrelW * 2, -barrelW * 1.2, barrelW * 2 + 1, barrelW * 2.4);
            ctx.restore();
          }

          const p = zoom / 8;
          const s = zoom - p * 2;

          // Resource highlight glow
          if (engine.highlightResource) {
            const stats = BUILDING_STATS[type];
            const res = engine.highlightResource;
            const produces = stats?.income && (stats.income as any)[res];
            const consumes = stats?.consumes && (stats.consumes as any)[res];
            if (produces || consumes) {
              ctx.save();
              ctx.globalAlpha = 0.3 + 0.15 * Math.sin(Date.now() / 200);
              ctx.shadowColor = produces ? '#2ecc71' : '#e74c3c';
              ctx.shadowBlur = zoom * 0.6;
              ctx.fillStyle = produces ? 'rgba(46,204,113,0.25)' : 'rgba(231,76,60,0.2)';
              ctx.fillRect(px + p, py + p, s, s);
              ctx.restore();
            }
          }

          // HP bar — only when damaged
          const hp = grid.healths[y][x];
          const max = getMaxHP(type, level);
          if (hp < max) {
            ctx.fillStyle = '#ecf0f1'; ctx.fillRect(px + p, py + zoom - p - 5, s, 5);
            ctx.fillStyle = hp / max > 0.5 ? '#2ecc71' : hp / max > 0.25 ? '#f39c12' : '#e74c3c';
            ctx.fillRect(px + p, py + zoom - p - 5, s * (hp / max), 5);
          }

          // Shield bar
          const shield = grid.shields[y][x];
          if (shield > 0) {
            ctx.fillStyle = '#3498db';
            ctx.fillRect(px + p, py + zoom - p - 10, s * Math.min(1, shield / max), 4);
          }

          // Module indicator
          const mod = grid.modules[y][x];
          if (mod !== ModuleType.NONE) {
            const modDef = MODULE_DEFS[mod];
            if (modDef) {
              ctx.fillStyle = modDef.color;
              ctx.beginPath();
              ctx.arc(px + zoom - p - 2, py + p + 2, zoom / 8, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#2c3e50';
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
      }
    }

    // Enemies
    this.drawEnemies(engine.enemies, zoom);

    // Projectiles
    engine.projectiles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x * zoom, p.y * zoom, zoom / 10, 0, Math.PI * 2);
      ctx.fill();
    });

    // Particles
    engine.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 15;
      ctx.fillRect(p.x * zoom - 2, p.y * zoom - 2, 4, 4);
      ctx.globalAlpha = 1;
    });

    // Muzzle flashes
    engine.muzzleFlashes.forEach(f => {
      const alpha = f.life / 6;
      const r = zoom * 0.22 * alpha;
      ctx.save();
      ctx.globalAlpha = alpha * 0.85;
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#f1c40f';
      ctx.shadowBlur = zoom * 0.3;
      ctx.beginPath();
      ctx.arc(f.x * zoom, f.y * zoom, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Laser beams
    this.drawLaserBeams(engine.laserBeams, zoom);

    // Drones
    this.drawDrones(engine.drones, zoom);

    // Range indicator
    this.drawRangeIndicator(engine, zoom);

    // Damage numbers
    this.drawDamageNumbers(engine.damageNumbers, zoom);

    // Event notifications
    this.drawEventNotifications(engine);

    // Core placement overlay
    if (engine.placingCore) {
      this.drawCorePlacement(engine, zoom);
    }
  }

  private drawCorePlacement(engine: GameEngine, zoom: number) {
    const { ctx, canvas } = this;
    const hx = engine.hoverGridX;
    const hy = engine.hoverGridY;

    // Darken the whole grid slightly
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Instruction text
    ctx.fillStyle = '#00d2d3';
    ctx.font = `bold ${Math.max(16, zoom * 0.6)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 6;
    ctx.fillText('KERN PLATZIEREN', canvas.width / 2, zoom * 1.5);
    ctx.font = `${Math.max(12, zoom * 0.4)}px monospace`;
    ctx.fillStyle = '#ecf0f1';
    ctx.fillText('Klicke auf das Feld, wo dein Kern stehen soll', canvas.width / 2, zoom * 2.5);
    ctx.shadowBlur = 0;

    // Hover indicator
    if (hx >= 2 && hy >= 2 && hx < engine.grid.size - 2 && hy < engine.grid.size - 2) {
      const isOre = engine.grid.tiles[hy][hx] === TileType.ORE_PATCH;
      const px = hx * zoom;
      const py = hy * zoom;

      if (isOre) {
        // Red indicator — can't place on ore
        ctx.fillStyle = 'rgba(231, 76, 60, 0.4)';
        ctx.fillRect(px + 2, py + 2, zoom - 4, zoom - 4);
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 2, py + 2, zoom - 4, zoom - 4);
      } else {
        ctx.fillStyle = 'rgba(0, 210, 211, 0.4)';
        ctx.fillRect(px + 2, py + 2, zoom - 4, zoom - 4);
        ctx.strokeStyle = '#00d2d3';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 2, py + 2, zoom - 4, zoom - 4);

        // Show a faint 3x3 clear zone indicator
        ctx.fillStyle = 'rgba(0, 210, 211, 0.1)';
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            ctx.fillRect((hx + dx) * zoom + 1, (hy + dy) * zoom + 1, zoom - 2, zoom - 2);
          }
        }
      }
    }
  }

  private drawEnemies(enemies: Enemy[], zoom: number) {
    const { ctx } = this;
    enemies.forEach(e => {
      const typeDef = ENEMY_TYPES[e.enemyType || 'normal'];
      const r = (zoom / 6) * typeDef.sizeMult;
      ctx.fillStyle = typeDef.color;

      const ex = e.x * zoom;
      const ey = e.y * zoom;

      if (typeDef.shape === 3) {
        // Triangle (fast enemies)
        ctx.beginPath();
        ctx.moveTo(ex, ey - r);
        ctx.lineTo(ex - r * 0.87, ey + r * 0.5);
        ctx.lineTo(ex + r * 0.87, ey + r * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#2d3436';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (typeDef.shape === 4) {
        // Diamond (tank enemies)
        ctx.beginPath();
        ctx.moveTo(ex, ey - r);
        ctx.lineTo(ex + r, ey);
        ctx.lineTo(ex, ey + r);
        ctx.lineTo(ex - r, ey);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#2d3436';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (typeDef.shape === 6) {
        // Hexagon (shielded/boss enemies)
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const hx = ex + r * Math.cos(angle);
          const hy = ey + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#2d3436';
        ctx.lineWidth = typeDef.type === 'boss' ? 2 : 1;
        ctx.stroke();

        // Boss glow
        if (typeDef.type === 'boss') {
          ctx.shadowColor = typeDef.color;
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      } else {
        // Circle (normal/swarm)
        ctx.beginPath();
        ctx.arc(ex, ey, r, 0, Math.PI * 2);
        ctx.fill();
      }

      const barW = Math.max(zoom / 3, r * 2);
      // HP bar
      this.drawHealthBar(ex - barW / 2, ey - r - 6, barW, 4, e.health, e.maxHealth, true);

      // Enemy shield bar
      if (e.enemyShield && e.enemyShieldMax && e.enemyShield > 0) {
        ctx.fillStyle = '#74b9ff';
        ctx.fillRect(ex - barW / 2, ey - r - 10, barW * (e.enemyShield / e.enemyShieldMax), 3);
      }
    });
  }

  private drawLaserBeams(beams: LaserBeam[], zoom: number) {
    const { ctx } = this;
    beams.forEach(b => {
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.width * (zoom / 20);
      ctx.globalAlpha = 0.7;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(b.fromX * zoom, b.fromY * zoom);
      ctx.lineTo(b.toX * zoom, b.toY * zoom);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });
  }

  private drawDrones(drones: Drone[], zoom: number) {
    const { ctx } = this;
    drones.forEach(d => {
      ctx.fillStyle = '#0984e3';
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(d.x * zoom, d.y * zoom, zoom / 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }

  private drawBuildingRect(px: number, py: number, zoom: number, level: number, type?: number) {
    const { ctx } = this;
    const p = zoom / 8;
    const s = zoom - p * 2;
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.fillRect(px + p, py + p, s, s);
    ctx.strokeRect(px + p, py + p, s, s);

    // Draw building icon
    const icon = type !== undefined ? BUILDING_ICONS[type] : undefined;
    if (icon && level <= 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `${zoom / 2.8}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, px + zoom / 2, py + zoom / 2);
    } else if (level > 1) {
      // Level badge
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = `bold ${zoom / 2.5}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(`${level}`, px + zoom / 2, py + zoom / 2);
      ctx.shadowBlur = 0;

      // Small icon in corner for leveled buildings
      if (icon) {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = `${zoom / 5}px monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(icon, px + p + 1, py + p + 1);
      }
    }
  }

  private drawHealthBar(x: number, y: number, w: number, h: number, val: number, max: number, isEnemy = false) {
    const { ctx } = this;
    ctx.fillStyle = isEnemy ? '#fab1a0' : '#dfe4ea';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = isEnemy ? '#d63031' : '#2ecc71';
    ctx.fillRect(x, y, w * Math.max(0, val / max), h);
  }

  private drawRangeIndicator(engine: GameEngine, zoom: number) {
    const { ctx } = this;
    const hx = engine.hoverGridX;
    const hy = engine.hoverGridY;
    if (hx < 0 || hy < 0 || hx >= engine.grid.size || hy >= engine.grid.size) return;

    const existingType = engine.grid.tiles[hy][hx];
    let range = 0;

    if (existingType !== TileType.EMPTY && existingType !== TileType.ORE_PATCH) {
      // Hovering over existing building — show its range
      const cfg = BUILDING_REGISTRY[existingType];
      if (cfg?.range) range = cfg.range;
    } else {
      // Placing a new building — show selected building's range
      const cfg = BUILDING_REGISTRY[engine.selectedPlacement];
      if (cfg?.range) range = cfg.range;
    }

    if (range <= 0) return;

    const cx = (hx + 0.5) * zoom;
    const cy = (hy + 0.5) * zoom;
    const r = range * zoom;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(52, 152, 219, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(52, 152, 219, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawDamageNumbers(numbers: DamageNumber[], zoom: number) {
    const { ctx } = this;
    numbers.forEach(d => {
      const alpha = Math.min(1, d.life / 15);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = d.color;
      ctx.font = `bold ${Math.max(10, zoom / 3)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 3;
      ctx.fillText(`${d.amount}`, d.x * zoom, d.y * zoom);
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;
  }

  private drawEventNotifications(engine: GameEngine) {
    const { ctx, canvas } = this;
    const notifications = engine.mapEvents.notifications;
    if (notifications.length === 0) return;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    notifications.forEach((n, i) => {
      const alpha = Math.min(1, n.life / 30);
      const y = 30 + i * 28;
      ctx.globalAlpha = alpha * 0.7;
      ctx.fillStyle = '#000';
      const textWidth = ctx.measureText(n.text).width;
      ctx.fillRect(canvas.width / 2 - textWidth / 2 - 10, y - 12, textWidth + 20, 24);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = n.color;
      ctx.font = 'bold 14px monospace';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(n.text, canvas.width / 2, y);
      ctx.shadowBlur = 0;
    });

    ctx.restore();
  }

  drawGameOver(engine: GameEngine) {
    const { ctx, canvas } = this;
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#e74c3c';
    ctx.font = `bold ${w / 10}px monospace`;
    ctx.fillText('SPIEL VORBEI', w / 2, h * 0.25);

    ctx.fillStyle = '#ecf0f1';
    ctx.font = `${w / 20}px monospace`;
    const mins = Math.floor(engine.gameTime / 60);
    const secs = engine.gameTime % 60;
    const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    ctx.fillText(`Überlebt: ${timeStr}`, w / 2, h * 0.4);
    ctx.fillText(`Gegner besiegt: ${engine.enemiesKilled}`, w / 2, h * 0.48);
    ctx.fillText(`Gebäude gebaut: ${engine.buildingsPlaced}`, w / 2, h * 0.56);

    if (engine.gameMode === 'wellen') {
      ctx.fillText(`Welle erreicht: ${engine.currentWave}`, w / 2, h * 0.64);
      ctx.fillText(`Schwierigkeit: ${engine.diffConfig.label}`, w / 2, h * 0.72);
    } else {
      ctx.fillText(`Schwierigkeit: ${engine.diffConfig.label}`, w / 2, h * 0.64);
    }

    ctx.fillStyle = '#f39c12';
    ctx.font = `bold ${w / 18}px monospace`;
    const py = engine.gameMode === 'wellen' ? h * 0.82 : h * 0.74;
    ctx.fillText(`+${engine.prestigeEarned} Prestige-Punkte`, w / 2, py);

    ctx.fillStyle = '#7f8c8d';
    ctx.font = `${w / 28}px monospace`;
    ctx.fillText('Drücke R oder klicke Neustart', w / 2, py + w / 16);
  }
}
