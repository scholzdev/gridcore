import { TileType, ModuleType } from '../types';
import type { ModuleConfig } from '../types';

export const RANGE_BOOST_CONFIG: ModuleConfig = {
  id: ModuleType.RANGE_BOOST,
  name: 'Langstrecke',
  description: '+3 Reichweite',
  color: '#3498db',
  cost: { steel: 50, electronics: 30 },
  appliesTo: [
    TileType.TURRET, TileType.HEAVY_TURRET, TileType.TESLA_COIL,
    TileType.PLASMA_CANNON, TileType.LASER_TURRET, TileType.DRONE_HANGAR,
    TileType.REPAIR_BAY, TileType.SLOW_FIELD, TileType.SHIELD_GENERATOR,
    TileType.RADAR_STATION,
  ],
  requiresUnlock: TileType.RADAR_STATION,
  hooks: {
    onCombatTick(event) {
      event.effectiveRange += 3;
    },
    onAuraTick(event) {
      event.range += 3;
    },
  },
};
