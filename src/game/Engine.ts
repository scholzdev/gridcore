import { GameGrid } from './Grid';
import { TileType, BUILDING_STATS, BUILDING_REGISTRY, getMaxHP, getLevelMult } from '../config';
import { ResourceManager } from './Resources';
import { Renderer } from './Renderer';
import { detonateMines, moveEnemies, turretLogic, updateProjectiles, updateParticles, updateDrones } from './Combat';
import { loadUnlocks, saveUnlocks, resetUnlocks as resetUnlocksStorage, STARTER_BUILDINGS } from './TechTree';
import { loadPrestige, savePrestige, calcPrestigeEarned } from './Prestige';
import type { PrestigeData } from './Prestige';
import { createMarketState, tickMarketPrices, executeTrade, TRADE_ROUTES } from './Market';
import type { MarketState } from './Market';
import { createResearchState, computeResearchBuffs, getResearchLevel, getResearchCost, canResearch, RESEARCH_NODES } from './Research';
import type { ResearchState, ResearchBuffs } from './Research';
import type { Difficulty, GameMode, DifficultyConfig, Enemy, Projectile, Particle, Drone, LaserBeam, LaserFocus, DamageNumber, TileStats } from './types';
import { createMapEventState, tickMapEvents, updateEventNotifications } from './MapEvents';
import type { MapEventState } from './MapEvents';
import { DIFFICULTY_PRESETS, WAVE_CONFIG } from './types';
import type { TechNode } from './TechTree';
import { fireOnTick, fireOnAuraTick, fireOnResourceGained, fireOnWaveStart, fireOnWaveEnd, fireOnGameStart, fireOnPrestige, fireOnUnlockTech } from './HookSystem';

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
  damageNumbers: DamageNumber[] = [];

  // Hover & placement tracking for range display
  hoverGridX: number = -1;
  hoverGridY: number = -1;
  selectedPlacement: TileType = TileType.SOLAR_PANEL;

  // Stats tracking
  tileStats: Map<string, TileStats> = new Map();
  globalStats = { totalDamage: 0 };

  // Prestige
  prestige: PrestigeData;
  prestigeEarned: number = 0;
  prestigeAwarded: boolean = false;

  // Market
  market: MarketState;

  // Research 2.0
  research: ResearchState;
  researchBuffs: ResearchBuffs;

  // Map Events
  mapEvents: MapEventState;
  solarStormMult: number = 1;

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
  killPoints: number = 500;
  unlockedBuildings: Set<TileType> = new Set(STARTER_BUILDINGS);

  // Game Mode
  gameMode: GameMode = 'endlos';
  placingCore: boolean = true;

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
    this.prestige = loadPrestige();
    this.market = createMarketState();
    this.research = createResearchState();
    this.researchBuffs = computeResearchBuffs(this.research);
    this.mapEvents = createMapEventState();
    this.applyPrestigeStartBonuses();
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

  placeCore(x: number, y: number): boolean {
    if (!this.placingCore) return false;
    if (!this.grid.placeCore(x, y)) return false;
    this.placingCore = false;
    fireOnGameStart(this);
    return true;
  }

  startNextWave() {
    this.currentWave++;
    this.waveEnemiesTotal = WAVE_CONFIG.enemiesBase + this.currentWave * WAVE_CONFIG.enemiesPerWave;
    this.waveEnemiesSpawned = 0;
    this.waveEnemiesKilledThisWave = 0;
    this.waveBuildPhase = false;
    this.waveActive = true;
    this.waveSpawnTimer = 0;
    fireOnWaveStart(this, this.currentWave, this.waveEnemiesTotal);
  }

  unlockBuilding(node: TechNode): boolean {
    if (this.killPoints < node.killCost) return false;
    if (this.unlockedBuildings.has(node.unlocks)) return false;
    this.killPoints -= node.killCost;
    this.unlockedBuildings.add(node.unlocks);
    saveUnlocks(this.unlockedBuildings);
    fireOnUnlockTech(this, node.id, node.name, node.unlocks);
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
    this.damageNumbers = [];
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
    this.killPoints = 500;
    this.unlockedBuildings = loadUnlocks();
    this.currentWave = 0;
    this.waveEnemiesTotal = 0;
    this.waveEnemiesSpawned = 0;
    this.waveEnemiesKilledThisWave = 0;
    this.waveBuildPhase = true;
    this.waveBuildTimer = WAVE_CONFIG.initialBuildTime;
    this.waveActive = false;
    this.waveSpawnTimer = 0;
    this.tileStats.clear();
    this.globalStats = { totalDamage: 0 };
    this.prestigeEarned = 0;
    this.prestigeAwarded = false;
    this.prestige = loadPrestige();
    this.market = createMarketState();
    this.research = createResearchState();
    this.researchBuffs = computeResearchBuffs(this.research);
    this.placingCore = true;
    this.mapEvents = createMapEventState();
    this.solarStormMult = 1;
    this.applyPrestigeStartBonuses();
    Object.values(TileType).forEach(v => { if (typeof v === 'number') this.purchasedCounts[v] = 0; });
  }

  resetUnlocks() {
    resetUnlocksStorage();
    this.unlockedBuildings = new Set(STARTER_BUILDINGS);
    this.killPoints = 500;
  }

  // ── Prestige ───────────────────────────────────────────────

  applyPrestigeStartBonuses() {
    const b = this.prestige.bonuses;
    this.resources.state.scrap += b.startScrapLvl * 20;
    this.resources.state.energy += b.startEnergyLvl * 20;
  }

  get prestigeDamageMult(): number {
    return 1 + this.prestige.bonuses.damageLvl * 0.1;
  }

  get prestigeIncomeMult(): number {
    return 1 + this.prestige.bonuses.incomeLvl * 0.1;
  }

  get prestigeCostMult(): number {
    return Math.max(0.5, 1 - this.prestige.bonuses.costReductionLvl * 0.05);
  }

  // ── Stats ──────────────────────────────────────────────────

  addTileDamage(tileX: number, tileY: number, damage: number) {
    const key = `${tileX},${tileY}`;
    const stats = this.tileStats.get(key) || { totalDamage: 0, kills: 0 };
    stats.totalDamage += damage;
    this.tileStats.set(key, stats);
    this.globalStats.totalDamage += damage;
  }

  addTileKill(tileX: number, tileY: number) {
    const key = `${tileX},${tileY}`;
    const stats = this.tileStats.get(key) || { totalDamage: 0, kills: 0 };
    stats.kills++;
    this.tileStats.set(key, stats);
  }

  addDamageNumber(x: number, y: number, amount: number, color: string = '#e74c3c') {
    this.damageNumbers.push({ x, y, amount: Math.round(amount), life: 30, color });
  }

  // ── Save / Load ────────────────────────────────────────────

  saveGame() {
    const state = {
      grid: { tiles: this.grid.tiles, healths: this.grid.healths, shields: this.grid.shields, modules: this.grid.modules, levels: this.grid.levels, coreX: this.grid.coreX, coreY: this.grid.coreY },
      resources: this.resources.state,
      enemies: this.enemies,
      gameTime: this.gameTime,
      killPoints: this.killPoints,
      enemiesKilled: this.enemiesKilled,
      buildingsPlaced: this.buildingsPlaced,
      purchasedCounts: this.purchasedCounts,
      difficulty: this.difficulty,
      gameMode: this.gameMode,
      currentWave: this.currentWave,
      waveEnemiesTotal: this.waveEnemiesTotal,
      waveEnemiesSpawned: this.waveEnemiesSpawned,
      waveEnemiesKilledThisWave: this.waveEnemiesKilledThisWave,
      waveBuildPhase: this.waveBuildPhase,
      waveBuildTimer: this.waveBuildTimer,
      waveActive: this.waveActive,
      tileStats: Object.fromEntries(this.tileStats),
      globalStats: this.globalStats,
      market: this.market,
      research: this.research,
    };
    localStorage.setItem('rectangular_save', JSON.stringify(state));
  }

  loadGame(): boolean {
    try {
      const saved = localStorage.getItem('rectangular_save');
      if (!saved) return false;
      const s = JSON.parse(saved);

      // Grid
      const size = this.grid.size;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          this.grid.tiles[y][x] = s.grid.tiles[y][x];
          this.grid.healths[y][x] = s.grid.healths[y][x];
          this.grid.shields[y][x] = s.grid.shields[y][x];
          this.grid.modules[y][x] = s.grid.modules[y][x];
          this.grid.levels[y][x] = s.grid.levels[y][x];
        }
      }
      this.grid.coreX = s.grid.coreX ?? 15;
      this.grid.coreY = s.grid.coreY ?? 15;
      this.placingCore = false;

      // Resources
      this.resources.state = { ...s.resources };

      // Enemies
      this.enemies = s.enemies || [];
      this.projectiles = [];
      this.particles = [];
      this.drones = [];
      this.laserBeams = [];
      this.laserFocus.clear();
      this.damageNumbers = [];

      // State
      this.gameTime = s.gameTime;
      this.killPoints = s.killPoints;
      this.enemiesKilled = s.enemiesKilled;
      this.buildingsPlaced = s.buildingsPlaced;
      this.purchasedCounts = s.purchasedCounts;
      this.difficulty = s.difficulty;
      this.diffConfig = DIFFICULTY_PRESETS[s.difficulty as Difficulty];
      this.gameMode = s.gameMode;
      this.currentWave = s.currentWave;
      this.waveEnemiesTotal = s.waveEnemiesTotal;
      this.waveEnemiesSpawned = s.waveEnemiesSpawned;
      this.waveEnemiesKilledThisWave = s.waveEnemiesKilledThisWave;
      this.waveBuildPhase = s.waveBuildPhase;
      this.waveBuildTimer = s.waveBuildTimer;
      this.waveActive = s.waveActive;
      this.lastTick = 0;
      this.gameOver = false;
      this.paused = false;
      this.prestigeAwarded = false;
      this.prestigeEarned = 0;

      // Stats
      this.tileStats = new Map(Object.entries(s.tileStats || {})) as Map<string, TileStats>;
      this.globalStats = s.globalStats || { totalDamage: 0 };

      // Market & Research
      if (s.market) this.market = s.market;
      if (s.research) {
        this.research = s.research;
        this.researchBuffs = computeResearchBuffs(this.research);
      }

      return true;
    } catch { return false; }
  }

  hasSave(): boolean {
    return localStorage.getItem('rectangular_save') !== null;
  }

  deleteSave() {
    localStorage.removeItem('rectangular_save');
  }

  getCurrentCost(type: number) {
    const stats = BUILDING_STATS[type];
    if (!stats || !stats.cost) return { scrap: 0 };
    const count = this.purchasedCounts[type] || 0;
    const inc = stats.costIncrease || {};
    const cm = this.prestigeCostMult * this.researchBuffs.costMult;
    return {
      energy: Math.floor(((stats.cost.energy || 0) + (inc.energy || 0) * count) * cm),
      scrap: Math.floor(((stats.cost.scrap || 0) + (inc.scrap || 0) * count) * cm),
      steel: Math.floor(((stats.cost.steel || 0) + (inc.steel || 0) * count) * cm),
      electronics: Math.floor(((stats.cost.electronics || 0) + (inc.electronics || 0) * count) * cm),
      data: Math.floor(((stats.cost.data || 0) + (inc.data || 0) * count) * cm),
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
    if (this.placingCore) {
      this.renderer.draw(this);
      return;
    }
    if (this.gameOver) {
      if (!this.prestigeAwarded) {
        this.prestigeEarned = calcPrestigeEarned(this.enemiesKilled, this.gameTime);
        this.prestige.totalPoints += this.prestigeEarned;
        savePrestige(this.prestige);
        this.prestigeAwarded = true;
        fireOnPrestige(this, this.prestigeEarned, this.prestige.totalPoints);
      }
      this.renderer.drawGameOver(this);
      return;
    }
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

      // Map Events
      tickMapEvents(this);
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
        const waveSpawnDelay = Math.max(WAVE_CONFIG.spawnDelayMin, WAVE_CONFIG.spawnDelayBase - this.currentWave * WAVE_CONFIG.spawnDelayPerWave);
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

    // Update damage numbers
    this.damageNumbers = this.damageNumbers.filter(d => {
      d.y -= 0.02;
      d.life--;
      return d.life > 0;
    });

    // Update event notifications
    updateEventNotifications(this);

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
        const mult = getLevelMult(level);

        // Fire onTick hook BEFORE consumes — hooks may modify consumeMult & healAmount
        const tickEvent = fireOnTick(this, x, y, this.gameTime);

        // Consumes
        if (stats.consumes) {
          const consumes = { ...stats.consumes };
          // Apply hook-driven consume multiplier (e.g. Efficiency module sets consumeMult = 0.5)
          if (consumes.energy) consumes.energy *= tickEvent.consumeMult;
          if (consumes.scrap) consumes.scrap *= tickEvent.consumeMult;
          if (consumes.electronics) consumes.electronics *= tickEvent.consumeMult;
          if (consumes.data) consumes.data *= tickEvent.consumeMult;
          // Research: energy consume reduction
          if (consumes.energy) consumes.energy *= this.researchBuffs.energyConsumeMult;
          if (!this.resources.canAfford(consumes)) continue;
          this.resources.spend(consumes);
          if (consumes.energy) tickExpense.energy += consumes.energy;
          if (consumes.scrap) tickExpense.scrap += consumes.scrap;
          if (consumes.electronics) tickExpense.electronics += consumes.electronics;
          if (consumes.data) tickExpense.data += (consumes.data || 0);
        }
        this.activeTiles[y][x] = true;

        // Apply heal from onTick hooks (e.g. Regen module)
        if (tickEvent.healAmount > 0) {
          const maxHP = getMaxHP(type, level);
          this.grid.healths[y][x] = Math.min(maxHP, this.grid.healths[y][x] + tickEvent.healAmount);
        }

        // Income
        if (stats.income) {
          const income = { ...stats.income };
          // Base multipliers (level + prestige + research)
          const baseMult = mult * this.prestigeIncomeMult * this.researchBuffs.incomeMult;
          if (income.energy) income.energy *= baseMult;
          if (income.scrap) income.scrap *= baseMult;
          if (income.steel) income.steel *= baseMult;
          if (income.electronics) income.electronics *= baseMult;
          if (income.data) income.data *= baseMult;

          // Solar storm event: 3× energy for solar panels
          if (income.energy && type === TileType.SOLAR_PANEL) {
            income.energy *= this.solarStormMult;
          }

          // Fire onResourceGained — hooks can modify incomeMult (Overcharge, DoubleYield, Lab dataOutputMult)
          const rgEvent = fireOnResourceGained(this, x, y, {
            energy: income.energy || 0, scrap: income.scrap || 0,
            steel: income.steel || 0, electronics: income.electronics || 0,
            data: income.data || 0,
          });

          // Apply hook-driven income multiplier
          const finalMult = rgEvent.incomeMult;
          const finalIncome = rgEvent.income;
          if (finalIncome.energy) { finalIncome.energy *= finalMult; tickIncome.energy += finalIncome.energy; }
          if (finalIncome.scrap) { finalIncome.scrap *= finalMult; tickIncome.scrap += finalIncome.scrap; }
          if (finalIncome.steel) { finalIncome.steel *= finalMult; tickIncome.steel += finalIncome.steel; }
          if (finalIncome.electronics) { finalIncome.electronics *= finalMult; tickIncome.electronics += finalIncome.electronics; }
          if (finalIncome.data) { finalIncome.data *= finalMult; tickIncome.data += finalIncome.data; }
          this.resources.add(finalIncome);
        }

        // ── Generic aura / support effects (config-driven) ──
        const cfg = BUILDING_REGISTRY[type];
        if (cfg?.support) {
          const baseRange = stats.range || 0;
          const auraEvent = fireOnAuraTick(this, x, y, this.gameTime, baseRange);
          const auraRange = auraEvent.range;

          // Repair aura
          if (cfg.support.healPerTick && auraRange > 0) {
            const healAmt = cfg.support.healPerTick * mult * this.researchBuffs.repairMult;
            for (let dy = -auraRange; dy <= auraRange; dy++) {
              for (let dx = -auraRange; dx <= auraRange; dx++) {
                const nx = x + dx; const ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
                if (Math.sqrt(dx * dx + dy * dy) > auraRange) continue;
                const nType = this.grid.tiles[ny][nx];
                if (nType !== TileType.EMPTY && nType !== TileType.ORE_PATCH) {
                  const nLevel = this.grid.levels[ny][nx] || 1;
                  const maxHP = getMaxHP(nType, nLevel);
                  this.grid.healths[ny][nx] = Math.min(maxHP, this.grid.healths[ny][nx] + healAmt);
                }
              }
            }
          }

          // Shield aura
          if (cfg.support.shieldCap && auraRange > 0) {
            const cap = cfg.support.shieldCap * mult * this.researchBuffs.shieldMult;
            for (let dy = -auraRange; dy <= auraRange; dy++) {
              for (let dx = -auraRange; dx <= auraRange; dx++) {
                const nx = x + dx; const ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
                if (Math.sqrt(dx * dx + dy * dy) > auraRange) continue;
                const nType = this.grid.tiles[ny][nx];
                if (nType !== TileType.EMPTY && nType !== TileType.ORE_PATCH) {
                  this.grid.shields[ny][nx] = Math.max(this.grid.shields[ny][nx], cap);
                }
              }
            }
          }

          // Global damage buff
          if (cfg.support.damageBuff) {
            this.dataVaultBuff += cfg.support.damageBuff * mult;
          }
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

    // Market price recovery
    tickMarketPrices(this.market);
  }

  // ── Market ─────────────────────────────────────────────────

  executeTrade(routeIndex: number, amount: number): boolean {
    const route = TRADE_ROUTES[routeIndex];
    if (!route) return false;
    return executeTrade(route, amount, this.market, this.resources.state);
  }

  // ── Research 2.0 ───────────────────────────────────────────

  buyResearch(nodeId: string): boolean {
    const node = RESEARCH_NODES.find(n => n.id === nodeId);
    if (!node) return false;
    if (!canResearch(this.research, node, this.resources.state.data)) return false;
    const cost = getResearchCost(node, getResearchLevel(this.research, nodeId));
    this.resources.state.data -= cost;
    this.research.levels[nodeId] = (this.research.levels[nodeId] || 0) + 1;
    this.researchBuffs = computeResearchBuffs(this.research);
    return true;
  }

  // ── Spawning ───────────────────────────────────────────────

  spawnEnemy() {
    const s = this.grid.size;
    const edge = s - 1;
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (side === 0) { x = Math.random() * s; y = 0; }
    if (side === 1) { x = edge; y = Math.random() * s; }
    if (side === 2) { x = Math.random() * s; y = edge; }
    if (side === 3) { x = 0; y = Math.random() * s; }
    const hp = this.diffConfig.baseHp + (this.gameTime * this.diffConfig.hpPerSec);
    const speed = this.diffConfig.baseSpeed + (this.gameTime * this.diffConfig.speedPerSec);
    this.enemies.push({ id: Math.random().toString(36), x, y, health: hp, maxHealth: hp, speed, lastHit: 0 });
  }

  spawnWaveEnemy() {
    const s = this.grid.size;
    const edge = s - 1;
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (side === 0) { x = Math.random() * s; y = 0; }
    if (side === 1) { x = edge; y = Math.random() * s; }
    if (side === 2) { x = Math.random() * s; y = edge; }
    if (side === 3) { x = 0; y = Math.random() * s; }
    const wave = this.currentWave;
    const hp = this.diffConfig.baseHp * (1 + (wave - 1) * WAVE_CONFIG.hpScalingPerWave);
    const speed = this.diffConfig.baseSpeed * (1 + (wave - 1) * WAVE_CONFIG.speedScalingPerWave);
    this.enemies.push({ id: Math.random().toString(36), x, y, health: hp, maxHealth: hp, speed, lastHit: 0 });
  }

  onWaveEnemyKilled() {
    this.waveEnemiesKilledThisWave++;
    if (this.waveEnemiesSpawned >= this.waveEnemiesTotal && this.enemies.length === 0) {
      this.waveActive = false;
      this.waveBuildPhase = true;
      this.waveBuildTimer = WAVE_CONFIG.betweenWavesBuildTime;
      fireOnWaveEnd(this, this.currentWave, this.waveEnemiesTotal, this.waveEnemiesKilledThisWave);
    }
  }

  // ── GameCtx interface helpers ──────────────────────────────
  addParticle(p: Particle) { this.particles.push(p); }

  addEventNotification(text: string, color: string) {
    this.mapEvents.notifications.push({ text, color, life: 120 });
  }
}
