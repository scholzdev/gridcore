import { ModuleType, MODULE_DEFS, TileType } from '../game/Grid';

interface ModuleSidebarProps {
  selectedModule: ModuleType;
  setSelectedModule: (m: ModuleType) => void;
  setSelectedBuilding: (t: TileType) => void;
  canAffordModule: (m: ModuleType) => boolean;
}

export const ModuleSidebar = ({ selectedModule, setSelectedModule, setSelectedBuilding, canAffordModule }: ModuleSidebarProps) => (
  <div style={{ width: '260px', padding: '15px', borderLeft: '1px solid #dfe4ea', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', backgroundColor: '#ffffff' }}>
    <h3 style={{ margin: '0', fontSize: '14px', color: '#7f8c8d' }}>MODULE</h3>
    <div style={{ fontSize: '11px', opacity: 0.5, marginBottom: '4px' }}>Wähle ein Modul, dann klicke auf ein Gebäude zum Installieren.</div>
    {Object.entries(MODULE_DEFS).map(([key, def]) => {
      const modType = Number(key) as ModuleType;
      const costParts: string[] = [];
      if (def.cost.steel) costParts.push(`${def.cost.steel} Stahl`);
      if (def.cost.electronics) costParts.push(`${def.cost.electronics} E-Komp`);
      if (def.cost.data) costParts.push(`${def.cost.data} Daten`);
      return (
        <button key={key} onClick={() => { setSelectedModule(modType === selectedModule ? ModuleType.NONE : modType); setSelectedBuilding(TileType.SOLAR_PANEL); }} style={{
          padding: '10px', textAlign: 'left', cursor: 'pointer', borderRadius: '8px',
          backgroundColor: selectedModule === modType ? '#f1f2f6' : 'transparent',
          border: selectedModule === modType ? `2px solid ${def.color}` : '1px solid #dfe4ea',
          color: '#2d3436', display: 'flex', alignItems: 'center', gap: '10px',
          opacity: canAffordModule(modType) ? 1 : 0.35
        }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: def.color, flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{def.name}</span>
            <span style={{ fontSize: '11px', opacity: 0.6 }}>{def.description}</span>
            <span style={{ fontSize: '11px', opacity: 0.5, marginTop: '2px' }}>{costParts.join(' / ')}</span>
          </div>
        </button>
      );
    })}
  </div>
);
