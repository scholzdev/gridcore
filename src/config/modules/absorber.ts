import { TileType, ModuleType } from '../types';
import type { ModuleConfig } from '../types';

export const ABSORBER_CONFIG: ModuleConfig = {
  id: ModuleType.ABSORBER,
  name: 'Absorber',
  description: 'Gebäude im Umkreis 3 erleiden 25% weniger Schaden',
  color: '#636e72',
  cost: { steel: 80, electronics: 50 },
  appliesTo: [
    TileType.WALL,
  ],
  requiresUnlock: TileType.SHIELD_GENERATOR,
  // Absorber logic is handled in Combat.ts moveEnemies
  // Checks nearby walls with ABSORBER module for damage reduction
  hooks: {},
};
