import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const ANNIHILATOR_CONFIG: BuildingConfig = {
  id: TileType.ANNIHILATOR,
  name: 'Annihilator',
  description: 'Feuert alle 10 Ticks einen verheerenden Strahl. Trifft ALLE Gegner in einer Linie. Max 1.',
  color: '#ff006e',
  category: 'defense',

  health: 10000,
  range: 100, // global
  damage: 1000,
  cost: { steel: 1200, electronics: 900, data: 700 },
  costIncrease: { steel: 600, electronics: 450, data: 350 },
  consumes: { energy: 100 },

  combat: {
    fireChance: 1,
    lineBeam: true,
    lineBeamInterval: 10,
  },

  maxCount: 1,

  techTree: {
    id: 'annihilator',
    killCost: 100,
    tier: 6,
    shortDescription: 'Verheerender Linien-Strahl',
  },

  order: 15,
};
