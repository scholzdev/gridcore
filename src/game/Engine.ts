import { GameGrid, TileType, BUILDING_STATS, ModuleType, MODULE_DEFS } from './Grid';
import { ResourceManager } from './Resources';

export type Difficulty = 'leicht' | 'mittel' | 'schwer';

export interface DifficultyConfig {
  label: string;
  baseHp: number;
  hpPerSec: number;
  baseSpeed: number;
  speedPerSec: number;
  spawnBase: number;
  spawnReduction: number;
  spawnMin: number;
  enemyDamage: number;
}

export const DIFFICULTY_PRESETS: Record<Difficulty, DifficultyConfig> = {
  leicht: { label: 'Leicht', baseHp: 100, hpPerSec: 3, baseSpeed: 0.015, speedPerSec: 0.00006, spawnBase: 2500, spawnReduction: 10, spawnMin: 600, enemyDamage: 60 },
  mittel: { label: 'Mittel', baseHp: 150, hpPerSec: 5, baseSpeed: 0.02, speedPerSec: 0.0001, spawnBase: 2000, spawnReduction: 12, spawnMin: 400, enemyDamage: 100 },
  schwer: { label: 'Schwer', baseHp: 200, hpPerSec: 8, baseSpeed: 0.025, speedPerSec: 0.00015, spawnBase: 1500, spawnReduction: 15, spawnMin: 250, enemyDamage: 150 },
};

export interface Enemy { id: string; x: number; y: number; health: number; maxHealth: number; speed: number; lastHit: number; }
export interface Projectile { id: string; x: number; y: number; targetX: number; targetY: number; speed: number; color: string; damage: number; targetId: string; splash?: number; }
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; }

// TECH TREE
export interface TechNode {
  id: string;
  name: string;
  unlocks: TileType;
  killCost: number;
  tier: number;
  description: string;
}

export const TECH_TREE: TechNode[] = [
  // Tier 1 - 5 Kills
  { id: 'foundry', name: 'Gießerei', unlocks: TileType.FOUNDRY, killCost: 5, tier: 1, description: 'Schrott+Energie → Stahl' },
  { id: 'repair', name: 'Reparaturbucht', unlocks: TileType.REPAIR_BAY, killCost: 5, tier: 1, description: 'Repariert Gebäude im Bereich' },
  { id: 'emp', name: 'EMP-Feld', unlocks: TileType.SLOW_FIELD, killCost: 5, tier: 1, description: 'Verlangsamt Gegner' },
  // Tier 2 - 15 Kills
  { id: 'storm', name: 'Sturmgeschütz', unlocks: TileType.HEAVY_TURRET, killCost: 15, tier: 2, description: 'Hoher Schaden, große Reichweite' },
  { id: 'tesla', name: 'Teslaspule', unlocks: TileType.TESLA_COIL, killCost: 15, tier: 2, description: 'Trifft 3+ Ziele gleichzeitig' },
  { id: 'shield', name: 'Schildgenerator', unlocks: TileType.SHIELD_GENERATOR, killCost: 15, tier: 2, description: 'Schirmt Gebäude ab' },
  { id: 'efab', name: 'E-Fabrik', unlocks: TileType.FABRICATOR, killCost: 15, tier: 2, description: 'Schrott+Energie → E-Komp' },
  // Tier 3 - 30 Kills
  { id: 'radar', name: 'Radarstation', unlocks: TileType.RADAR_STATION, killCost: 30, tier: 3, description: 'Erhöht Geschützreichweite' },
  { id: 'recycler', name: 'Recycler', unlocks: TileType.RECYCLER, killCost: 30, tier: 3, description: 'Stahl+E-Komp aus Schrott' },
  { id: 'lab', name: 'Forschungslabor', unlocks: TileType.LAB, killCost: 30, tier: 3, description: 'Energie+E-Komp → Daten' },
  // Tier 4 - 50 Kills
  { id: 'plasma', name: 'Plasmakanone', unlocks: TileType.PLASMA_CANNON, killCost: 50, tier: 4, description: 'Massiver Flächenschaden' },
  { id: 'vault', name: 'Datentresor', unlocks: TileType.DATA_VAULT, killCost: 50, tier: 4, description: '+15% Geschützschaden global' },
];

// Gebäude die von Anfang an verfügbar sind
export const STARTER_BUILDINGS: TileType[] = [
  TileType.SOLAR_PANEL, TileType.MINER, TileType.WALL, TileType.TURRET
];

// FESTE FARB-PALETTE
const TILE_COLORS: Record<number, string> = {
  [TileType.CORE]: '#00d2d3',       // Cyan
  [TileType.SOLAR_PANEL]: '#f1c40f', // GELB!
  [TileType.MINER]: '#9b59b6',       // Lila
  [TileType.TURRET]: '#e67e22',      // Orange
  [TileType.HEAVY_TURRET]: '#c0392b',// Rot
  [TileType.WALL]: '#7f8c8d',        // Grau
  [TileType.FOUNDRY]: '#d35400',     // Dunkelorange
  [TileType.FABRICATOR]: '#27ae60',  // Grün
  [TileType.LAB]: '#2980b9',         // Blau
  [TileType.ORE_PATCH]: '#ced6e0',    // Hellgrau
  [TileType.REPAIR_BAY]: '#e056a0',   // Pink
  [TileType.SLOW_FIELD]: '#a29bfe',   // Lavender
  [TileType.TESLA_COIL]: '#6c5ce7',   // Violett
  [TileType.SHIELD_GENERATOR]: '#74b9ff', // Hellblau
  [TileType.RADAR_STATION]: '#fdcb6e', // Sandgelb
  [TileType.DATA_VAULT]: '#00cec9',   // Teal
  [TileType.PLASMA_CANNON]: '#fd79a8', // Rosa-Rot
  [TileType.RECYCLER]: '#55efc4',     // Mintgrün
};

export class GameEngine {
  grid: GameGrid;
  resources: ResourceManager;
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  particles: Particle[] = [];
  
  lastTick: number = 0;
  tickRate: number = 1000;
  gameOver: boolean = false;
  paused: boolean = false;
  zoom: number = 40;

  gameTime: number = 0;
  nextSpawnTime: number = 0;
  enemiesKilled: number = 0;
  dataVaultBuff: number = 1;
  activeTiles: boolean[][] = [];
  netIncome: { energy: number; scrap: number; steel: number; electronics: number; data: number } = { energy: 0, scrap: 0, steel: 0, electronics: 0, data: 0 };

  buildingsPlaced: number = 0;
  difficulty: Difficulty = 'leicht';
  diffConfig: DifficultyConfig = DIFFICULTY_PRESETS['leicht'];
  killPoints: number = 0;
  unlockedBuildings: Set<TileType> = new Set(STARTER_BUILDINGS);

  purchasedCounts: Record<number, number> = {};
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.grid = new GameGrid(30);
    this.resources = new ResourceManager();
    Object.values(TileType).forEach(v => { if(typeof v === 'number') this.purchasedCounts[v] = 0; });
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setDifficulty(d: Difficulty) {
    this.difficulty = d;
    this.diffConfig = DIFFICULTY_PRESETS[d];
  }

  unlockBuilding(node: TechNode): boolean {
    if (this.killPoints < node.killCost) return false;
    if (this.unlockedBuildings.has(node.unlocks)) return false;
    this.killPoints -= node.killCost;
    this.unlockedBuildings.add(node.unlocks);
    return true;
  }

  restart() {
    this.grid = new GameGrid(30);
    this.resources = new ResourceManager();
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.lastTick = 0;
    this.gameOver = false;
    this.paused = false;
    this.gameTime = 0;
    this.nextSpawnTime = 0;
    this.enemiesKilled = 0;
    this.dataVaultBuff = 1;
    this.activeTiles = [];
    this.netIncome = { energy: 0, scrap: 0, steel: 0, electronics: 0, data: 0 };

    this.buildingsPlaced = 0;
    this.killPoints = 0;
    this.unlockedBuildings = new Set(STARTER_BUILDINGS);
    Object.values(TileType).forEach(v => { if(typeof v === 'number') this.purchasedCounts[v] = 0; });
  }

  getCurrentCost(type: number) {
    const stats = BUILDING_STATS[type];
    if (!stats || !stats.cost) return { scrap: 0 };
    const count = this.purchasedCounts[type] || 0;
    const inc = stats.costIncrease || {};
    return {
      energy: (stats.cost.energy || 0) + (inc.energy || 0) * count,
      scrap: (stats.cost.scrap || 0) + (inc.scrap || 0) * count,
      steel: (stats.cost.steel || 0) + (inc.steel || 0) * count,
      electronics: (stats.cost.electronics || 0) + (inc.electronics || 0) * count,
      data: (stats.cost.data || 0) + (inc.data || 0) * count,
    };
  }

  getUpgradeCost(type: number, currentLevel: number) {
    // Upgrade kostet: Basis-Preis * Level (z.B. Lv 1 -> Lv 2 kostet 1x Basis)
    // Einfachheitshalber nehmen wir die Basis-Kosten * Level
    const stats = BUILDING_STATS[type];
    if (!stats || !stats.cost) return null;
    
    // Faktor für Upgrade Kosten
    const factor = currentLevel; 
    
    return {
        energy: (stats.cost.energy || 0) * factor,
        scrap: (stats.cost.scrap || 0) * factor,
        steel: (stats.cost.steel || 0) * factor,
        electronics: (stats.cost.electronics || 0) * factor,
        data: (stats.cost.data || 0) * factor,
    };
  }

  getRefund(type: number, level: number) {
    const stats = BUILDING_STATS[type];
    if (!stats || !stats.cost) return { energy: 0, scrap: 0, steel: 0, electronics: 0, data: 0 };
    // 50% der Basis-Kosten * Level-Summe (1+2+...+level-1 für upgrades + 1 für Bau)
    const totalFactor = level; // vereinfacht: level als Faktor
    return {
        energy: Math.floor((stats.cost.energy || 0) * totalFactor * 0.5),
        scrap: Math.floor((stats.cost.scrap || 0) * totalFactor * 0.5),
        steel: Math.floor((stats.cost.steel || 0) * totalFactor * 0.5),
        electronics: Math.floor((stats.cost.electronics || 0) * totalFactor * 0.5),
        data: Math.floor((stats.cost.data || 0) * totalFactor * 0.5),
    };
  }

  resize() {
    let size = Math.min(window.innerWidth - 400, window.innerHeight - 150);
    if (size < 300) size = 300;
    this.canvas.width = size;
    this.canvas.height = size;
    this.zoom = size / this.grid.size;
  }

  update(timestamp: number) {
    if (this.gameOver) return this.drawGameOver();
    if (this.paused) { this.draw(); return; }
    
    if (this.lastTick === 0) this.lastTick = timestamp;

    if (timestamp - this.lastTick >= this.tickRate) {
        this.tick();
        this.lastTick = timestamp;
        this.gameTime++;
    }

    if (timestamp > this.nextSpawnTime) {
        this.spawnEnemy();
        const spawnDelay = Math.max(this.diffConfig.spawnMin, this.diffConfig.spawnBase - (this.gameTime * this.diffConfig.spawnReduction)); 
        this.nextSpawnTime = timestamp + spawnDelay;
    }

    this.moveEnemies(timestamp);
    this.turretLogic();
    this.updateProjectiles();
    this.updateParticles();
    this.draw();
  }

  tick() {
    this.dataVaultBuff = 1;
    const size = this.grid.size;
    this.activeTiles = Array(size).fill(false).map(() => Array(size).fill(false));
    const tickIncome = { energy: 0, scrap: 0, steel: 0, electronics: 0, data: 0 };
    const tickExpense = { energy: 0, scrap: 0, steel: 0, electronics: 0, data: 0 };

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const type = this.grid.tiles[y][x];
        if (type === TileType.EMPTY || type === TileType.ORE_PATCH) continue;
        const level = this.grid.levels[y][x] || 1;
        const stats = BUILDING_STATS[type];
        if (!stats) continue;
        
        const mult = 1 + (level - 1) * 0.5;
        const mod = this.grid.modules[y][x];

        // Check consumes - apply efficiency module (-50%)
        if (stats.consumes) {
            const consumes = { ...stats.consumes };
            if (mod === ModuleType.EFFICIENCY) {
                if (consumes.energy) consumes.energy *= 0.5;
                if (consumes.scrap) consumes.scrap *= 0.5;
                if (consumes.electronics) consumes.electronics *= 0.5;
                if (consumes.data) consumes.data *= 0.5;
            }
            if (!this.resources.canAfford(consumes)) continue;
            this.resources.spend(consumes);
            if (consumes.energy) tickExpense.energy += consumes.energy;
            if (consumes.scrap) tickExpense.scrap += consumes.scrap;
            if (consumes.electronics) tickExpense.electronics += consumes.electronics;
            if (consumes.data) tickExpense.data += (consumes.data || 0);
        }
        this.activeTiles[y][x] = true;

        // Income - apply overcharge module (+60%)
        if (stats.income) {
            const incomeMult = mod === ModuleType.OVERCHARGE ? mult * 1.6 : mult;
            const income = { ...stats.income };
            if (income.energy) { income.energy *= incomeMult; tickIncome.energy += income.energy; }
            if (income.scrap) { income.scrap *= incomeMult; tickIncome.scrap += income.scrap; }
            if (income.steel) { income.steel *= incomeMult; tickIncome.steel += income.steel; }
            if (income.electronics) { income.electronics *= incomeMult; tickIncome.electronics += income.electronics; }
            if (income.data) { income.data *= incomeMult; tickIncome.data += income.data; }
            this.resources.add(income);
        }

        // Repair Bay: heal nearby buildings
        if (type === TileType.REPAIR_BAY) {
            const healAmount = 50 * mult;
            const range = (stats.range || 3) + (mod === ModuleType.RANGE_BOOST ? 3 : 0);
            for (let dy = -range; dy <= range; dy++) {
              for (let dx = -range; dx <= range; dx++) {
                const nx = x + dx; const ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
                if (Math.sqrt(dx*dx + dy*dy) > range) continue;
                const nType = this.grid.tiles[ny][nx];
                if (nType !== TileType.EMPTY && nType !== TileType.ORE_PATCH) {
                    const nLevel = this.grid.levels[ny][nx] || 1;
                    const maxHP = (BUILDING_STATS[nType]?.maxHealth || 100) * (1 + (nLevel - 1) * 0.5);
                    this.grid.healths[ny][nx] = Math.min(maxHP, this.grid.healths[ny][nx] + healAmount);
                }
              }
            }
        }

        // Shield Generator: provide shields to nearby buildings
        if (type === TileType.SHIELD_GENERATOR) {
            const cap = 500 * mult;
            const range = (stats.range || 4) + (mod === ModuleType.RANGE_BOOST ? 3 : 0);
            for (let dy = -range; dy <= range; dy++) {
              for (let dx = -range; dx <= range; dx++) {
                const nx = x + dx; const ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
                if (Math.sqrt(dx*dx + dy*dy) > range) continue;
                const nType = this.grid.tiles[ny][nx];
                if (nType !== TileType.EMPTY && nType !== TileType.ORE_PATCH) {
                    this.grid.shields[ny][nx] = Math.max(this.grid.shields[ny][nx], cap);
                }
              }
            }
        }

        // Data Vault: global turret damage buff
        if (type === TileType.DATA_VAULT) {
            this.dataVaultBuff += 0.15 * mult;
        }
      }
    }
    // Store net income for UI display
    this.netIncome = {
      energy: Math.round((tickIncome.energy - tickExpense.energy) * 10) / 10,
      scrap: Math.round((tickIncome.scrap - tickExpense.scrap) * 10) / 10,
      steel: Math.round((tickIncome.steel - tickExpense.steel) * 10) / 10,
      electronics: Math.round((tickIncome.electronics - tickExpense.electronics) * 10) / 10,
      data: Math.round((tickIncome.data - tickExpense.data) * 10) / 10,
    };
  }

  spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (side === 0) { x = Math.random()*30; y = 0; }
    if (side === 1) { x = 29; y = Math.random()*30; }
    if (side === 2) { x = Math.random()*30; y = 29; }
    if (side === 3) { x = 0; y = Math.random()*30; }
    const hp = this.diffConfig.baseHp + (this.gameTime * this.diffConfig.hpPerSec);
    const speed = this.diffConfig.baseSpeed + (this.gameTime * this.diffConfig.speedPerSec);
    this.enemies.push({ id: Math.random().toString(36), x, y, health: hp, maxHealth: hp, speed, lastHit: 0 });
  }

  moveEnemies(timestamp: number) {
    this.enemies = this.enemies.filter(e => {
      const tx = Math.floor(e.x); const ty = Math.floor(e.y);
      const tile = this.grid.tiles[ty]?.[tx];
      if (tile !== undefined && tile !== TileType.EMPTY && tile !== TileType.ORE_PATCH) {
        if (timestamp - e.lastHit > 1000) {
            let dmg = this.diffConfig.enemyDamage;
            // Shield absorbs damage first
            if (this.grid.shields[ty]?.[tx] > 0) {
                const absorbed = Math.min(dmg, this.grid.shields[ty][tx]);
                this.grid.shields[ty][tx] -= absorbed;
                dmg -= absorbed;
            }
            if (dmg > 0) this.grid.healths[ty][tx] -= dmg;
            e.lastHit = timestamp;
            if (this.grid.healths[ty][tx] <= 0) {
                if (tile === TileType.CORE) this.gameOver = true;
                this.grid.tiles[ty][tx] = (tile === TileType.MINER) ? TileType.ORE_PATCH : TileType.EMPTY;
                this.grid.levels[ty][tx] = 0;
                this.grid.shields[ty][tx] = 0;
            }
        }
        return true;
      }

      // Slow field check
      let slowFactor = 1;
      const scanRange = 6;
      for (let sy = Math.max(0, ty - scanRange); sy <= Math.min(this.grid.size - 1, ty + scanRange); sy++) {
        for (let sx = Math.max(0, tx - scanRange); sx <= Math.min(this.grid.size - 1, tx + scanRange); sx++) {
          if (this.grid.tiles[sy][sx] === TileType.SLOW_FIELD) {
            const level = this.grid.levels[sy][sx] || 1;
            const mod = this.grid.modules[sy][sx];
            const range = (BUILDING_STATS[TileType.SLOW_FIELD].range || 5) + (mod === ModuleType.RANGE_BOOST ? 3 : 0);
            const dist = Math.sqrt(Math.pow(e.x - sx, 2) + Math.pow(e.y - sy, 2));
            if (dist <= range) {
              const slowPct = 0.4 + (level - 1) * 0.1;
              slowFactor = Math.min(slowFactor, 1 - slowPct);
            }
          }
        }
      }

      const dx = 15 - e.x; const dy = 15 - e.y; const d = Math.sqrt(dx*dx+dy*dy);
      if (d > 0.1) { e.x += (dx/d)*e.speed*slowFactor; e.y += (dy/d)*e.speed*slowFactor; }
      return true;
    });
  }

  turretLogic() {
    const size = this.grid.size;
    
    // Compute radar range buff per tile
    const radarBuff: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (this.grid.tiles[y][x] === TileType.RADAR_STATION && this.activeTiles[y]?.[x]) {
          const level = this.grid.levels[y][x] || 1;
          const buffRange = BUILDING_STATS[TileType.RADAR_STATION].range || 5;
          const rangeBuff = 3 + (level - 1);
          for (let dy = -buffRange; dy <= buffRange; dy++) {
            for (let dx = -buffRange; dx <= buffRange; dx++) {
              const nx = x + dx; const ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
              if (Math.sqrt(dx*dx + dy*dy) > buffRange) continue;
              radarBuff[ny][nx] = Math.max(radarBuff[ny][nx], rangeBuff);
            }
          }
        }
      }
    }

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const type = this.grid.tiles[y][x];
        if (type !== TileType.TURRET && type !== TileType.HEAVY_TURRET && type !== TileType.TESLA_COIL && type !== TileType.PLASMA_CANNON) continue;
        
        // Skip unpowered turrets (Tesla/Plasma need energy)
        if ((type === TileType.TESLA_COIL || type === TileType.PLASMA_CANNON) && !this.activeTiles[y]?.[x]) continue;

        const level = this.grid.levels[y][x] || 1;
        const stats = BUILDING_STATS[type];
        const mod = this.grid.modules[y][x];
        const effectiveRange = (stats.range || 6) + radarBuff[y][x] + (mod === ModuleType.RANGE_BOOST ? 3 : 0);
        const mult = 1 + (level - 1) * 0.5;
        const dmgMult = mod === ModuleType.DAMAGE_AMP ? 1.4 : 1;
        const dmg = (stats.damage!) * mult * this.dataVaultBuff * dmgMult;
        const fireChance = mod === ModuleType.ATTACK_SPEED ? 0.87 : 0.9; // lower = fires more often

        if (type === TileType.TESLA_COIL) {
          // AoE: hit up to (3 + level) targets simultaneously
          const maxTargets = 3 + level;
          const targets = this.enemies.filter(e => Math.sqrt(Math.pow(e.x-x,2)+Math.pow(e.y-y,2)) <= effectiveRange);
          const selected = targets.slice(0, maxTargets);
          if (selected.length > 0 && Math.random() > fireChance) {
            selected.forEach(target => {
              this.projectiles.push({
                id: Math.random().toString(36), x: x+0.5, y: y+0.5,
                targetX: target.x, targetY: target.y, targetId: target.id,
                speed: 0.6, color: '#6c5ce7', damage: dmg
              });
            });
          }
        } else if (type === TileType.PLASMA_CANNON) {
          // Splash: single projectile with area damage on impact
          const target = this.enemies.find(e => Math.sqrt(Math.pow(e.x-x,2)+Math.pow(e.y-y,2)) <= effectiveRange);
          if (target && Math.random() > (fireChance + 0.05)) {
            this.projectiles.push({
              id: Math.random().toString(36), x: x+0.5, y: y+0.5,
              targetX: target.x, targetY: target.y, targetId: target.id,
              speed: 0.3, color: '#fd79a8', damage: dmg, splash: 2
            });
          }
        } else {
          // Normal turret / heavy turret
          const target = this.enemies.find(e => Math.sqrt(Math.pow(e.x-x,2)+Math.pow(e.y-y,2)) <= effectiveRange);
          if (target && Math.random() > fireChance) {
            this.projectiles.push({ 
                id: Math.random().toString(36), x: x+0.5, y: y+0.5, 
                targetX: target.x, targetY: target.y, targetId: target.id, 
                speed: 0.4, color: type === TileType.HEAVY_TURRET ? '#c0392b' : '#e67e22', 
                damage: dmg 
            });
          }
        }
      }
    }
  }

  updateProjectiles() {
    this.projectiles = this.projectiles.filter(p => {
        const dx = p.targetX - p.x; const dy = p.targetY - p.y; const d = Math.sqrt(dx*dx+dy*dy);
        if (d < 0.3) {
            if (p.splash && p.splash > 0) {
                // Splash damage to all enemies in radius
                const toRemove: string[] = [];
                this.enemies.forEach(e => {
                    const dist = Math.sqrt(Math.pow(e.x - p.targetX, 2) + Math.pow(e.y - p.targetY, 2));
                    if (dist <= p.splash!) {
                        e.health -= p.damage;
                        if (e.health <= 0) toRemove.push(e.id);
                    }
                });
                toRemove.forEach(id => {
                    this.enemies = this.enemies.filter(e => e.id !== id);
                    this.enemiesKilled++;
                    this.killPoints++;
                    this.resources.add({ scrap: 30 });
                });
                // Splash particles
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i;
                    this.particles.push({ x: p.targetX, y: p.targetY, vx: Math.cos(angle) * 0.05, vy: Math.sin(angle) * 0.05, life: 15, color: '#fd79a8' });
                }
            } else {
                // Normal single-target hit
                const target = this.enemies.find(e => e.id === p.targetId);
                if (target) { target.health -= p.damage; if (target.health <= 0) { this.enemies = this.enemies.filter(e => e.id !== target.id); this.enemiesKilled++; this.killPoints++; this.resources.add({ scrap: 30 }); } }
            }
            return false;
        }
        p.x += (dx/d)*p.speed; p.y += (dy/d)*p.speed; return true;
    });
  }

  updateParticles() { this.particles = this.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life--; return p.life > 0; }); }

  draw() {
    const { ctx, grid, zoom } = this;
    ctx.fillStyle = '#f1f2f6'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Grid
    ctx.strokeStyle = '#dfe4ea'; ctx.lineWidth = 1;
    for (let i = 0; i <= grid.size; i++) {
      ctx.beginPath(); ctx.moveTo(i*zoom, 0); ctx.lineTo(i*zoom, this.canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i*zoom); ctx.lineTo(this.canvas.width, i*zoom); ctx.stroke();
    }

    for (let y = 0; y < grid.size; y++) {
      for (let x = 0; x < grid.size; x++) {
        const type = grid.tiles[y][x];
        const level = grid.levels[y][x] || 1;
        const px = x * zoom; const py = y * zoom;

        // Background
        if (type === TileType.ORE_PATCH || type === TileType.MINER) {
            ctx.fillStyle = TILE_COLORS[TileType.ORE_PATCH];
            ctx.fillRect(px + 2, py + 2, zoom - 4, zoom - 4);
        }

        // Buildings
        if (type !== TileType.EMPTY && type !== TileType.ORE_PATCH) {
            ctx.fillStyle = TILE_COLORS[type] || '#ff00ff';
            this.drawBuildingRect(px, py, zoom, level);
            
            // HP
            const hp = grid.healths[y][x];
            const baseMax = BUILDING_STATS[type]?.maxHealth || 100;
            const max = baseMax * (1 + (level-1)*0.5);
            
            const p = zoom / 8; const s = zoom - p * 2;
            ctx.fillStyle = '#ecf0f1'; ctx.fillRect(px+p, py+zoom-p-5, s, 5);
            ctx.fillStyle = '#2ecc71'; ctx.fillRect(px+p, py+zoom-p-5, s * (hp/max), 5);

            // Shield bar (blue, above HP bar)
            const shield = grid.shields[y][x];
            if (shield > 0) {
                ctx.fillStyle = '#3498db';
                ctx.fillRect(px+p, py+zoom-p-10, s * Math.min(1, shield / max), 4);
            }

            // Module indicator dot (top-right corner)
            const mod = grid.modules[y][x];
            if (mod !== ModuleType.NONE) {
                const modDef = MODULE_DEFS[mod];
                if (modDef) {
                    ctx.fillStyle = modDef.color;
                    ctx.beginPath();
                    ctx.arc(px + zoom - p - 2, py + p + 2, zoom/8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#2c3e50';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
      }
    }

    this.enemies.forEach(e => {
        const r = zoom/6;
        ctx.fillStyle = '#2d3436';
        ctx.beginPath(); ctx.arc(e.x*zoom, e.y*zoom, r, 0, Math.PI*2); ctx.fill();
        const barW = zoom/2;
        this.drawHealthBar(e.x*zoom-barW/2, e.y*zoom-r-6, barW, 5, e.health, e.maxHealth, true);
    });
    this.projectiles.forEach(p => { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x*zoom, p.y*zoom, zoom/10, 0, Math.PI*2); ctx.fill(); });
    this.particles.forEach(p => { ctx.fillStyle = p.color; ctx.globalAlpha = p.life/15; ctx.fillRect(p.x*zoom-2, p.y*zoom-2, 4, 4); ctx.globalAlpha = 1; });


  }

  drawBuildingRect(px: number, py: number, zoom: number, level: number) {
      const p = zoom / 8; 
      const s = zoom - p * 2;
      this.ctx.strokeStyle = '#2c3e50'; 
      this.ctx.lineWidth = 2;
      this.ctx.fillRect(px + p, py + p, s, s);
      this.ctx.strokeRect(px + p, py + p, s, s);
      
      // LEVEL ANZEIGE
      if (level > 1) {
          this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
          this.ctx.font = `bold ${zoom/2.5}px monospace`;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.shadowColor = '#000';
          this.ctx.shadowBlur = 4;
          this.ctx.fillText(`${level}`, px + zoom/2, py + zoom/2);
          this.ctx.shadowBlur = 0;
      }
  }

  drawHealthBar(x: number, y: number, w: number, h: number, val: number, max: number, isEnemy = false) {
    this.ctx.fillStyle = isEnemy ? '#fab1a0' : '#dfe4ea'; this.ctx.fillRect(x, y, w, h);
    this.ctx.fillStyle = isEnemy ? '#d63031' : '#2ecc71'; this.ctx.fillRect(x, y, w * Math.max(0, val / max), h);
  }

  drawGameOver() {
    const { ctx } = this;
    const w = this.canvas.width, h = this.canvas.height;
    ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, w, h);
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e74c3c'; ctx.font = `bold ${w/10}px monospace`;
    ctx.fillText('SPIEL VORBEI', w/2, h * 0.25);
    
    ctx.fillStyle = '#ecf0f1'; ctx.font = `${w/20}px monospace`;
    const mins = Math.floor(this.gameTime / 60);
    const secs = this.gameTime % 60;
    const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    ctx.fillText(`Überlebt: ${timeStr}`, w/2, h * 0.4);
    ctx.fillText(`Gegner besiegt: ${this.enemiesKilled}`, w/2, h * 0.48);
    ctx.fillText(`Gebäude gebaut: ${this.buildingsPlaced}`, w/2, h * 0.56);
    ctx.fillText(`Schwierigkeit: ${this.diffConfig.label}`, w/2, h * 0.64);
    
    ctx.fillStyle = '#7f8c8d'; ctx.font = `${w/28}px monospace`;
    ctx.fillText('Drücke R oder klicke Neustart', w/2, h * 0.72);
  }
}
