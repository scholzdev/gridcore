import React from 'react';
import { ModuleType, MODULE_DEFS, TileType, TECH_TREE } from '../config';
import type { TechNode } from '../config';

interface ModuleSidebarProps {
  selectedModule: ModuleType;
  setSelectedModule: (m: ModuleType) => void;
  setSelectedBuilding: (t: TileType) => void;
  canAffordModule: (m: ModuleType) => boolean;
  unlockedBuildings: Set<TileType>;
}

export const ModuleSidebar = ({ selectedModule, setSelectedModule, setSelectedBuilding, canAffordModule, unlockedBuildings }: ModuleSidebarProps) => {
  const [hoveredLocked, setHoveredLocked] = React.useState<string | null>(null);

  return (
    <div style={{ width: '260px', padding: '15px', borderLeft: '1px solid #dfe4ea', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', backgroundColor: '#ffffff' }}>
      <h3 style={{ margin: '0', fontSize: '14px', color: '#7f8c8d' }}>MODULE</h3>
      <div style={{ fontSize: '11px', opacity: 0.5, marginBottom: '4px' }}>Wähle ein Modul, dann klicke auf ein Gebäude zum Installieren.</div>
      {Object.entries(MODULE_DEFS).map(([key, def]) => {
        const modType = Number(key) as ModuleType;
        const locked = def.requiresUnlock != null && !unlockedBuildings.has(def.requiresUnlock);
        if (locked) {
          const techNode = TECH_TREE.find(n => n.unlocks === def.requiresUnlock);
          const costParts: string[] = [];
          if (def.cost.steel) costParts.push(`${def.cost.steel} Stahl`);
          if (def.cost.electronics) costParts.push(`${def.cost.electronics} Elektronik`);
          if (def.cost.data) costParts.push(`${def.cost.data} Daten`);
          const isHovered = hoveredLocked === key;
          return (
            <button key={key} disabled onMouseEnter={() => setHoveredLocked(key)} onMouseLeave={() => setHoveredLocked(null)} style={{
              padding: '10px', backgroundColor: '#f8f9fa',
              border: '1px solid #dfe4ea', color: '#b2bec3',
              textAlign: 'left', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '10px',
              borderRadius: '8px', opacity: 0.6, width: '100%'
            }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#dfe4ea', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>🔒</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{def.name}</span>
                {isHovered ? (
                  <>
                    <span style={{ fontSize: '11px', color: '#636e72', marginTop: '2px' }}>{def.description}</span>
                    <span style={{ fontSize: '11px', color: '#636e72', marginTop: '2px' }}>{costParts.join(' / ')}</span>
                    <span style={{ fontSize: '11px', color: '#e17055', marginTop: '2px' }}>🔒 {techNode ? techNode.name : 'Gesperrt'}</span>
                  </>
                ) : (
                  <span style={{ fontSize: '11px' }}>{techNode ? `Benötigt: ${techNode.name}` : 'Gesperrt'}</span>
                )}
              </div>
            </button>
          );
        }
        const costParts: string[] = [];
        if (def.cost.steel) costParts.push(`${def.cost.steel} Stahl`);
        if (def.cost.electronics) costParts.push(`${def.cost.electronics} Elektronik`);
        if (def.cost.data) costParts.push(`${def.cost.data} Daten`);
        return (
          <button key={key} onClick={canAffordModule(modType) ? () => { setSelectedModule(modType === selectedModule ? ModuleType.NONE : modType); setSelectedBuilding(TileType.SOLAR_PANEL); } : undefined} disabled={!canAffordModule(modType)} style={{
            padding: '10px', textAlign: 'left', cursor: canAffordModule(modType) ? 'pointer' : 'not-allowed', borderRadius: '8px',
            backgroundColor: selectedModule === modType ? '#f1f2f6' : 'transparent',
            border: selectedModule === modType ? `2px solid ${def.color}` : '1px solid #dfe4ea',
            color: '#2d3436', display: 'flex', alignItems: 'center', gap: '10px',
            opacity: canAffordModule(modType) ? 1 : 0.55
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
};
