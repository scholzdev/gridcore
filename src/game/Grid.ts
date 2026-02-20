
// Re-export everything from config for backward compatibility
export { TileType, ModuleType, BUILDING_STATS, MODULE_DEFS, ORE_BUILDINGS, BUILDING_REGISTRY, getMaxHP } from '../config';
export type { Building, ModuleDef } from '../config';

import { TileType, ModuleType, BUILDING_STATS, MODULE_DEFS, ORE_BUILDINGS, getMaxHP } from '../config';


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
    if (ORE_BUILDINGS.includes(type)) { if (current !== TileType.ORE_PATCH) return false; }
    else { if (current !== TileType.EMPTY) return false; }

    // maxCount check (e.g. Command Center: max 1)
    const cfg = BUILDING_REGISTRY[type];
    if (cfg?.maxCount) {
      let count = 0;
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          if (this.tiles[r][c] === type) count++;
        }
      }
      if (count >= cfg.maxCount) return false;
    }

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
    const type = this.tiles[y][x];
    const newMaxHP = getMaxHP(type, this.levels[y][x]);
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
    // Miner/Drill/Smelter steht auf Ore Patch -> zurück zu Ore Patch
    this.tiles[y][x] = ORE_BUILDINGS.includes(type) ? TileType.ORE_PATCH : TileType.EMPTY;
    const level = this.levels[y][x];
    this.levels[y][x] = 0;
    this.healths[y][x] = 0;
    this.shields[y][x] = 0;
    this.modules[y][x] = ModuleType.NONE;
    return level;
  }
}
