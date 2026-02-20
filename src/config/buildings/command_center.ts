import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const COMMAND_CENTER_CONFIG: BuildingConfig = {
  id: TileType.COMMAND_CENTER,
  name: 'Kommandozentrale',
  description: 'Globaler Buff: +15% Schaden und +5% Feuerrate für alle Geschütze. Nur 1 pro Karte.',
  color: '#f39c12',
  category: 'support',

  health: 8000,
  range: 100, // global
  cost: { steel: 600, electronics: 500, data: 300 },
  costIncrease: { steel: 300, electronics: 250, data: 150 },
  consumes: { energy: 30, data: 5 },

  support: {
    damageBuff: 0.15,
    fireRateBuffBase: 0.05,
  },

  maxCount: 1,

  techTree: {
    id: 'command_center',
    killCost: 75,
    tier: 5,
    shortDescription: 'Globaler Schaden- & Feuerrate-Buff',
  },

  order: 11,
};
