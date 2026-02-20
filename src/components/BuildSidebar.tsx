import { TileType, ModuleType } from '../config';
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
        <BuildBtn type={TileType.HYPER_REACTOR} selected={sel} set={set} label="Hyperreaktor" cost={getCostString(TileType.HYPER_REACTOR)} color="#ffbe0b" affordable={canAffordBuilding(TileType.HYPER_REACTOR)} locked={!unlockedBuildings.has(TileType.HYPER_REACTOR)} />
      </BuildGroup>
      <BuildGroup label="Verteidigung">
        <BuildBtn type={TileType.TURRET} selected={sel} set={set} label="Wächtergeschütz" cost={getCostString(TileType.TURRET)} color="#e67e22" affordable={canAffordBuilding(TileType.TURRET)} />
        <BuildBtn type={TileType.HEAVY_TURRET} selected={sel} set={set} label="Sturmgeschütz" cost={getCostString(TileType.HEAVY_TURRET)} color="#c0392b" affordable={canAffordBuilding(TileType.HEAVY_TURRET)} locked={!unlockedBuildings.has(TileType.HEAVY_TURRET)} />
        <BuildBtn type={TileType.TESLA_COIL} selected={sel} set={set} label="Teslaspule" cost={getCostString(TileType.TESLA_COIL)} color="#6c5ce7" affordable={canAffordBuilding(TileType.TESLA_COIL)} locked={!unlockedBuildings.has(TileType.TESLA_COIL)} />
        <BuildBtn type={TileType.PLASMA_CANNON} selected={sel} set={set} label="Plasmakanone" cost={getCostString(TileType.PLASMA_CANNON)} color="#fd79a8" affordable={canAffordBuilding(TileType.PLASMA_CANNON)} locked={!unlockedBuildings.has(TileType.PLASMA_CANNON)} />
        <BuildBtn type={TileType.LASER_TURRET} selected={sel} set={set} label="Laserturm" cost={getCostString(TileType.LASER_TURRET)} color="#e84393" affordable={canAffordBuilding(TileType.LASER_TURRET)} locked={!unlockedBuildings.has(TileType.LASER_TURRET)} />
        <BuildBtn type={TileType.MINEFIELD} selected={sel} set={set} label="Minenfeld" cost={getCostString(TileType.MINEFIELD)} color="#d63031" affordable={canAffordBuilding(TileType.MINEFIELD)} locked={!unlockedBuildings.has(TileType.MINEFIELD)} />
        <BuildBtn type={TileType.DRONE_HANGAR} selected={sel} set={set} label="Drohnenhangar" cost={getCostString(TileType.DRONE_HANGAR)} color="#0984e3" affordable={canAffordBuilding(TileType.DRONE_HANGAR)} locked={!unlockedBuildings.has(TileType.DRONE_HANGAR)} />
        <BuildBtn type={TileType.ARTILLERY} selected={sel} set={set} label="Artillerie" cost={getCostString(TileType.ARTILLERY)} color="#2c3e50" affordable={canAffordBuilding(TileType.ARTILLERY)} locked={!unlockedBuildings.has(TileType.ARTILLERY)} />
        <BuildBtn type={TileType.ION_CANNON} selected={sel} set={set} label="Ionenkanone" cost={getCostString(TileType.ION_CANNON)} color="#00b4d8" affordable={canAffordBuilding(TileType.ION_CANNON)} locked={!unlockedBuildings.has(TileType.ION_CANNON)} />
        <BuildBtn type={TileType.SHOCKWAVE_TOWER} selected={sel} set={set} label="Schockwellen-Turm" cost={getCostString(TileType.SHOCKWAVE_TOWER)} color="#e63946" affordable={canAffordBuilding(TileType.SHOCKWAVE_TOWER)} locked={!unlockedBuildings.has(TileType.SHOCKWAVE_TOWER)} />
        <BuildBtn type={TileType.ANNIHILATOR} selected={sel} set={set} label="Annihilator" cost={getCostString(TileType.ANNIHILATOR)} color="#ff006e" affordable={canAffordBuilding(TileType.ANNIHILATOR)} locked={!unlockedBuildings.has(TileType.ANNIHILATOR)} />
        <BuildBtn type={TileType.OVERDRIVE_TURRET} selected={sel} set={set} label="Overdrivegeschütz" cost={getCostString(TileType.OVERDRIVE_TURRET)} color="#e63946" affordable={canAffordBuilding(TileType.OVERDRIVE_TURRET)} locked={!unlockedBuildings.has(TileType.OVERDRIVE_TURRET)} />
      </BuildGroup>
      <BuildGroup label="Unterstützung">
        <BuildBtn type={TileType.SLOW_FIELD} selected={sel} set={set} label="EMP-Feld" cost={getCostString(TileType.SLOW_FIELD)} color="#a29bfe" affordable={canAffordBuilding(TileType.SLOW_FIELD)} locked={!unlockedBuildings.has(TileType.SLOW_FIELD)} />
        <BuildBtn type={TileType.SHIELD_GENERATOR} selected={sel} set={set} label="Schildgenerator" cost={getCostString(TileType.SHIELD_GENERATOR)} color="#74b9ff" affordable={canAffordBuilding(TileType.SHIELD_GENERATOR)} locked={!unlockedBuildings.has(TileType.SHIELD_GENERATOR)} />
        <BuildBtn type={TileType.RADAR_STATION} selected={sel} set={set} label="Radarstation" cost={getCostString(TileType.RADAR_STATION)} color="#fdcb6e" affordable={canAffordBuilding(TileType.RADAR_STATION)} locked={!unlockedBuildings.has(TileType.RADAR_STATION)} />
        <BuildBtn type={TileType.ENERGY_RELAY} selected={sel} set={set} label="Energierelais" cost={getCostString(TileType.ENERGY_RELAY)} color="#00b894" affordable={canAffordBuilding(TileType.ENERGY_RELAY)} locked={!unlockedBuildings.has(TileType.ENERGY_RELAY)} />
        <BuildBtn type={TileType.COMMAND_CENTER} selected={sel} set={set} label="Kommandozentrale" cost={getCostString(TileType.COMMAND_CENTER)} color="#f39c12" affordable={canAffordBuilding(TileType.COMMAND_CENTER)} locked={!unlockedBuildings.has(TileType.COMMAND_CENTER)} />
        <BuildBtn type={TileType.NANITE_DOME} selected={sel} set={set} label="Naniten-Kuppel" cost={getCostString(TileType.NANITE_DOME)} color="#06d6a0" affordable={canAffordBuilding(TileType.NANITE_DOME)} locked={!unlockedBuildings.has(TileType.NANITE_DOME)} />
        <BuildBtn type={TileType.GRAVITY_CANNON} selected={sel} set={set} label="Gravitationskanone" cost={getCostString(TileType.GRAVITY_CANNON)} color="#8338ec" affordable={canAffordBuilding(TileType.GRAVITY_CANNON)} locked={!unlockedBuildings.has(TileType.GRAVITY_CANNON)} />
      </BuildGroup>
      <BuildGroup label="Verarbeitung">
        <BuildBtn type={TileType.FOUNDRY} selected={sel} set={set} label="Gießerei" cost={getCostString(TileType.FOUNDRY)} color="#ff9f43" affordable={canAffordBuilding(TileType.FOUNDRY)} locked={!unlockedBuildings.has(TileType.FOUNDRY)} />
        <BuildBtn type={TileType.FABRICATOR} selected={sel} set={set} label="E-Fabrik" cost={getCostString(TileType.FABRICATOR)} color="#1dd1a1" affordable={canAffordBuilding(TileType.FABRICATOR)} locked={!unlockedBuildings.has(TileType.FABRICATOR)} />
        <BuildBtn type={TileType.RECYCLER} selected={sel} set={set} label="Recycler" cost={getCostString(TileType.RECYCLER)} color="#55efc4" affordable={canAffordBuilding(TileType.RECYCLER)} locked={!unlockedBuildings.has(TileType.RECYCLER)} />
        <BuildBtn type={TileType.FUSION_REACTOR} selected={sel} set={set} label="Fusionsreaktor" cost={getCostString(TileType.FUSION_REACTOR)} color="#e056a0" affordable={canAffordBuilding(TileType.FUSION_REACTOR)} locked={!unlockedBuildings.has(TileType.FUSION_REACTOR)} />
        <BuildBtn type={TileType.QUANTUM_FACTORY} selected={sel} set={set} label="Quantenfabrik" cost={getCostString(TileType.QUANTUM_FACTORY)} color="#7209b7" affordable={canAffordBuilding(TileType.QUANTUM_FACTORY)} locked={!unlockedBuildings.has(TileType.QUANTUM_FACTORY)} />
      </BuildGroup>
      <BuildGroup label="Forschung">
        <BuildBtn type={TileType.LAB} selected={selectedBuilding} set={set} label="Forschungslabor" cost={getCostString(TileType.LAB)} color="#54a0ff" affordable={canAffordBuilding(TileType.LAB)} locked={!unlockedBuildings.has(TileType.LAB)} />
        <BuildBtn type={TileType.DATA_VAULT} selected={selectedBuilding} set={set} label="Datentresor" cost={getCostString(TileType.DATA_VAULT)} color="#00cec9" affordable={canAffordBuilding(TileType.DATA_VAULT)} locked={!unlockedBuildings.has(TileType.DATA_VAULT)} />
      </BuildGroup>
    </div>
  );
};
