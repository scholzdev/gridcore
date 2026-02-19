
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
}

export enum ModuleType {
  NONE = 0,
  ATTACK_SPEED = 1,  // +30% fire rate
  RANGE_BOOST = 2,   // +3 range
  DAMAGE_AMP = 3,    // +40% damage
  EFFICIENCY = 4,    // -50% consumes
  OVERCHARGE = 5,    // +60% income
}

export interface ModuleDef {
  name: string;
  description: string;
  color: string;
  cost: { steel?: number; electronics?: number; data?: number; };
  appliesTo: TileType[]; // welche Gebäude
}

const TURRETS = [TileType.TURRET, TileType.HEAVY_TURRET, TileType.TESLA_COIL, TileType.PLASMA_CANNON];
const PRODUCERS = [TileType.SOLAR_PANEL, TileType.MINER, TileType.FOUNDRY, TileType.FABRICATOR, TileType.LAB, TileType.RECYCLER];

export const MODULE_DEFS: Record<number, ModuleDef> = {
  [ModuleType.ATTACK_SPEED]: { name: 'Schnellfeuer', description: '+30% Feuerrate', color: '#e74c3c', cost: { steel: 60, electronics: 40 }, appliesTo: TURRETS },
  [ModuleType.RANGE_BOOST]: { name: 'Langstrecke', description: '+3 Reichweite', color: '#3498db', cost: { steel: 50, electronics: 30 }, appliesTo: [...TURRETS, TileType.REPAIR_BAY, TileType.SLOW_FIELD, TileType.SHIELD_GENERATOR, TileType.RADAR_STATION] },
  [ModuleType.DAMAGE_AMP]: { name: 'Schadensverstärker', description: '+40% Schaden', color: '#e67e22', cost: { steel: 80, electronics: 60 }, appliesTo: TURRETS },
  [ModuleType.EFFICIENCY]: { name: 'Effizienz', description: '-50% Verbrauch', color: '#2ecc71', cost: { electronics: 50, data: 30 }, appliesTo: [...PRODUCERS, TileType.SHIELD_GENERATOR, TileType.DATA_VAULT] },
  [ModuleType.OVERCHARGE]: { name: 'Überladung', description: '+60% Einkommen', color: '#f39c12', cost: { electronics: 80, data: 50 }, appliesTo: PRODUCERS },
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
  [TileType.CORE]: { health: 5000, maxHealth: 5000, income: { energy: 30, scrap: 5 } },
  [TileType.SOLAR_PANEL]: { health: 400, maxHealth: 400, cost: { scrap: 40 }, costIncrease: { scrap: 10 }, income: { energy: 40 } },
  [TileType.MINER]: { health: 500, maxHealth: 500, cost: { scrap: 40, energy: 10 }, costIncrease: { scrap: 15, energy: 5 }, income: { scrap: 25 } },
  [TileType.WALL]: { health: 2500, maxHealth: 2500, cost: { scrap: 15 }, costIncrease: { scrap: 5 } },
  [TileType.TURRET]: { health: 800, maxHealth: 800, range: 6, damage: 30, cost: { scrap: 150, energy: 50 }, costIncrease: { scrap: 100, energy: 20 } },
  [TileType.FOUNDRY]: { health: 1000, maxHealth: 1000, cost: { scrap: 120, energy: 40 }, costIncrease: { scrap: 40, energy: 20 }, consumes: { energy: 20, scrap: 10 }, income: { steel: 10 } },
  [TileType.FABRICATOR]: { health: 1000, maxHealth: 1000, cost: { scrap: 200, energy: 100 }, costIncrease: { scrap: 70, energy: 50 }, consumes: { energy: 30, scrap: 10 }, income: { electronics: 5 } },
  [TileType.LAB]: { health: 800, maxHealth: 800, cost: { steel: 80, electronics: 60 }, costIncrease: { steel: 40, electronics: 30 }, consumes: { energy: 50, electronics: 2 }, income: { data: 20 } },
  [TileType.HEAVY_TURRET]: { health: 3000, maxHealth: 3000, range: 12, damage: 150, cost: { steel: 300, electronics: 200 }, costIncrease: { steel: 200, electronics: 100 } },
  [TileType.REPAIR_BAY]: { health: 600, maxHealth: 600, range: 3, cost: { scrap: 80, energy: 30 }, costIncrease: { scrap: 30, energy: 10 }, consumes: { energy: 10 } },
  [TileType.SLOW_FIELD]: { health: 500, maxHealth: 500, range: 5, cost: { scrap: 100, energy: 40 }, costIncrease: { scrap: 40, energy: 15 }, consumes: { energy: 15 } },
  [TileType.TESLA_COIL]: { health: 1200, maxHealth: 1200, range: 5, damage: 40, cost: { steel: 120, scrap: 80 }, costIncrease: { steel: 60, scrap: 30 }, consumes: { energy: 15 } },
  [TileType.SHIELD_GENERATOR]: { health: 800, maxHealth: 800, range: 4, cost: { steel: 100, energy: 50 }, costIncrease: { steel: 50, energy: 25 }, consumes: { energy: 25 } },
  [TileType.RADAR_STATION]: { health: 600, maxHealth: 600, range: 5, cost: { steel: 80, electronics: 40 }, costIncrease: { steel: 30, electronics: 20 }, consumes: { energy: 10 } },
  [TileType.DATA_VAULT]: { health: 1500, maxHealth: 1500, cost: { steel: 200, electronics: 150, data: 100 }, costIncrease: { steel: 100, electronics: 75, data: 50 }, consumes: { energy: 30, data: 10 } },
  [TileType.PLASMA_CANNON]: { health: 4000, maxHealth: 4000, range: 10, damage: 300, cost: { steel: 500, electronics: 400, data: 200 }, costIncrease: { steel: 300, electronics: 200, data: 100 }, consumes: { energy: 60 } },
  [TileType.RECYCLER]: { health: 1200, maxHealth: 1200, cost: { steel: 150, electronics: 100, data: 50 }, costIncrease: { steel: 75, electronics: 50, data: 25 }, consumes: { energy: 40, scrap: 15 }, income: { steel: 8, electronics: 6 } },
};

export class GameGrid {
  size: number;
  tiles: number[][];
  healths: number[][];
  shields: number[][];
  modules: number[][];  // ModuleType per tile
  levels: number[][];

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
    const mid = 15;
    this.tiles[mid][mid] = TileType.CORE;
    this.healths[mid][mid] = BUILDING_STATS[TileType.CORE].health!;
    this.levels[mid][mid] = 1;
  }

  placeBuilding(x: number, y: number, type: TileType): boolean {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return false;
    const current = this.tiles[y][x];
    
    // Core nicht überschreiben
    if (current === TileType.CORE) return false;

    // Regeln prüfen
    if (type === TileType.MINER) { if (current !== TileType.ORE_PATCH) return false; }
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
    this.tiles[y][x] = (type === TileType.MINER) ? TileType.ORE_PATCH : TileType.EMPTY;
    const level = this.levels[y][x];
    this.levels[y][x] = 0;
    this.healths[y][x] = 0;
    this.shields[y][x] = 0;
    this.modules[y][x] = ModuleType.NONE;
    return level;
  }
}
