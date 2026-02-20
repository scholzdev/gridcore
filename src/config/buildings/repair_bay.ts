import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const REPAIR_BAY_CONFIG: BuildingConfig = {
  id: TileType.REPAIR_BAY,
  name: 'Reparaturbucht',
  description: 'Repariert Gebäude im Bereich. Reichweite 3. Verbraucht Energie.',
  color: '#e056a0',
  category: 'infrastructure',

  health: 600,
  range: 3,
  cost: { scrap: 80, energy: 30 },
  costIncrease: { scrap: 30, energy: 10 },
  consumes: { energy: 5 },

  support: {
    healPerTick: 50,
  },

  hooks: {
    onAuraTick(event) {
      const { building, game, range } = event;
      if (range <= 0) return;
      const healPerTick = 50;
      const healAmt = healPerTick * event.levelMult * game.researchBuffs.repairMult;
      const size = game.grid.size;
      for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
          const nx = building.x + dx;
          const ny = building.y + dy;
          if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
          if (Math.sqrt(dx * dx + dy * dy) > range) continue;
          const nType = game.grid.tiles[ny][nx];
          if (nType === TileType.EMPTY || nType === TileType.ORE_PATCH) continue;
          const nLevel = game.grid.levels[ny][nx] || 1;
          const maxHP = game.getMaxHP(nType, nLevel);
          if (game.grid.healths[ny][nx] < maxHP) {
            game.grid.healths[ny][nx] = Math.min(maxHP, game.grid.healths[ny][nx] + healAmt);
          }
        }
      }
    },
  },

  techTree: {
    id: 'repair',
    killCost: 5,
    tier: 1,
    shortDescription: 'Repariert Gebäude im Bereich',
  },

  order: 6,
};
