import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const HYPER_REACTOR_CONFIG: BuildingConfig = {
  id: TileType.HYPER_REACTOR,
  name: 'Hyperreaktor',
  description: 'Erzeugt massiv Energie (200/Tick). Explodiert bei Zerstörung und beschädigt umliegende Gebäude. Max 1.',
  color: '#ffbe0b',
  category: 'infrastructure',

  health: 6000,
  cost: { steel: 1000, electronics: 800, data: 600 },
  costIncrease: { steel: 500, electronics: 400, data: 300 },

  income: {
    energy: 200,
  },
  consumes: { steel: 5, electronics: 3, data: 2 },

  explosionOnDestroy: 5,
  explosionDamage: 3000,

  maxCount: 1,

  techTree: {
    id: 'hyper_reactor',
    killCost: 100,
    tier: 6,
    shortDescription: '200 Energie, Explosion bei Zerstörung',
  },

  order: 15,
};
