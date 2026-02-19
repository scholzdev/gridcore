import { TileType, ModuleType } from '../game/Grid';
import { BuildBtn, BuildGroup } from './BuildBtn';

interface BuildSidebarProps {
  selectedBuilding: TileType;
  selectedModule: ModuleType;
  unlockedBuildings: Set<TileType>;
  setSelectedBuilding: (t: TileType) => void;
  setSelectedModule: (m: ModuleType) => void;
  canAffordBuilding: (t: TileType) => boolean;
  getCostString: (t: TileType) => string;
}

export const BuildSidebar = ({
  selectedBuilding, selectedModule, unlockedBuildings,
  setSelectedBuilding, setSelectedModule, canAffordBuilding, getCostString
}: BuildSidebarProps) => {
  const sel = selectedModule === ModuleType.NONE ? selectedBuilding : -1;
  const set = (t: TileType) => { setSelectedBuilding(t); setSelectedModule(ModuleType.NONE); };

  return (
    <div style={{ width: '260px', padding: '15px', borderRight: '1px solid #dfe4ea', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', backgroundColor: '#ffffff' }}>
      <h3 style={{ margin: '0', fontSize: '14px', color: '#7f8c8d' }}>KONSTRUKTION</h3>
      <BuildGroup label="Infrastruktur">
        <BuildBtn type={TileType.SOLAR_PANEL} selected={sel} set={set} label="Solarfeld" cost={getCostString(TileType.SOLAR_PANEL)} color="#f1c40f" affordable={canAffordBuilding(TileType.SOLAR_PANEL)} />
        <BuildBtn type={TileType.MINER} selected={sel} set={set} label="Schrottbohrer" cost={getCostString(TileType.MINER)} color="#9b59b6" affordable={canAffordBuilding(TileType.MINER)} />
        <BuildBtn type={TileType.WALL} selected={sel} set={set} label="Schwere Mauer" cost={getCostString(TileType.WALL)} color="#576574" affordable={canAffordBuilding(TileType.WALL)} />
        <BuildBtn type={TileType.STEEL_SMELTER} selected={sel} set={set} label="Stahlschmelze" cost={getCostString(TileType.STEEL_SMELTER)} color="#e17055" affordable={canAffordBuilding(TileType.STEEL_SMELTER)} locked={!unlockedBuildings.has(TileType.STEEL_SMELTER)} />
        <BuildBtn type={TileType.CRYSTAL_DRILL} selected={sel} set={set} label="Kristallbohrer" cost={getCostString(TileType.CRYSTAL_DRILL)} color="#1abc9c" affordable={canAffordBuilding(TileType.CRYSTAL_DRILL)} locked={!unlockedBuildings.has(TileType.CRYSTAL_DRILL)} />
        <BuildBtn type={TileType.REPAIR_BAY} selected={sel} set={set} label="Reparaturbucht" cost={getCostString(TileType.REPAIR_BAY)} color="#e056a0" affordable={canAffordBuilding(TileType.REPAIR_BAY)} locked={!unlockedBuildings.has(TileType.REPAIR_BAY)} />
      </BuildGroup>
      <BuildGroup label="Verteidigung">
        <BuildBtn type={TileType.TURRET} selected={sel} set={set} label="Wächtergeschütz" cost={getCostString(TileType.TURRET)} color="#e67e22" affordable={canAffordBuilding(TileType.TURRET)} />
        <BuildBtn type={TileType.HEAVY_TURRET} selected={sel} set={set} label="Sturmgeschütz" cost={getCostString(TileType.HEAVY_TURRET)} color="#c0392b" affordable={canAffordBuilding(TileType.HEAVY_TURRET)} locked={!unlockedBuildings.has(TileType.HEAVY_TURRET)} />
        <BuildBtn type={TileType.TESLA_COIL} selected={sel} set={set} label="Teslaspule" cost={getCostString(TileType.TESLA_COIL)} color="#6c5ce7" affordable={canAffordBuilding(TileType.TESLA_COIL)} locked={!unlockedBuildings.has(TileType.TESLA_COIL)} />
        <BuildBtn type={TileType.PLASMA_CANNON} selected={sel} set={set} label="Plasmakanone" cost={getCostString(TileType.PLASMA_CANNON)} color="#fd79a8" affordable={canAffordBuilding(TileType.PLASMA_CANNON)} locked={!unlockedBuildings.has(TileType.PLASMA_CANNON)} />
        <BuildBtn type={TileType.LASER_TURRET} selected={sel} set={set} label="Laserturm" cost={getCostString(TileType.LASER_TURRET)} color="#e84393" affordable={canAffordBuilding(TileType.LASER_TURRET)} locked={!unlockedBuildings.has(TileType.LASER_TURRET)} />
        <BuildBtn type={TileType.MINEFIELD} selected={sel} set={set} label="Minenfeld" cost={getCostString(TileType.MINEFIELD)} color="#d63031" affordable={canAffordBuilding(TileType.MINEFIELD)} locked={!unlockedBuildings.has(TileType.MINEFIELD)} />
        <BuildBtn type={TileType.DRONE_HANGAR} selected={sel} set={set} label="Drohnenhangar" cost={getCostString(TileType.DRONE_HANGAR)} color="#0984e3" affordable={canAffordBuilding(TileType.DRONE_HANGAR)} locked={!unlockedBuildings.has(TileType.DRONE_HANGAR)} />
      </BuildGroup>
      <BuildGroup label="Unterstützung">
        <BuildBtn type={TileType.SLOW_FIELD} selected={sel} set={set} label="EMP-Feld" cost={getCostString(TileType.SLOW_FIELD)} color="#a29bfe" affordable={canAffordBuilding(TileType.SLOW_FIELD)} locked={!unlockedBuildings.has(TileType.SLOW_FIELD)} />
        <BuildBtn type={TileType.SHIELD_GENERATOR} selected={sel} set={set} label="Schildgenerator" cost={getCostString(TileType.SHIELD_GENERATOR)} color="#74b9ff" affordable={canAffordBuilding(TileType.SHIELD_GENERATOR)} locked={!unlockedBuildings.has(TileType.SHIELD_GENERATOR)} />
        <BuildBtn type={TileType.RADAR_STATION} selected={sel} set={set} label="Radarstation" cost={getCostString(TileType.RADAR_STATION)} color="#fdcb6e" affordable={canAffordBuilding(TileType.RADAR_STATION)} locked={!unlockedBuildings.has(TileType.RADAR_STATION)} />
      </BuildGroup>
      <BuildGroup label="Verarbeitung">
        <BuildBtn type={TileType.FOUNDRY} selected={sel} set={set} label="Gießerei" cost={getCostString(TileType.FOUNDRY)} color="#ff9f43" affordable={canAffordBuilding(TileType.FOUNDRY)} locked={!unlockedBuildings.has(TileType.FOUNDRY)} />
        <BuildBtn type={TileType.FABRICATOR} selected={sel} set={set} label="E-Fabrik" cost={getCostString(TileType.FABRICATOR)} color="#1dd1a1" affordable={canAffordBuilding(TileType.FABRICATOR)} locked={!unlockedBuildings.has(TileType.FABRICATOR)} />
        <BuildBtn type={TileType.RECYCLER} selected={sel} set={set} label="Recycler" cost={getCostString(TileType.RECYCLER)} color="#55efc4" affordable={canAffordBuilding(TileType.RECYCLER)} locked={!unlockedBuildings.has(TileType.RECYCLER)} />
      </BuildGroup>
      <BuildGroup label="Forschung">
        <BuildBtn type={TileType.LAB} selected={selectedBuilding} set={set} label="Forschungslabor" cost={getCostString(TileType.LAB)} color="#54a0ff" affordable={canAffordBuilding(TileType.LAB)} locked={!unlockedBuildings.has(TileType.LAB)} />
        <BuildBtn type={TileType.DATA_VAULT} selected={selectedBuilding} set={set} label="Datentresor" cost={getCostString(TileType.DATA_VAULT)} color="#00cec9" affordable={canAffordBuilding(TileType.DATA_VAULT)} locked={!unlockedBuildings.has(TileType.DATA_VAULT)} />
      </BuildGroup>
    </div>
  );
};
