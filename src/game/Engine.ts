import { GameGrid } from './Grid';
import { TileType, BUILDING_STATS, BUILDING_REGISTRY, getMaxHP, getLevelMult, ORE_BUILDINGS } from '../config';
import {
  GRID_SIZE, TICK_RATE_MS, DEFAULT_ZOOM, MAX_GAME_SPEED, SPAWN_RNG_OFFSET,
  REFUND_PERCENTAGE, COST_SCALING_BASE, UPGRADE_COST_BASE_MULT, UPGRADE_COST_SCALING_BASE,
  MAINTENANCE_COST_PER_LEVEL, SOLAR_DIMINISHING_THRESHOLD, SOLAR_DIMINISHING_PENALTY,
  SOLAR_MIN_EFFICIENCY, DAMAGE_NUMBER_LIFETIME, DAMAGE_NUMBER_DRIFT_SPEED,
  EVENT_NOTIFICATION_LIFETIME, CANVAS_MIN_SIZE, SIDEBAR_WIDTH_OFFSET, TOPBAR_HEIGHT_OFFSET,
  PRESTIGE_DAMAGE_PER_LEVEL, PRESTIGE_INCOME_PER_LEVEL, PRESTIGE_COST_REDUCTION_PER_LEVEL,
  PRESTIGE_HP_PER_LEVEL, PRESTIGE_RESEARCH_PER_LEVEL, PRESTIGE_ABILITY_CD_PER_LEVEL,
  PRESTIGE_MIN_MULT, PRESTIGE_START_RESOURCE_PER_LEVEL,
  EMP_STUN_DURATION_MS, EMERGENCY_REPAIR_HEAL_FRACTION, ENEMY_MAX_SPEED,
  ENDLESS_HP_SCALING_FACTOR, ENDLESS_SPEED_SCALING_FACTOR,
} from '../constants';
import { ResourceManager } from './Resources';
import { Renderer } from './Renderer';
import { detonateMines, moveEnemies, turretLogic, updateProjectiles, updateParticles, updateDrones } from './Combat';
import { loadUnlocks, saveUnlocks, resetUnlocks as resetUnlocksStorage, STARTER_BUILDINGS } from './TechTree';
import { mulberry32, seedToNumber } from './Grid';
import { loadPrestige, savePrestige, calcPrestigeEarned } from './Prestige';
import type { PrestigeData } from './Prestige';
import { createMarketState, tickMarketPrices, executeTrade, TRADE_ROUTES } from './Market';
import type { MarketState } from './Market';
import { createResearchState, computeResearchBuffs, getResearchLevel, getResearchCost, canResearch, RESEARCH_NODES } from './Research';
import type { ResearchState, ResearchBuffs } from './Research';
import type { Difficulty, GameMode, DifficultyConfig, Enemy, Projectile, Particle, Drone, LaserBeam, LaserFocus, DamageNumber, TileStats, EnemyType } from './types';
import { createMapEventState, tickMapEvents, updateEventNotifications } from './MapEvents';
import { playWaveStart } from './Sound';
import type { MapEventState } from './MapEvents';
import { createAbilityState, tickAbilities, activateAbility, isAbilityActive, ABILITIES } from './Abilities';
import type { AbilityState } from './Abilities';
import { DIFFICULTY_PRESETS, WAVE_CONFIG, ENEMY_TYPES, getWaveComposition, pickEnemyType, getEndlessEnemyType } from './types';
import type { TechNode } from './TechTree';
import { fireOnTick, fireOnAuraTick, fireOnResourceGained, fireOnWaveStart, fireOnWaveEnd, fireOnGameStart, fireOnPrestige, fireOnUnlockTech, fireOnDestroyed } from './HookSystem';

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

  // Turret visual state
  turretAngles: number[][] = [];         // Angle each turret is facing
  muzzleFlashes: { x: number; y: number; life: number }[] = [];

  // Resource highlight (which resource type to glow on canvas)
  highlightResource: string | null = null;

  // Per-resource production breakdown
  resourceBreakdown: Record<string, { type: number; x: number; y: number; amount: number }[]> = {};

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

  // Active Abilities
  abilities: AbilityState;

  lastTick: number = 0;
  tickRate: number = TICK_RATE_MS;
  gameOver: boolean = false;
  paused: boolean = false;
  /** When true, wave build timer is frozen (tutorial is active) */
  tutorialPaused: boolean = false;
  zoom: number = DEFAULT_ZOOM;
  /** Speed multiplier: 1 = normal, 2 = fast, 3 = ultra */
  gameSpeed: number = 1;

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
  seed: string = '';
  spawnRng: () => number = Math.random;
  private spawnCounter: number = 0;

  constructor(canvas: HTMLCanvasElement, seed?: string) {
    this.canvas = canvas;
    this.grid = new GameGrid(GRID_SIZE, seed);
    this.seed = this.grid.seed;
    // Separate RNG stream for spawns (offset from map RNG)
    this.spawnRng = mulberry32(seedToNumber(this.seed) + SPAWN_RNG_OFFSET);
    this.resources = new ResourceManager();
    this.renderer = new Renderer(canvas);
    Object.values(TileType).forEach(v => { if (typeof v === 'number') this.purchasedCounts[v] = 0; });
    this.unlockedBuildings = loadUnlocks();
    this.prestige = loadPrestige();
    this.market = createMarketState();
    this.research = createResearchState();
    this.researchBuffs = computeResearchBuffs(this.research);
    this.mapEvents = createMapEventState(() => this.spawnRng());
    this.abilities = createAbilityState();
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
    // Apply prestige HP bonus to core
    const hpMult = this.prestigeHpMult;
    if (hpMult > 1) {
      this.grid.healths[y][x] = Math.round(this.grid.healths[y][x] * hpMult);
    }
    this.placingCore = false;
    fireOnGameStart(this);
    return true;
  }

  startNextWave() {
    this.currentWave++;
    this.waveEnemiesTotal = Math.floor(WAVE_CONFIG.enemiesBase * Math.pow(WAVE_CONFIG.enemiesGrowth, this.currentWave - 1));
    this.waveEnemiesSpawned = 0;
    this.waveEnemiesKilledThisWave = 0;
    this.waveBuildPhase = false;
    this.waveActive = true;
    this.waveSpawnTimer = 0;
    playWaveStart();
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

  restart(seed?: string) {
    this.grid = new GameGrid(GRID_SIZE, seed);
    this.seed = this.grid.seed;
    this.spawnRng = mulberry32(seedToNumber(this.seed) + SPAWN_RNG_OFFSET);
    this.spawnCounter = 0;
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
    this.tutorialPaused = false;
    this.gameSpeed = 1;
    this.gameTime = 0;
    this.nextSpawnTime = 0;
    this.enemiesKilled = 0;
    this.dataVaultBuff = 1;
    this.activeTiles = [];
    this.turretAngles = [];
    this.muzzleFlashes = [];
    this.resourceBreakdown = {};
    this.netIncome = { energy: 0, scrap: 0, steel: 0, electronics: 0, data: 0 };
    this.buildingsPlaced = 0;
    this.killPoints = 0;
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
    this.mapEvents = createMapEventState(() => this.spawnRng());
    this.solarStormMult = 1;
    this.abilities = createAbilityState();
    this.applyPrestigeStartBonuses();
    Object.values(TileType).forEach(v => { if (typeof v === 'number') this.purchasedCounts[v] = 0; });
  }

  resetUnlocks() {
    resetUnlocksStorage();
    this.unlockedBuildings = new Set(STARTER_BUILDINGS);
    this.killPoints = 0;
  }

  // ── Prestige ───────────────────────────────────────────────

  applyPrestigeStartBonuses() {
    const b = this.prestige.bonuses;
    this.resources.state.scrap += b.startScrapLvl * PRESTIGE_START_RESOURCE_PER_LEVEL;
    this.resources.state.energy += b.startEnergyLvl * PRESTIGE_START_RESOURCE_PER_LEVEL;
  }

  get prestigeDamageMult(): number {
    return 1 + this.prestige.bonuses.damageLvl * PRESTIGE_DAMAGE_PER_LEVEL;
  }

  get prestigeIncomeMult(): number {
    return 1 + this.prestige.bonuses.incomeLvl * PRESTIGE_INCOME_PER_LEVEL;
  }

  get prestigeCostMult(): number {
    return Math.max(PRESTIGE_MIN_MULT, 1 - this.prestige.bonuses.costReductionLvl * PRESTIGE_COST_REDUCTION_PER_LEVEL);
  }

  get prestigeHpMult(): number {
    return 1 + (this.prestige.bonuses.hpLvl || 0) * PRESTIGE_HP_PER_LEVEL;
  }

  get prestigeResearchCostMult(): number {
    return Math.max(PRESTIGE_MIN_MULT, 1 - (this.prestige.bonuses.researchSpeedLvl || 0) * PRESTIGE_RESEARCH_PER_LEVEL);
  }

  get prestigeAbilityCdMult(): number {
    return Math.max(PRESTIGE_MIN_MULT, 1 - (this.prestige.bonuses.abilityLvl || 0) * PRESTIGE_ABILITY_CD_PER_LEVEL);
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
    this.damageNumbers.push({ x, y, amount: Math.round(amount), life: DAMAGE_NUMBER_LIFETIME, color });
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
    const cm = this.prestigeCostMult * this.researchBuffs.costMult;
    // Exponential scaling: base * 1.15^count
    const expMult = Math.pow(COST_SCALING_BASE, count);
    return {
      energy: Math.floor((stats.cost.energy || 0) * expMult * cm),
      scrap: Math.floor((stats.cost.scrap || 0) * expMult * cm),
      steel: Math.floor((stats.cost.steel || 0) * expMult * cm),
      electronics: Math.floor((stats.cost.electronics || 0) * expMult * cm),
      data: Math.floor((stats.cost.data || 0) * expMult * cm),
    };
  }

  getUpgradeCost(type: number, currentLevel: number) {
    const stats = BUILDING_STATS[type];
    if (!stats || !stats.cost) return null;
    // Exponential upgrade cost: base * 1.5 * 2.5^(level-1) — always more expensive than placing new
    const factor = UPGRADE_COST_BASE_MULT * Math.pow(UPGRADE_COST_SCALING_BASE, currentLevel - 1);
    const cm = this.prestigeCostMult * this.researchBuffs.costMult;
    return {
      energy: Math.floor((stats.cost.energy || 0) * factor * cm),
      scrap: Math.floor((stats.cost.scrap || 0) * factor * cm),
      steel: Math.floor((stats.cost.steel || 0) * factor * cm),
      electronics: Math.floor((stats.cost.electronics || 0) * factor * cm),
      data: Math.floor((stats.cost.data || 0) * factor * cm),
    };
  }

  getRefund(type: number, level: number) {
    const stats = BUILDING_STATS[type];
    if (!stats || !stats.cost) return { energy: 0, scrap: 0, steel: 0, electronics: 0, data: 0 };
    // Refund ~40% of total invested (sum of exponential costs)
    let totalFactor = 0;
    for (let l = 1; l < level; l++) totalFactor += Math.pow(UPGRADE_COST_SCALING_BASE, l - 1);
    totalFactor += 1; // base purchase
    return {
      energy: Math.floor((stats.cost.energy || 0) * totalFactor * REFUND_PERCENTAGE),
      scrap: Math.floor((stats.cost.scrap || 0) * totalFactor * REFUND_PERCENTAGE),
      steel: Math.floor((stats.cost.steel || 0) * totalFactor * REFUND_PERCENTAGE),
      electronics: Math.floor((stats.cost.electronics || 0) * totalFactor * REFUND_PERCENTAGE),
      data: Math.floor((stats.cost.data || 0) * totalFactor * REFUND_PERCENTAGE),
    };
  }

  resize() {
    let size = Math.min(window.innerWidth - SIDEBAR_WIDTH_OFFSET, window.innerHeight - TOPBAR_HEIGHT_OFFSET);
    if (size < CANVAS_MIN_SIZE) size = CANVAS_MIN_SIZE;
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

    // Speed multiplier: run multiple sub-steps per frame
    const speed = this.gameSpeed;
    const effectiveTickRate = this.tickRate / speed;

    if (timestamp - this.lastTick >= effectiveTickRate) {
      this.tick();
      this.lastTick = timestamp;
      if (!this.tutorialPaused) this.gameTime++;

      if (this.gameMode === 'wellen' && this.waveBuildPhase && !this.tutorialPaused) {
        this.waveBuildTimer--;
        if (this.waveBuildTimer <= 0) this.startNextWave();
      }

      // Map Events
      tickMapEvents(this);
    }

    // Run combat + spawning `speed` times per frame so 2x/3x truly speeds up everything
    for (let step = 0; step < speed; step++) {
      // Spawning
      if (this.gameMode === 'endlos') {
        if (timestamp > this.nextSpawnTime) {
          this.spawnEnemy();
          const spawnDelay = Math.max(this.diffConfig.spawnMin, this.diffConfig.spawnBase - (this.gameTime * this.diffConfig.spawnReduction));
          this.nextSpawnTime = timestamp + spawnDelay / speed;
        }
      } else if (this.gameMode === 'wellen' && this.waveActive && this.waveEnemiesSpawned < this.waveEnemiesTotal) {
        if (timestamp > this.nextSpawnTime) {
          this.spawnWaveEnemy();
          this.waveEnemiesSpawned++;
          const waveSpawnDelay = Math.max(WAVE_CONFIG.spawnDelayMin, WAVE_CONFIG.spawnDelayBase - this.currentWave * WAVE_CONFIG.spawnDelayPerWave);
          this.nextSpawnTime = timestamp + waveSpawnDelay / speed;
        }
      }

      // Combat subsystems
      detonateMines(this);
      moveEnemies(this, timestamp);
      turretLogic(this);
      updateProjectiles(this);
      updateDrones(this);
    }

    updateParticles(this);

    // Update muzzle flashes
    this.muzzleFlashes = this.muzzleFlashes.filter(f => { f.life--; return f.life > 0; });

    // Update damage numbers
    this.damageNumbers = this.damageNumbers.filter(d => {
      d.y -= DAMAGE_NUMBER_DRIFT_SPEED;
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
    // Init turret angles grid if needed
    if (this.turretAngles.length !== size) {
      this.turretAngles = Array(size).fill(0).map(() => Array(size).fill(0));
    }
    const tickIncome = { energy: 0, scrap: 0, steel: 0, electronics: 0, data: 0 };
    const tickExpense = { energy: 0, scrap: 0, steel: 0, electronics: 0, data: 0 };
    // Resource breakdown per resource type
    const breakdown: Record<string, { type: number; x: number; y: number; amount: number }[]> = {
      energy: [], scrap: [], steel: [], electronics: [], data: [],
    };

    // Count solar panels for diminishing returns
    let solarCount = 0;
    for (let sy = 0; sy < size; sy++)
      for (let sx = 0; sx < size; sx++)
        if (this.grid.tiles[sy][sx] === TileType.SOLAR_PANEL) solarCount++;

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

        // Consumes (flat — NOT scaled with level, so upgrades don't punish)
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
          if (consumes.energy) { tickExpense.energy += consumes.energy; breakdown.energy.push({ type, x, y, amount: -consumes.energy }); }
          if (consumes.scrap) { tickExpense.scrap += consumes.scrap; breakdown.scrap.push({ type, x, y, amount: -consumes.scrap }); }
          if (consumes.electronics) { tickExpense.electronics += consumes.electronics; breakdown.electronics.push({ type, x, y, amount: -consumes.electronics }); }
          if (consumes.data) { tickExpense.data += (consumes.data || 0); breakdown.data.push({ type, x, y, amount: -(consumes.data || 0) }); }
        }
        this.activeTiles[y][x] = true;

        // Maintenance cost: every building costs scrap per tick based on level
        if (type !== TileType.CORE) {
          const maintenance = Math.floor(level * MAINTENANCE_COST_PER_LEVEL);
          if (maintenance > 0) {
            this.resources.spend({ scrap: maintenance });
            tickExpense.scrap += maintenance;
          }
        }

        // Apply heal from onTick hooks (e.g. Regen module)
        if (tickEvent.healAmount > 0) {
          const maxHP = getMaxHP(type, level);
          this.grid.healths[y][x] = Math.min(maxHP, this.grid.healths[y][x] + tickEvent.healAmount);
        }

        // Check for self-destruction (e.g. Overdrive Turret losing HP from its own hook)
        if (this.grid.healths[y][x] <= 0) {
          fireOnDestroyed(this, x, y, type);
          this.grid.tiles[y][x] = ORE_BUILDINGS.includes(type) ? TileType.ORE_PATCH : TileType.EMPTY;
          this.grid.levels[y][x] = 0;
          this.grid.shields[y][x] = 0;
          this.grid.modules[y][x] = 0;
          continue;
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
            // Diminishing returns: first 15 full output, then -5% per extra (min 30%)
            if (solarCount > SOLAR_DIMINISHING_THRESHOLD) {
              const penalty = Math.max(SOLAR_MIN_EFFICIENCY, 1 - (solarCount - SOLAR_DIMINISHING_THRESHOLD) * SOLAR_DIMINISHING_PENALTY);
              income.energy *= penalty;
            }
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
          if (finalIncome.energy) { finalIncome.energy *= finalMult; tickIncome.energy += finalIncome.energy; breakdown.energy.push({ type, x, y, amount: finalIncome.energy }); }
          if (finalIncome.scrap) { finalIncome.scrap *= finalMult; tickIncome.scrap += finalIncome.scrap; breakdown.scrap.push({ type, x, y, amount: finalIncome.scrap }); }
          if (finalIncome.steel) { finalIncome.steel *= finalMult; tickIncome.steel += finalIncome.steel; breakdown.steel.push({ type, x, y, amount: finalIncome.steel }); }
          if (finalIncome.electronics) { finalIncome.electronics *= finalMult; tickIncome.electronics += finalIncome.electronics; breakdown.electronics.push({ type, x, y, amount: finalIncome.electronics }); }
          if (finalIncome.data) { finalIncome.data *= finalMult; tickIncome.data += finalIncome.data; breakdown.data.push({ type, x, y, amount: finalIncome.data }); }
          this.resources.add(finalIncome);
        }

        // ── Generic aura / support effects (config-driven) ──
        const cfg = BUILDING_REGISTRY[type];
        if (cfg?.support) {
          const baseRange = stats.range || 0;
          const auraEvent = fireOnAuraTick(this, x, y, this.gameTime, baseRange);
          const auraRange = auraEvent.range;

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
    this.resourceBreakdown = breakdown;

    // Market price recovery
    tickMarketPrices(this.market);

    // Tick ability cooldowns & durations
    tickAbilities(this.abilities);

    // Emergency Repair: instant heal when activated (handled in useAbility)
    // EMP Blast: stun applied when activated (handled in useAbility)
    // Overcharge: fire rate boost checked in Combat.ts
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
    const cost = Math.floor(getResearchCost(node, getResearchLevel(this.research, nodeId)) * this.prestigeResearchCostMult);
    this.resources.state.data -= cost;
    this.research.levels[nodeId] = (this.research.levels[nodeId] || 0) + 1;
    this.researchBuffs = computeResearchBuffs(this.research);
    return true;
  }

  // ── Active Abilities ───────────────────────────────────────

  useAbility(abilityId: string): boolean {
    const ok = activateAbility(
      this.abilities, abilityId,
      (cost) => this.resources.canAfford(cost),
      (cost) => this.resources.spend(cost),
    );
    if (!ok) return false;
    // Apply prestige ability cooldown reduction
    if (this.abilities.cooldowns[abilityId] > 0) {
      this.abilities.cooldowns[abilityId] = Math.ceil(this.abilities.cooldowns[abilityId] * this.prestigeAbilityCdMult);
    }

    // Instant effects
    if (abilityId === 'emergency_repair') {
      const size = this.grid.size;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const type = this.grid.tiles[y][x];
          if (type === TileType.EMPTY || type === TileType.ORE_PATCH) continue;
          const level = this.grid.levels[y][x] || 1;
          const maxHP = getMaxHP(type, level);
          const heal = maxHP * EMERGENCY_REPAIR_HEAL_FRACTION;
          this.grid.healths[y][x] = Math.min(maxHP, this.grid.healths[y][x] + heal);
          this.addDamageNumber(x + 0.5, y + 0.3, Math.round(heal), '#27ae60');
        }
      }
    }

    if (abilityId === 'emp_blast') {
      const stunDuration = EMP_STUN_DURATION_MS;
      const now = performance.now();
      for (const enemy of this.enemies) {
        enemy.slowedUntil = now + stunDuration;
        enemy.slowFactor = 0; // full stop
      }
    }

    return true;
  }

  // ── Spawning ───────────────────────────────────────────────

  spawnEnemy() {
    const s = this.grid.size;
    const edge = s - 1;
    const rng = this.spawnRng;
    const side = Math.floor(rng() * 4);
    let x = 0, y = 0;
    if (side === 0) { x = rng() * s; y = 0; }
    if (side === 1) { x = edge; y = rng() * s; }
    if (side === 2) { x = rng() * s; y = edge; }
    if (side === 3) { x = 0; y = rng() * s; }
    // Exponential scaling: HP doubles roughly every 3 minutes, speed every 5 min
    const minutes = this.gameTime / 60;
    const baseHp = this.diffConfig.baseHp * Math.pow(1 + this.diffConfig.hpPerSec * ENDLESS_HP_SCALING_FACTOR, minutes * 10);
    const baseSpeed = Math.min(ENEMY_MAX_SPEED, this.diffConfig.baseSpeed * Math.pow(1 + this.diffConfig.speedPerSec * ENDLESS_SPEED_SCALING_FACTOR, minutes * 10));

    // Pick enemy type based on game time
    const eType = getEndlessEnemyType(this.gameTime, rng);
    const typeDef = ENEMY_TYPES[eType];
    const hp = baseHp * typeDef.hpMult;
    const speed = baseSpeed * typeDef.speedMult;

    this.spawnCounter++;
    const enemy: Enemy = {
      id: `e${this.spawnCounter}`, x, y, health: hp, maxHealth: hp, speed, lastHit: 0,
      enemyType: eType,
      enemyShield: typeDef.shieldFraction > 0 ? hp * typeDef.shieldFraction : undefined,
      enemyShieldMax: typeDef.shieldFraction > 0 ? hp * typeDef.shieldFraction : undefined,
    };

    // Assign path (spawnEnemy)
    const gridX = Math.floor(x);
    const gridY = Math.floor(y);
    const path = this.grid.findPath(gridX, gridY);
    if (path && path.length > 0) {
      enemy.path = path;
      enemy.pathIndex = 0;
    }
    enemy.pathGeneration = this.grid.pathGeneration;

    this.enemies.push(enemy);
  }

  spawnWaveEnemy() {
    const s = this.grid.size;
    const edge = s - 1;
    const rng = this.spawnRng;
    const side = Math.floor(rng() * 4);
    let x = 0, y = 0;
    if (side === 0) { x = rng() * s; y = 0; }
    if (side === 1) { x = edge; y = rng() * s; }
    if (side === 2) { x = rng() * s; y = edge; }
    if (side === 3) { x = 0; y = rng() * s; }
    const wave = this.currentWave;
    // Exponential wave scaling
    const baseHp = this.diffConfig.baseHp * Math.pow(1 + WAVE_CONFIG.hpScalingPerWave, wave - 1);
    const baseSpeed = Math.min(ENEMY_MAX_SPEED, this.diffConfig.baseSpeed * Math.pow(1 + WAVE_CONFIG.speedScalingPerWave, wave - 1));

    // Pick enemy type based on wave composition
    const composition = getWaveComposition(wave);
    const eType = pickEnemyType(composition, rng);
    const typeDef = ENEMY_TYPES[eType];
    const hp = baseHp * typeDef.hpMult;
    const speed = baseSpeed * typeDef.speedMult;

    this.spawnCounter++;
    const enemy: Enemy = {
      id: `e${this.spawnCounter}`, x, y, health: hp, maxHealth: hp, speed, lastHit: 0,
      enemyType: eType,
      enemyShield: typeDef.shieldFraction > 0 ? hp * typeDef.shieldFraction : undefined,
      enemyShieldMax: typeDef.shieldFraction > 0 ? hp * typeDef.shieldFraction : undefined,
    };

    // Assign path (spawnWaveEnemy)
    const gridX = Math.floor(x);
    const gridY = Math.floor(y);
    const path = this.grid.findPath(gridX, gridY);
    if (path && path.length > 0) {
      enemy.path = path;
      enemy.pathIndex = 0;
    }
    enemy.pathGeneration = this.grid.pathGeneration;

    this.enemies.push(enemy);
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
  getMaxHP(type: number, level: number): number { return getMaxHP(type, level); }

  addEventNotification(text: string, color: string) {
    this.mapEvents.notifications.push({ text, color, life: EVENT_NOTIFICATION_LIFETIME });
  }
}
