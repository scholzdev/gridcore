import { GameGrid, TileType, BUILDING_STATS, ModuleType } from './Grid';
import { ResourceManager } from './Resources';
import { Renderer } from './Renderer';
import { detonateMines, moveEnemies, turretLogic, updateProjectiles, updateParticles, updateDrones } from './Combat';
import { loadUnlocks, saveUnlocks, resetUnlocks as resetUnlocksStorage, STARTER_BUILDINGS } from './TechTree';
import type { Difficulty, GameMode, DifficultyConfig, Enemy, Projectile, Particle, Drone, LaserBeam, LaserFocus } from './types';
import { DIFFICULTY_PRESETS } from './types';
import type { TechNode } from './TechTree';

export class GameEngine {
  grid: GameGrid;
  resources: ResourceManager;
  renderer: Renderer;

  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  particles: Particle[] = [];
  drones: Drone[] = [];
  laserBeams: LaserBeam[] = [];
  laserFocus: Map<string, LaserFocus> = new Map();

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
  netIncome = { energy: 0, scrap: 0, steel: 0, electronics: 0, data: 0 };

  buildingsPlaced: number = 0;
  difficulty: Difficulty = 'leicht';
  diffConfig: DifficultyConfig = DIFFICULTY_PRESETS['leicht'];
  killPoints: number = 0;
  unlockedBuildings: Set<TileType> = new Set(STARTER_BUILDINGS);

  // Game Mode
  gameMode: GameMode = 'endlos';

  // Wave Mode State
  currentWave: number = 0;
  waveEnemiesTotal: number = 0;
  waveEnemiesSpawned: number = 0;
  waveEnemiesKilledThisWave: number = 0;
  waveBuildPhase: boolean = true;
  waveBuildTimer: number = 20;
  waveActive: boolean = false;
  waveSpawnTimer: number = 0;

  purchasedCounts: Record<number, number> = {};
  canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.grid = new GameGrid(30);
    this.resources = new ResourceManager();
    this.renderer = new Renderer(canvas);
    Object.values(TileType).forEach(v => { if (typeof v === 'number') this.purchasedCounts[v] = 0; });
    this.unlockedBuildings = loadUnlocks();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setDifficulty(d: Difficulty) {
    this.difficulty = d;
    this.diffConfig = DIFFICULTY_PRESETS[d];
  }

  setGameMode(mode: GameMode) {
    this.gameMode = mode;
  }

  startNextWave() {
    this.currentWave++;
    this.waveEnemiesTotal = 5 + this.currentWave * 3;
    this.waveEnemiesSpawned = 0;
    this.waveEnemiesKilledThisWave = 0;
    this.waveBuildPhase = false;
    this.waveActive = true;
    this.waveSpawnTimer = 0;
  }

  unlockBuilding(node: TechNode): boolean {
    if (this.killPoints < node.killCost) return false;
    if (this.unlockedBuildings.has(node.unlocks)) return false;
    this.killPoints -= node.killCost;
    this.unlockedBuildings.add(node.unlocks);
    saveUnlocks(this.unlockedBuildings);
    return true;
  }

  restart() {
    this.grid = new GameGrid(30);
    this.resources = new ResourceManager();
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.drones = [];
    this.laserBeams = [];
    this.laserFocus.clear();
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
    this.unlockedBuildings = loadUnlocks();
    this.currentWave = 0;
    this.waveEnemiesTotal = 0;
    this.waveEnemiesSpawned = 0;
    this.waveEnemiesKilledThisWave = 0;
    this.waveBuildPhase = true;
    this.waveBuildTimer = 20;
    this.waveActive = false;
    this.waveSpawnTimer = 0;
    Object.values(TileType).forEach(v => { if (typeof v === 'number') this.purchasedCounts[v] = 0; });
  }

  resetUnlocks() {
    resetUnlocksStorage();
    this.unlockedBuildings = new Set(STARTER_BUILDINGS);
    this.killPoints = 0;
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
    const stats = BUILDING_STATS[type];
    if (!stats || !stats.cost) return null;
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
    const totalFactor = level;
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

  // ── Main Loop ──────────────────────────────────────────────

  update(timestamp: number) {
    if (this.gameOver) return this.renderer.drawGameOver(this);
    if (this.paused) { this.renderer.draw(this); return; }

    if (this.lastTick === 0) this.lastTick = timestamp;

    if (timestamp - this.lastTick >= this.tickRate) {
      this.tick();
      this.lastTick = timestamp;
      this.gameTime++;

      if (this.gameMode === 'wellen' && this.waveBuildPhase) {
        this.waveBuildTimer--;
        if (this.waveBuildTimer <= 0) this.startNextWave();
      }
    }

    // Spawning
    if (this.gameMode === 'endlos') {
      if (timestamp > this.nextSpawnTime) {
        this.spawnEnemy();
        const spawnDelay = Math.max(this.diffConfig.spawnMin, this.diffConfig.spawnBase - (this.gameTime * this.diffConfig.spawnReduction));
        this.nextSpawnTime = timestamp + spawnDelay;
      }
    } else if (this.gameMode === 'wellen' && this.waveActive && this.waveEnemiesSpawned < this.waveEnemiesTotal) {
      if (timestamp > this.nextSpawnTime) {
        this.spawnWaveEnemy();
        this.waveEnemiesSpawned++;
        const waveSpawnDelay = Math.max(300, 1200 - this.currentWave * 50);
        this.nextSpawnTime = timestamp + waveSpawnDelay;
      }
    }

    // Combat subsystems
    detonateMines(this);
    moveEnemies(this, timestamp);
    turretLogic(this);
    updateProjectiles(this);
    updateParticles(this);
    updateDrones(this);

    // Render
    this.renderer.draw(this);
  }

  // ── Economy Tick ───────────────────────────────────────────

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

        // Consumes
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

        // Income
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

        // Repair Bay
        if (type === TileType.REPAIR_BAY) {
          const healAmount = 50 * mult;
          const range = (stats.range || 3) + (mod === ModuleType.RANGE_BOOST ? 3 : 0);
          for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
              const nx = x + dx; const ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
              if (Math.sqrt(dx * dx + dy * dy) > range) continue;
              const nType = this.grid.tiles[ny][nx];
              if (nType !== TileType.EMPTY && nType !== TileType.ORE_PATCH) {
                const nLevel = this.grid.levels[ny][nx] || 1;
                const maxHP = (BUILDING_STATS[nType]?.maxHealth || 100) * (1 + (nLevel - 1) * 0.5);
                this.grid.healths[ny][nx] = Math.min(maxHP, this.grid.healths[ny][nx] + healAmount);
              }
            }
          }
        }

        // Shield Generator
        if (type === TileType.SHIELD_GENERATOR) {
          const cap = 500 * mult;
          const range = (stats.range || 4) + (mod === ModuleType.RANGE_BOOST ? 3 : 0);
          for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
              const nx = x + dx; const ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
              if (Math.sqrt(dx * dx + dy * dy) > range) continue;
              const nType = this.grid.tiles[ny][nx];
              if (nType !== TileType.EMPTY && nType !== TileType.ORE_PATCH) {
                this.grid.shields[ny][nx] = Math.max(this.grid.shields[ny][nx], cap);
              }
            }
          }
        }

        // Data Vault
        if (type === TileType.DATA_VAULT) {
          this.dataVaultBuff += 0.15 * mult;
        }
      }
    }

    this.netIncome = {
      energy: Math.round((tickIncome.energy - tickExpense.energy) * 10) / 10,
      scrap: Math.round((tickIncome.scrap - tickExpense.scrap) * 10) / 10,
      steel: Math.round((tickIncome.steel - tickExpense.steel) * 10) / 10,
      electronics: Math.round((tickIncome.electronics - tickExpense.electronics) * 10) / 10,
      data: Math.round((tickIncome.data - tickExpense.data) * 10) / 10,
    };
  }

  // ── Spawning ───────────────────────────────────────────────

  spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (side === 0) { x = Math.random() * 30; y = 0; }
    if (side === 1) { x = 29; y = Math.random() * 30; }
    if (side === 2) { x = Math.random() * 30; y = 29; }
    if (side === 3) { x = 0; y = Math.random() * 30; }
    const hp = this.diffConfig.baseHp + (this.gameTime * this.diffConfig.hpPerSec);
    const speed = this.diffConfig.baseSpeed + (this.gameTime * this.diffConfig.speedPerSec);
    this.enemies.push({ id: Math.random().toString(36), x, y, health: hp, maxHealth: hp, speed, lastHit: 0 });
  }

  spawnWaveEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (side === 0) { x = Math.random() * 30; y = 0; }
    if (side === 1) { x = 29; y = Math.random() * 30; }
    if (side === 2) { x = Math.random() * 30; y = 29; }
    if (side === 3) { x = 0; y = Math.random() * 30; }
    const wave = this.currentWave;
    const hp = this.diffConfig.baseHp * (1 + (wave - 1) * 0.4);
    const speed = this.diffConfig.baseSpeed * (1 + (wave - 1) * 0.08);
    this.enemies.push({ id: Math.random().toString(36), x, y, health: hp, maxHealth: hp, speed, lastHit: 0 });
  }

  onWaveEnemyKilled() {
    this.waveEnemiesKilledThisWave++;
    if (this.waveEnemiesSpawned >= this.waveEnemiesTotal && this.enemies.length === 0) {
      this.waveActive = false;
      this.waveBuildPhase = true;
      this.waveBuildTimer = 15;
    }
  }
}
