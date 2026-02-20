import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const SOLAR_PANEL_CONFIG: BuildingConfig = {
  id: TileType.SOLAR_PANEL,
  name: 'Solarfeld',
  description: 'Erzeugt Energie. Überall platzierbar.',
  color: '#f1c40f',
  category: 'infrastructure',
  starter: true,

  health: 400,
  cost: { scrap: 40 },
  costIncrease: { scrap: 10 },
  income: { energy: 15 },

  order: 1,
};
