import { TileType, ModuleType } from '../config';
import { TILE_COLORS, MODULE_DEFS, BUILDING_REGISTRY, BUILDING_STATS, getMaxHP, ORE_BUILDINGS } from '../config';
import type { Enemy, Drone, LaserBeam, DamageNumber } from './types';
import { ENEMY_TYPES, WAVE_CONFIG } from './types';
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

    // World-space rendering (panned)
    ctx.save();
    ctx.translate(engine.panX, engine.panY);

    // Grid lines
    ctx.strokeStyle = '#dfe4ea';
    ctx.lineWidth = 1;
    for (let i = 0; i <= grid.size; i++) {
      ctx.beginPath(); ctx.moveTo(i * zoom, 0); ctx.lineTo(i * zoom, grid.size * zoom); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * zoom); ctx.lineTo(grid.size * zoom, i * zoom); ctx.stroke();
    }

    // Tiles
    for (let y = 0; y < grid.size; y++) {
      for (let x = 0; x < grid.size; x++) {
        const type = grid.tiles[y][x];
        const level = grid.levels[y][x] || 1;
        const px = x * zoom;
        const py = y * zoom;

        if (type === TileType.ORE_PATCH || (BUILDING_REGISTRY[type]?.requiresOre)) {
          // Ore patch with subtle sparkle
          const oreGrad = ctx.createRadialGradient(px + zoom / 2, py + zoom / 2, 0, px + zoom / 2, py + zoom / 2, zoom / 2);
          oreGrad.addColorStop(0, '#d5dbe0');
          oreGrad.addColorStop(0.6, '#ced6e0');
          oreGrad.addColorStop(1, '#b2bec3');
          ctx.fillStyle = oreGrad;
          ctx.fillRect(px + 2, py + 2, zoom - 4, zoom - 4);
          // Tiny sparkle dots
          const sparkle = Math.sin(Date.now() / 500 + x * 3 + y * 7) * 0.3 + 0.3;
          ctx.fillStyle = `rgba(255,255,255,${sparkle})`;
          ctx.fillRect(px + zoom * 0.3, py + zoom * 0.3, 2, 2);
          ctx.fillRect(px + zoom * 0.65, py + zoom * 0.55, 2, 2);
        }

        if (type !== TileType.EMPTY && type !== TileType.ORE_PATCH) {
          ctx.fillStyle = TILE_COLORS[type] || '#ff00ff';
          this.drawBuildingRect(px, py, zoom, level, type);

          // Core pulsing glow
          if (type === TileType.CORE) {
            const pulse = 0.3 + 0.25 * Math.sin(Date.now() / 600);
            const glowR = zoom * (0.6 + 0.15 * Math.sin(Date.now() / 600));
            ctx.save();
            const coreGrad = ctx.createRadialGradient(px + zoom / 2, py + zoom / 2, 0, px + zoom / 2, py + zoom / 2, glowR);
            coreGrad.addColorStop(0, `rgba(0, 210, 211, ${pulse})`);
            coreGrad.addColorStop(1, 'rgba(0, 210, 211, 0)');
            ctx.fillStyle = coreGrad;
            ctx.fillRect(px - glowR, py - glowR, zoom + glowR * 2, zoom + glowR * 2);
            ctx.restore();
          }

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

          // Building type highlight (sidebar hover)
          if (engine.highlightBuildingType >= 0 && type === engine.highlightBuildingType) {
            ctx.save();
            ctx.globalAlpha = 0.35 + 0.2 * Math.sin(Date.now() / 250);
            ctx.shadowColor = TILE_COLORS[type] || '#fff';
            ctx.shadowBlur = zoom * 0.7;
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(px + p, py + p, s, s);
            ctx.restore();
          }

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

    // Building ghost preview (translucent preview at cursor)
    if (!engine.placingCore && !engine.gameOver) {
      this.drawBuildingGhost(engine, zoom);
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

    // Particles (circles with size variation & glow)
    engine.particles.forEach(p => {
      const alpha = Math.min(1, p.life / 15);
      const r = p.size || 2;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = r * 2;
      ctx.beginPath();
      ctx.arc(p.x * zoom, p.y * zoom, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
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

    // End world-space rendering
    ctx.restore();

    // Screen-space UI (not affected by pan)
    // Event notifications
    this.drawEventNotifications(engine);

    // Wave start splash
    if (engine.waveSplashLife > 0) {
      this.drawWaveSplash(engine);
    }

    // Build phase countdown bar
    if (engine.gameMode === 'wellen' && engine.waveBuildPhase && !engine.placingCore) {
      this.drawBuildCountdown(engine);
    }

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

    // Instruction text (screen-space)
    ctx.fillStyle = '#00d2d3';
    ctx.font = `bold ${Math.max(16, engine.baseZoom * 0.6)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 6;
    ctx.fillText('KERN PLATZIEREN', canvas.width / 2, engine.baseZoom * 1.5);
    ctx.font = `${Math.max(12, engine.baseZoom * 0.4)}px monospace`;
    ctx.fillStyle = '#ecf0f1';
    ctx.fillText('Klicke auf das Feld, wo dein Kern stehen soll', canvas.width / 2, engine.baseZoom * 2.5);
    ctx.shadowBlur = 0;

    // Hover indicator (world-space — apply pan)
    ctx.save();
    ctx.translate(engine.panX, engine.panY);

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
      }
    }

    ctx.restore();
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
    const bx = px + p;
    const by = py + p;

    // Gradient fill for depth
    const baseColor = ctx.fillStyle as string;
    const grad = ctx.createLinearGradient(bx, by, bx + s, by + s);
    grad.addColorStop(0, baseColor);
    grad.addColorStop(0.5, baseColor);
    grad.addColorStop(1, this.darkenColor(baseColor, 0.2));
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, s, s);

    // Inner highlight (top-left shine)
    const shine = ctx.createLinearGradient(bx, by, bx + s * 0.5, by + s * 0.5);
    shine.addColorStop(0, 'rgba(255,255,255,0.3)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(bx, by, s, s);

    // Border with slight color variation
    ctx.strokeStyle = this.darkenColor(baseColor, 0.4);
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, s, s);

    // Inner border highlight (subtle 3D effect)
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 1, by + 1, s - 2, s - 2);

    // Draw building icon (always)
    const icon = type !== undefined ? BUILDING_ICONS[type] : undefined;
    if (icon) {
      // Icon shadow for readability
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.font = `${zoom / 2.8}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, px + zoom / 2 + 0.5, py + zoom / 2 + 0.5);
      // Icon
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText(icon, px + zoom / 2, py + zoom / 2);
    }

    // Level badge (top-right corner, shown for level > 1)
    if (level > 1) {
      const badgeR = zoom / 5.5;
      const bx = px + zoom - p - badgeR + 1;
      const by = py + p + badgeR - 1;
      // Badge background
      ctx.fillStyle = level >= 5 ? '#f39c12' : level >= 3 ? '#00d2d3' : '#fff';
      ctx.beginPath();
      ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Badge text
      ctx.fillStyle = level >= 3 ? '#fff' : '#2d3436';
      ctx.font = `bold ${zoom / 4}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${level}`, bx, by + 0.5);
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

  /** Translucent ghost of the selected building at cursor position */
  private drawBuildingGhost(engine: GameEngine, zoom: number) {
    const { ctx } = this;
    const hx = engine.hoverGridX;
    const hy = engine.hoverGridY;
    if (hx < 0 || hy < 0 || hx >= engine.grid.size || hy >= engine.grid.size) return;

    const currentTile = engine.grid.tiles[hy][hx];
    const selected = engine.selectedPlacement;
    // Only show ghost on placeable tiles (not on existing buildings)
    const isOre = currentTile === TileType.ORE_PATCH;
    const isEmpty = currentTile === TileType.EMPTY;
    if (!isEmpty && !isOre) return;

    // Check if placement would be valid
    const needsOre = ORE_BUILDINGS.includes(selected);
    const canPlace = needsOre ? isOre : isEmpty;

    const px = hx * zoom;
    const py = hy * zoom;

    ctx.save();
    ctx.globalAlpha = canPlace ? 0.45 : 0.3;
    ctx.fillStyle = canPlace ? (TILE_COLORS[selected] || '#636e72') : '#e74c3c';
    this.drawBuildingRect(px, py, zoom, 1, selected);

    // Red X overlay for invalid placement
    if (!canPlace) {
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 3;
      const p = zoom / 6;
      ctx.beginPath();
      ctx.moveTo(px + p, py + p);
      ctx.lineTo(px + zoom - p, py + zoom - p);
      ctx.moveTo(px + zoom - p, py + p);
      ctx.lineTo(px + p, py + zoom - p);
      ctx.stroke();
    }

    ctx.restore();
  }

  /** Big centered wave number splash that fades out */
  private drawWaveSplash(engine: GameEngine) {
    const { ctx, canvas } = this;
    const life = engine.waveSplashLife;
    const maxLife = 90;
    const progress = life / maxLife;
    // Fade in fast, fade out slow
    const alpha = life > maxLife * 0.8 ? (maxLife - life) / (maxLife * 0.2) : Math.min(1, progress * 2);
    // Scale: starts big, settles to normal
    const scale = 1 + (life > maxLife * 0.7 ? (life - maxLife * 0.7) / (maxLife * 0.3) * 0.3 : 0);

    ctx.save();
    ctx.globalAlpha = alpha * 0.85;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Dark backdrop
    const fontSize = Math.max(28, canvas.width / 10) * scale;
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 12;

    // Red-to-orange gradient text
    const textGrad = ctx.createLinearGradient(canvas.width / 2 - 120, 0, canvas.width / 2 + 120, 0);
    textGrad.addColorStop(0, '#e74c3c');
    textGrad.addColorStop(0.5, '#f39c12');
    textGrad.addColorStop(1, '#e74c3c');
    ctx.fillStyle = textGrad;
    ctx.fillText(engine.waveSplashText, canvas.width / 2, canvas.height * 0.35);

    // Subtitle with enemy count
    ctx.shadowBlur = 4;
    ctx.globalAlpha = alpha * 0.7;
    ctx.font = `${Math.max(14, canvas.width / 28)}px monospace`;
    ctx.fillStyle = '#ecf0f1';
    ctx.fillText(`${engine.waveEnemiesTotal} Gegner`, canvas.width / 2, canvas.height * 0.35 + fontSize * 0.7);

    ctx.restore();
  }

  /** Build phase countdown bar at bottom of canvas */
  private drawBuildCountdown(engine: GameEngine) {
    const { ctx, canvas } = this;
    const timer = engine.waveBuildTimer;
    const maxTime = engine.currentWave === 0 ? WAVE_CONFIG.initialBuildTime : WAVE_CONFIG.betweenWavesBuildTime;
    const progress = Math.max(0, timer / maxTime);

    const barH = 6;
    const barW = canvas.width * 0.6;
    const barX = (canvas.width - barW) / 2;
    const barY = canvas.height - 20;

    ctx.save();
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    // Progress bar
    const barColor = progress > 0.3 ? '#00d2d3' : '#e74c3c';
    const barGrad = ctx.createLinearGradient(barX, 0, barX + barW * progress, 0);
    barGrad.addColorStop(0, barColor);
    barGrad.addColorStop(1, progress > 0.3 ? '#0abde3' : '#ff6b6b');
    ctx.fillStyle = barGrad;
    ctx.fillRect(barX, barY, barW * progress, barH);

    // Timer text
    ctx.fillStyle = '#ecf0f1';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 3;
    const label = engine.currentWave === 0 ? 'BAUPHASE' : `NÄCHSTE WELLE (${engine.currentWave + 1})`;
    ctx.fillText(`${label} — ${timer}s`, canvas.width / 2, barY - 4);
    ctx.shadowBlur = 0;

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

  /** Darken a hex color by a fraction (0-1) */
  private darkenColor(hex: string, amount: number): string {
    let color = hex.replace('#', '');
    if (color.length === 3) color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    const num = parseInt(color, 16);
    const r = Math.max(0, ((num >> 16) & 255) * (1 - amount)) | 0;
    const g = Math.max(0, ((num >> 8) & 255) * (1 - amount)) | 0;
    const b = Math.max(0, (num & 255) * (1 - amount)) | 0;
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
  }
}
