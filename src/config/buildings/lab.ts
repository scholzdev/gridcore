import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const LAB_CONFIG: BuildingConfig = {
  id: TileType.LAB,
  name: 'Forschungslabor',
  description: 'Wandelt Energie+Elektronik → Daten um.',
  color: '#54a0ff',
  category: 'research',

  health: 800,
  cost: { steel: 80, electronics: 60 },
  costIncrease: { steel: 40, electronics: 30 },
  consumes: { energy: 30 },
  income: { data: 20 },

  techTree: {
    id: 'lab',
    killCost: 25,
    tier: 3,
    shortDescription: 'Energie+Elektronik → Daten',
  },

  order: 1,

  hooks: {
    onResourceGained(event) {
      if (event.income.data) {
        event.income.data *= event.game.researchBuffs.dataOutputMult;
      }
    },
  },
};
