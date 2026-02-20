import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const TURRET_CONFIG: BuildingConfig = {
  id: TileType.TURRET,
  name: 'Wächtergeschütz',
  description: 'Schießt auf nahe Gegner. Reichweite 6.',
  color: '#e67e22',
  category: 'defense',
  starter: true,

  health: 800,
  range: 6,
  damage: 30,
  cost: { scrap: 150, energy: 50 },
  costIncrease: { scrap: 100, energy: 15 },

  combat: {
    fireChance: 0.9,
    projectileSpeed: 0.4,
    projectileColor: '#e67e22',
  },

  order: 1,

  // Example hooks — these fire alongside the existing game logic:
  // hooks: {
  //   onKill({ building, enemy, game }) {
  //     // +5 bonus scrap per kill
  //     game.resources.add({ scrap: 5 });
  //   },
  //   onCombatTick({ building, enemiesInRange }) {
  //     // custom targeting logic, visual effects, etc.
  //   },
  // },
};
