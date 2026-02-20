import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const SHOCKWAVE_TOWER_CONFIG: BuildingConfig = {
  id: TileType.SHOCKWAVE_TOWER,
  name: 'Schockwellen-Turm',
  description: 'Sendet alle 5 Ticks eine Schockwelle: 200 Schaden an alle Gegner im Radius 8.',
  color: '#e63946',
  category: 'defense',

  health: 5000,
  range: 8,
  damage: 200,
  cost: { steel: 750, electronics: 550, data: 400 },
  costIncrease: { steel: 375, electronics: 275, data: 200 },
  consumes: { energy: 80 },

  combat: {
    fireChance: 1, // unused — pulse-driven
    pulseRadius: 8,
    pulseInterval: 5,
  },

  techTree: {
    id: 'shockwave_tower',
    killCost: 500,
    tier: 5,
    shortDescription: 'AoE-Schockwelle alle 5 Ticks',
  },

  order: 12,
};
