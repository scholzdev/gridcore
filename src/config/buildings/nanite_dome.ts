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

  hooks: {
    onAuraTick(event) {
      const { game } = event;
      const healPerTick = 30;
      const healAmt = healPerTick * event.levelMult * game.researchBuffs.repairMult;
      const size = game.grid.size;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const nType = game.grid.tiles[y][x];
          if (nType === TileType.EMPTY || nType === TileType.ORE_PATCH) continue;
          const nLevel = game.grid.levels[y][x] || 1;
          const maxHP = game.getMaxHP(nType, nLevel);
          if (game.grid.healths[y][x] < maxHP) {
            game.grid.healths[y][x] = Math.min(maxHP, game.grid.healths[y][x] + healAmt);
          }
        }
      }
    },
  },

  techTree: {
    id: 'nanite_dome',
    killCost: 75,
    tier: 5,
    shortDescription: 'Globale Reparatur aller Gebäude',
  },

  order: 12,
};
