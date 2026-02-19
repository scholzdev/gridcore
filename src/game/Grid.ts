
export enum TileType {
  EMPTY = 0,
  WALL = 1,
  CORE = 2,
  SOLAR_PANEL = 3,
  MINER = 4,
  TURRET = 5,
  ORE_PATCH = 6,
  FOUNDRY = 7,
  FABRICATOR = 8,
  LAB = 9,
  HEAVY_TURRET = 10,
  REPAIR_BAY = 11,
  SLOW_FIELD = 12,
  TESLA_COIL = 13,
  SHIELD_GENERATOR = 14,
  RADAR_STATION = 15,
  DATA_VAULT = 16,
  PLASMA_CANNON = 17,
  RECYCLER = 18,
  LASER_TURRET = 19,
  MINEFIELD = 20,
  DRONE_HANGAR = 21,
  CRYSTAL_DRILL = 22,
  STEEL_SMELTER = 23,
}

export enum ModuleType {
  NONE = 0,
  ATTACK_SPEED = 1,  // +30% fire rate
  RANGE_BOOST = 2,   // +3 range
  DAMAGE_AMP = 3,    // +40% damage
  EFFICIENCY = 4,    // -50% consumes
  OVERCHARGE = 5,    // +60% income
  CHAIN = 6,         // hit chains to 2 extra targets (30% dmg)
  PIERCING = 7,      // ignores 50% shield
  REGEN = 8,         // building self-heals 2% HP/s
  SLOW_HIT = 9,      // targets slowed 30% for 3s
  DOUBLE_YIELD = 10, // 20% chance double output
}

export interface ModuleDef {
  name: string;
  description: string;
  color: string;
  cost: { scrap?: number; steel?: number; electronics?: number; data?: number; };
  appliesTo: TileType[]; // welche Gebäude
  requiresUnlock?: TileType; // welches Gebäude muss freigeschaltet sein
}

const TURRETS = [TileType.TURRET, TileType.HEAVY_TURRET, TileType.TESLA_COIL, TileType.PLASMA_CANNON, TileType.LASER_TURRET, TileType.DRONE_HANGAR];
const PRODUCERS = [TileType.SOLAR_PANEL, TileType.MINER, TileType.FOUNDRY, TileType.FABRICATOR, TileType.LAB, TileType.RECYCLER, TileType.CRYSTAL_DRILL, TileType.STEEL_SMELTER];
const WALLS_AND_CORE = [TileType.WALL, TileType.CORE];
export const ORE_BUILDINGS = [TileType.MINER, TileType.CRYSTAL_DRILL, TileType.STEEL_SMELTER];

export const MODULE_DEFS: Record<number, ModuleDef> = {
  [ModuleType.ATTACK_SPEED]: { name: 'Schnellfeuer', description: '+30% Feuerrate', color: '#e74c3c', cost: { steel: 60, electronics: 40 }, appliesTo: TURRETS, requiresUnlock: TileType.HEAVY_TURRET },
  [ModuleType.RANGE_BOOST]: { name: 'Langstrecke', description: '+3 Reichweite', color: '#3498db', cost: { steel: 50, electronics: 30 }, appliesTo: [...TURRETS, TileType.REPAIR_BAY, TileType.SLOW_FIELD, TileType.SHIELD_GENERATOR, TileType.RADAR_STATION], requiresUnlock: TileType.RADAR_STATION },
  [ModuleType.DAMAGE_AMP]: { name: 'Schadensverstärker', description: '+40% Schaden', color: '#e67e22', cost: { steel: 80, electronics: 60 }, appliesTo: TURRETS, requiresUnlock: TileType.HEAVY_TURRET },
  [ModuleType.EFFICIENCY]: { name: 'Effizienz', description: '-50% Verbrauch', color: '#2ecc71', cost: { electronics: 50, data: 30 }, appliesTo: [...PRODUCERS, TileType.SHIELD_GENERATOR, TileType.DATA_VAULT], requiresUnlock: TileType.FABRICATOR },
  [ModuleType.OVERCHARGE]: { name: 'Überladung', description: '+60% Einkommen', color: '#f39c12', cost: { electronics: 80, data: 50 }, appliesTo: PRODUCERS, requiresUnlock: TileType.RECYCLER },
  [ModuleType.CHAIN]: { name: 'Kettenblitz', description: 'Trifft 2 Extra-Ziele (30% Dmg)', color: '#a29bfe', cost: { steel: 100, electronics: 80 }, appliesTo: TURRETS, requiresUnlock: TileType.TESLA_COIL },
  [ModuleType.PIERCING]: { name: 'Panzerbrechend', description: 'Ignoriert 50% Schild', color: '#636e72', cost: { steel: 70, electronics: 50 }, appliesTo: TURRETS, requiresUnlock: TileType.LASER_TURRET },
  [ModuleType.REGEN]: { name: 'Regeneration', description: 'Selbstheilung 2% HP/s', color: '#00b894', cost: { steel: 40, electronics: 30 }, appliesTo: [...WALLS_AND_CORE, ...PRODUCERS, TileType.REPAIR_BAY, TileType.SHIELD_GENERATOR], requiresUnlock: TileType.REPAIR_BAY },
  [ModuleType.SLOW_HIT]: { name: 'Verlangsamung', description: 'Getroffene -30% Speed (3s)', color: '#81ecec', cost: { electronics: 60, data: 40 }, appliesTo: TURRETS, requiresUnlock: TileType.SLOW_FIELD },
  [ModuleType.DOUBLE_YIELD]: { name: 'Doppelertrag', description: '20% Chance doppelter Output', color: '#ffeaa7', cost: { electronics: 100, data: 60 }, appliesTo: PRODUCERS, requiresUnlock: TileType.LAB },
};

export interface Building {
  type: TileType;
  health: number;
  maxHealth: number;
  range?: number;
  damage?: number;
  income: { energy?: number; scrap?: number; data?: number; steel?: number; electronics?: number; };
  consumes?: { energy?: number; scrap?: number; electronics?: number; data?: number; };
  cost: { energy?: number; scrap?: number; steel?: number; electronics?: number; data?: number; };
  costIncrease: { energy?: number; scrap?: number; steel?: number; electronics?: number; data?: number; };
}

export const BUILDING_STATS: Record<number, Partial<Building>> = {
  [TileType.CORE]: { health: 5000, maxHealth: 5000, income: { energy: 1, scrap: 1 } },
  [TileType.SOLAR_PANEL]: { health: 400, maxHealth: 400, cost: { scrap: 40 }, costIncrease: { scrap: 10 }, income: { energy: 15 } },
  [TileType.MINER]: { health: 500, maxHealth: 500, cost: { scrap: 40, energy: 10 }, costIncrease: { scrap: 15, energy: 5 }, income: { scrap: 25 } },
  [TileType.WALL]: { health: 2500, maxHealth: 2500, cost: { scrap: 15 }, costIncrease: { scrap: 5 } },
  [TileType.TURRET]: { health: 800, maxHealth: 800, range: 6, damage: 30, cost: { scrap: 150, energy: 50 }, costIncrease: { scrap: 100, energy: 15 } },
  [TileType.FOUNDRY]: { health: 1000, maxHealth: 1000, cost: { scrap: 120, energy: 40 }, costIncrease: { scrap: 40, energy: 20 }, consumes: { energy: 15, scrap: 5 }, income: { steel: 12 } },
  [TileType.FABRICATOR]: { health: 1000, maxHealth: 1000, cost: { scrap: 200, energy: 100 }, costIncrease: { scrap: 70, energy: 50 }, consumes: { energy: 20 }, income: { electronics: 8 } },
  [TileType.LAB]: { health: 800, maxHealth: 800, cost: { steel: 80, electronics: 60 }, costIncrease: { steel: 40, electronics: 30 }, consumes: { energy: 45, electronics: 2 }, income: { data: 20 } },
  [TileType.HEAVY_TURRET]: { health: 3000, maxHealth: 3000, range: 12, damage: 150, cost: { steel: 300, electronics: 200 }, costIncrease: { steel: 200, electronics: 100 } },
  [TileType.REPAIR_BAY]: { health: 600, maxHealth: 600, range: 3, cost: { scrap: 80, energy: 30 }, costIncrease: { scrap: 30, energy: 10 }, consumes: { energy: 10 } },
  [TileType.SLOW_FIELD]: { health: 500, maxHealth: 500, range: 5, cost: { scrap: 100, energy: 40 }, costIncrease: { scrap: 40, energy: 15 }, consumes: { energy: 15 } },
  [TileType.TESLA_COIL]: { health: 1200, maxHealth: 1200, range: 5, damage: 40, cost: { steel: 120, scrap: 80 }, costIncrease: { steel: 60, scrap: 30 }, consumes: { energy: 15 } },
  [TileType.SHIELD_GENERATOR]: { health: 800, maxHealth: 800, range: 4, cost: { steel: 100, energy: 50 }, costIncrease: { steel: 50, energy: 25 }, consumes: { energy: 25 } },
  [TileType.RADAR_STATION]: { health: 600, maxHealth: 600, range: 5, cost: { steel: 80, electronics: 40 }, costIncrease: { steel: 30, electronics: 20 }, consumes: { energy: 10 } },
  [TileType.DATA_VAULT]: { health: 1500, maxHealth: 1500, cost: { steel: 200, electronics: 150, data: 100 }, costIncrease: { steel: 100, electronics: 75, data: 50 }, consumes: { energy: 25, data: 10 } },
  [TileType.PLASMA_CANNON]: { health: 4000, maxHealth: 4000, range: 10, damage: 300, cost: { steel: 500, electronics: 400, data: 200 }, costIncrease: { steel: 300, electronics: 200, data: 100 }, consumes: { energy: 45 } },
  [TileType.RECYCLER]: { health: 1200, maxHealth: 1200, cost: { steel: 150, electronics: 100, data: 50 }, costIncrease: { steel: 75, electronics: 50, data: 25 }, consumes: { energy: 40, scrap: 15 }, income: { steel: 10, electronics: 8 } },
  [TileType.LASER_TURRET]: { health: 1500, maxHealth: 1500, range: 8, damage: 50, cost: { steel: 200, electronics: 150 }, costIncrease: { steel: 100, electronics: 75 }, consumes: { energy: 30 } },
  [TileType.MINEFIELD]: { health: 200, maxHealth: 200, damage: 400, cost: { scrap: 60, steel: 30 }, costIncrease: { scrap: 20, steel: 10 } },
  [TileType.DRONE_HANGAR]: { health: 2000, maxHealth: 2000, range: 10, damage: 45, cost: { steel: 250, electronics: 200, data: 50 }, costIncrease: { steel: 125, electronics: 100, data: 25 }, consumes: { energy: 35 } },
  [TileType.CRYSTAL_DRILL]: { health: 600, maxHealth: 600, cost: { scrap: 80, steel: 40 }, costIncrease: { scrap: 30, steel: 15 }, consumes: { energy: 20 }, income: { electronics: 5 } },
  [TileType.STEEL_SMELTER]: { health: 600, maxHealth: 600, cost: { scrap: 60, energy: 20 }, costIncrease: { scrap: 20, energy: 10 }, consumes: { energy: 12 }, income: { steel: 8 } },
};

export class GameGrid {
  size: number;
  tiles: number[][];
  healths: number[][];
  shields: number[][];
  modules: number[][];  // ModuleType per tile
  levels: number[][];
  coreX: number = -1;
  coreY: number = -1;

  constructor(size: number = 30) {
    this.size = size;
    this.tiles = Array(size).fill(0).map(() => Array(size).fill(TileType.EMPTY));
    this.healths = Array(size).fill(0).map(() => Array(size).fill(0));
    this.shields = Array(size).fill(0).map(() => Array(size).fill(0));
    this.modules = Array(size).fill(0).map(() => Array(size).fill(ModuleType.NONE));
    this.levels = Array(size).fill(0).map(() => Array(size).fill(0));
    
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
      this.tiles[y][x] = TileType.ORE_PATCH;
    }
  }

  placeCore(x: number, y: number): boolean {
    if (x < 2 || y < 2 || x >= this.size - 2 || y >= this.size - 2) return false;
    // Nicht auf Erz platzieren
    if (this.tiles[y][x] === TileType.ORE_PATCH) return false;
    // Clear ore patches around core (3x3)
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (this.tiles[y + dy][x + dx] === TileType.ORE_PATCH) {
          this.tiles[y + dy][x + dx] = TileType.EMPTY;
        }
      }
    }
    this.tiles[y][x] = TileType.CORE;
    this.healths[y][x] = BUILDING_STATS[TileType.CORE].health!;
    this.levels[y][x] = 1;
    this.coreX = x;
    this.coreY = y;
    return true;
  }

  placeBuilding(x: number, y: number, type: TileType): boolean {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return false;
    const current = this.tiles[y][x];
    
    // Core nicht überschreiben
    if (current === TileType.CORE) return false;

    // Regeln prüfen
    if (type === TileType.MINER || type === TileType.CRYSTAL_DRILL || type === TileType.STEEL_SMELTER) { if (current !== TileType.ORE_PATCH) return false; }
    else { if (current !== TileType.EMPTY) return false; }

    this.tiles[y][x] = type;
    this.levels[y][x] = 1;
    this.healths[y][x] = BUILDING_STATS[type]?.health || 100;
    this.shields[y][x] = 0;
    this.modules[y][x] = ModuleType.NONE;
    return true;
  }

  upgradeBuilding(x: number, y: number): boolean {
    if (this.levels[y][x] >= 5) return false; // Max Level 5
    
    this.levels[y][x]++;
    // Beim Upgrade heilen wir das Gebäude auch ein bisschen
    const type = this.tiles[y][x];
    const baseHealth = BUILDING_STATS[type]?.maxHealth || 100;
    // Neue Max HP berechnen
    const newMaxHP = baseHealth * (1 + (this.levels[y][x] - 1) * 0.5);
    this.healths[y][x] = newMaxHP; // Voll heilen beim Upgrade
    return true;
  }

  installModule(x: number, y: number, mod: ModuleType): boolean {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return false;
    const type = this.tiles[y][x];
    if (type === TileType.EMPTY || type === TileType.ORE_PATCH || type === TileType.CORE) return false;
    // Check if module applies to this building type
    const def = MODULE_DEFS[mod];
    if (!def || !def.appliesTo.includes(type)) return false;
    this.modules[y][x] = mod;
    return true;
  }

  removeModule(x: number, y: number): ModuleType {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return ModuleType.NONE;
    const old = this.modules[y][x];
    this.modules[y][x] = ModuleType.NONE;
    return old;
  }

  removeBuilding(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return 0;
    const type = this.tiles[y][x];
    if (type === TileType.EMPTY || type === TileType.ORE_PATCH || type === TileType.CORE) return 0;
    // Miner steht auf Ore Patch -> zurück zu Ore Patch
    this.tiles[y][x] = (type === TileType.MINER || type === TileType.CRYSTAL_DRILL || type === TileType.STEEL_SMELTER) ? TileType.ORE_PATCH : TileType.EMPTY;
    const level = this.levels[y][x];
    this.levels[y][x] = 0;
    this.healths[y][x] = 0;
    this.shields[y][x] = 0;
    this.modules[y][x] = ModuleType.NONE;
    return level;
  }
}
