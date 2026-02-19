import { TileType } from '../game/Grid';

export const BUILDING_DESC: Record<number, string> = {
  [TileType.SOLAR_PANEL]: 'Erzeugt Energie. Überall platzierbar.',
  [TileType.MINER]: 'Baut Schrott ab. Auf Erzvorkommen platzieren.',
  [TileType.WALL]: 'Hohe HP-Barriere. Blockiert Gegner.',
  [TileType.TURRET]: 'Schießt auf nahe Gegner. Reichweite 6.',
  [TileType.HEAVY_TURRET]: 'Hoher Schaden, große Reichweite. Reichweite 12.',
  [TileType.TESLA_COIL]: 'Trifft 3+ Ziele gleichzeitig. Reichweite 5. Verbraucht Energie.',
  [TileType.PLASMA_CANNON]: 'Flächenschaden-Kanone. Reichweite 10. Verbraucht Energie.',
  [TileType.SLOW_FIELD]: 'Verlangsamt Gegner im Bereich. Reichweite 5. Verbraucht Energie.',
  [TileType.SHIELD_GENERATOR]: 'Schirmt Gebäude im Bereich ab. Reichweite 4. Verbraucht Energie.',
  [TileType.RADAR_STATION]: 'Erhöht Geschützreichweite. Reichweite 5. Verbraucht Energie.',
  [TileType.REPAIR_BAY]: 'Repariert Gebäude im Bereich. Reichweite 3. Verbraucht Energie.',
  [TileType.FOUNDRY]: 'Wandelt Schrott+Energie → Stahl um.',
  [TileType.FABRICATOR]: 'Wandelt Schrott+Energie → E-Komp um.',
  [TileType.RECYCLER]: 'Wandelt Schrott+Energie → Stahl+E-Komp um.',
  [TileType.LAB]: 'Wandelt Energie+E-Komp → Daten um.',
  [TileType.DATA_VAULT]: 'Verstärkt Geschützschaden +15%. Verbraucht Energie+Daten.',
  [TileType.LASER_TURRET]: 'Kontinuierlicher Laserstrahl. Schaden steigt mit Fokuszeit bis 3×.',
  [TileType.MINEFIELD]: 'Explodiert bei Feindkontakt. Flächenschaden. Einmalverwendung.',
  [TileType.DRONE_HANGAR]: 'Spawnt autonome Drohnen die Gegner verfolgen. 2+Level Drohnen.',
};

export const BUILDING_COLORS: Record<number, string> = {
  [TileType.SOLAR_PANEL]: '#f1c40f', [TileType.MINER]: '#9b59b6', [TileType.WALL]: '#576574',
  [TileType.TURRET]: '#e67e22', [TileType.HEAVY_TURRET]: '#c0392b', [TileType.TESLA_COIL]: '#6c5ce7',
  [TileType.PLASMA_CANNON]: '#fd79a8', [TileType.SLOW_FIELD]: '#a29bfe', [TileType.SHIELD_GENERATOR]: '#74b9ff',
  [TileType.RADAR_STATION]: '#fdcb6e', [TileType.REPAIR_BAY]: '#e056a0', [TileType.FOUNDRY]: '#ff9f43',
  [TileType.FABRICATOR]: '#1dd1a1', [TileType.RECYCLER]: '#55efc4', [TileType.LAB]: '#54a0ff',
  [TileType.DATA_VAULT]: '#00cec9',
  [TileType.LASER_TURRET]: '#e84393',
  [TileType.MINEFIELD]: '#d63031',
  [TileType.DRONE_HANGAR]: '#0984e3',
};

export const scaleVals = (base: number) =>
  [1, 1.5, 2, 2.5, 3].map(m => Math.round(base * m * 10) / 10).join(' / ');
