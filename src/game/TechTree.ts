import { TileType } from './Grid';

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
  { id: 'mine', name: 'Minenfeld', unlocks: TileType.MINEFIELD, killCost: 5, tier: 1, description: 'Explodiert bei Kontakt' },
  { id: 'smelter', name: 'Stahlschmelze', unlocks: TileType.STEEL_SMELTER, killCost: 5, tier: 1, description: 'Erz → Stahl direkt' },
  // Tier 2 - 15 Kills
  { id: 'storm', name: 'Sturmgeschütz', unlocks: TileType.HEAVY_TURRET, killCost: 15, tier: 2, description: 'Hoher Schaden, große Reichweite' },
  { id: 'tesla', name: 'Teslaspule', unlocks: TileType.TESLA_COIL, killCost: 15, tier: 2, description: 'Trifft 3+ Ziele gleichzeitig' },
  { id: 'shield', name: 'Schildgenerator', unlocks: TileType.SHIELD_GENERATOR, killCost: 15, tier: 2, description: 'Schirmt Gebäude ab' },
  { id: 'efab', name: 'E-Fabrik', unlocks: TileType.FABRICATOR, killCost: 15, tier: 2, description: 'Schrott+Energie → Elektronik' },
  { id: 'crystal', name: 'Kristallbohrer', unlocks: TileType.CRYSTAL_DRILL, killCost: 15, tier: 2, description: 'Erz → Elektronik direkt' },
  // Tier 3 - 30 Kills
  { id: 'radar', name: 'Radarstation', unlocks: TileType.RADAR_STATION, killCost: 30, tier: 3, description: 'Erhöht Geschützreichweite' },
  { id: 'recycler', name: 'Recycler', unlocks: TileType.RECYCLER, killCost: 30, tier: 3, description: 'Stahl+Elektronik aus Schrott' },
  { id: 'lab', name: 'Forschungslabor', unlocks: TileType.LAB, killCost: 30, tier: 3, description: 'Energie+Elektronik → Daten' },
  { id: 'laser', name: 'Laserturm', unlocks: TileType.LASER_TURRET, killCost: 30, tier: 3, description: 'Strahl mit Aufladung' },
  // Tier 4 - 50 Kills
  { id: 'plasma', name: 'Plasmakanone', unlocks: TileType.PLASMA_CANNON, killCost: 50, tier: 4, description: 'Massiver Flächenschaden' },
  { id: 'vault', name: 'Datentresor', unlocks: TileType.DATA_VAULT, killCost: 50, tier: 4, description: '+15% Geschützschaden global' },
  { id: 'drones', name: 'Drohnenhangar', unlocks: TileType.DRONE_HANGAR, killCost: 50, tier: 4, description: 'Autonome Angriffsdrohnen' },
];

export const STARTER_BUILDINGS: TileType[] = [
  TileType.SOLAR_PANEL, TileType.MINER, TileType.WALL, TileType.TURRET
];

const STORAGE_KEY = 'rectangular_unlocks';

export function loadUnlocks(): Set<TileType> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const arr = JSON.parse(saved) as number[];
      return new Set([...STARTER_BUILDINGS, ...arr]);
    }
  } catch {}
  return new Set(STARTER_BUILDINGS);
}

export function saveUnlocks(unlockedBuildings: Set<TileType>) {
  const toSave = [...unlockedBuildings].filter(t => !(STARTER_BUILDINGS as number[]).includes(t));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

export function resetUnlocks() {
  localStorage.removeItem(STORAGE_KEY);
}
