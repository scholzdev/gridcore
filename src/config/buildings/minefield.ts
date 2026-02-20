import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const MINEFIELD_CONFIG: BuildingConfig = {
  id: TileType.MINEFIELD,
  name: 'Minenfeld',
  description: 'Explodiert bei Feindkontakt. Flächenschaden. Einmalverwendung.',
  color: '#d63031',
  category: 'defense',

  health: 200,
  damage: 400,
  cost: { scrap: 60, steel: 30 },
  costIncrease: { scrap: 20, steel: 10 },

  combat: {
    blastRadius: 2.5,
  },

  techTree: {
    id: 'mine',
    killCost: 5,
    tier: 1,
    shortDescription: 'Explodiert bei Kontakt',
  },

  order: 6,
};
