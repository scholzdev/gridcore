import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const NANITE_DOME_CONFIG: BuildingConfig = {
  id: TileType.NANITE_DOME,
  name: 'Naniten-Kuppel',
  description: 'Globale Reparatur: Heilt alle Gebäude auf der Karte um 30 HP/Tick.',
  color: '#06d6a0',
  category: 'support',

  health: 6000,
  range: 100, // global
  cost: { steel: 550, electronics: 450, data: 350 },
  costIncrease: { steel: 275, electronics: 225, data: 175 },
  consumes: { energy: 20, data: 4 },

  support: {
    healPerTick: 30,
  },

  // Healing logic is handled by Engine.ts aura processing (uses post-module range)

  techTree: {
    id: 'nanite_dome',
    killCost: 75,
    tier: 5,
    shortDescription: 'Globale Reparatur aller Gebäude',
  },

  order: 12,
};
