import { TileType } from '../types';
import type { BuildingConfig } from '../types';

export const CORE_CONFIG: BuildingConfig = {
  id: TileType.CORE,
  name: 'Kern',
  description: 'Das Herz deiner Basis. Wenn der Kern fällt, ist das Spiel vorbei.',
  color: '#00d2d3',
  category: 'core',
  health: 5000,
  order: 0,
};
