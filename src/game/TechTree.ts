import { TileType, TECH_TREE, STARTER_BUILDINGS } from '../config';
export type { TechNode } from '../config';
export { TECH_TREE, STARTER_BUILDINGS };

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
