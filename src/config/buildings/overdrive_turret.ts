import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const OVERDRIVE_TURRET_CONFIG: BuildingConfig = {
  id: TileType.OVERDRIVE_TURRET,
  name: 'Overdrive-Geschütz',
  description: 'Extremer Schaden, verliert aber stetig HP. Hohes Risiko, hohe Belohnung.',
  color: '#ff3838',
  category: 'defense',

  health: 2000,
  range: 10,
  damage: 400,
  cost: { steel: 900, electronics: 700, data: 500 },
  costIncrease: { steel: 450, electronics: 350, data: 250 },
  consumes: { energy: 40, data: 3 },

  combat: {
    fireChance: 0.85,
    projectileSpeed: 0.5,
    projectileColor: '#ff3838',
  },

  techTree: {
    id: 'overdrive',
    killCost: 50,
    tier: 4,
    shortDescription: '+200% Schaden, verliert HP über Zeit',
  },

  hooks: {
    onTick(event) {
      // Self-damage: loses 2% max HP per tick
      const selfDmg = event.building.maxHealth * 0.02;
      event.game.grid.healths[event.building.y][event.building.x] -= selfDmg;
      event.game.addDamageNumber(event.building.x + 0.5, event.building.y + 0.8, Math.round(selfDmg), '#ff6348');
    },
  },

  order: 6,
};
