import { RESEARCH_NODES, getResearchLevel, getResearchCost, canResearch } from '../game/Research';
import type { ResearchState } from '../game/Research';

interface ResearchOverlayProps {
  research: ResearchState;
  dataAvailable: number;
  onResearch: (nodeId: string) => void;
  onClose: () => void;
}

export const ResearchOverlay = ({ research, dataAvailable, onResearch, onClose }: ResearchOverlayProps) => {
  const tiers = [1, 2, 3, 4];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000,
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '12px', padding: '24px', minWidth: '560px', maxWidth: '700px',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.3)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#2d3436' }}>🔬 Forschungsbaum 2.0</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#3498db' }}>📊 {Math.floor(dataAvailable)} Daten</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#7f8c8d' }}>✕</button>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '20px' }}>
          Investiere Daten in Run-Buffs. Forschung wird bei Game Over zurückgesetzt.
        </div>

        {tiers.map(tier => {
          const nodes = RESEARCH_NODES.filter(n => n.tier === tier);
          if (nodes.length === 0) return null;
          return (
            <div key={tier} style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#7f8c8d', textTransform: 'uppercase', marginBottom: '8px' }}>
                Tier {tier}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {nodes.map(node => {
                  const level = getResearchLevel(research, node.id);
                  const maxed = level >= node.maxLevel;
                  const cost = maxed ? 0 : getResearchCost(node, level);
                  const available = canResearch(research, node, dataAvailable);
                  const reqNode = node.requires ? RESEARCH_NODES.find(n => n.id === node.requires) : null;
                  const reqMet = !node.requires || getResearchLevel(research, node.requires) >= 1;

                  return (
                    <div key={node.id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                      borderRadius: '8px', backgroundColor: maxed ? '#f0fff0' : '#f8f9fa',
                      border: `1px solid ${maxed ? '#27ae60' : reqMet ? '#dfe4ea' : '#e74c3c30'}`,
                      opacity: reqMet ? 1 : 0.55,
                    }}>
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                        backgroundColor: node.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '10px', fontWeight: 'bold', color: '#fff'
                      }}>
                        {level}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2d3436' }}>
                          {node.name}
                          <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#7f8c8d', marginLeft: '6px' }}>
                            {level}/{node.maxLevel}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#636e72', marginTop: '2px' }}>{node.description}</div>
                        {!reqMet && reqNode && (
                          <div style={{ fontSize: '10px', color: '#e74c3c', marginTop: '2px' }}>
                            Benötigt: {reqNode.name}
                          </div>
                        )}
                      </div>
                      {!maxed ? (
                        <button onClick={() => onResearch(node.id)} disabled={!available} style={{
                          padding: '5px 12px', borderRadius: '6px', cursor: available ? 'pointer' : 'not-allowed',
                          border: '1px solid #dfe4ea', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace',
                          backgroundColor: available ? '#3498db' : '#f8f9fa',
                          color: available ? '#fff' : '#b2bec3',
                          opacity: available ? 1 : 0.55,
                        }}>
                          {cost} 📊
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#27ae60', fontWeight: 'bold' }}>✓ MAX</span>
                      )}
                      {/* Level pips */}
                      <div style={{ display: 'flex', gap: '3px' }}>
                        {Array.from({ length: node.maxLevel }, (_, i) => (
                          <div key={i} style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            backgroundColor: i < level ? node.color : '#dfe4ea',
                          }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div style={{ fontSize: '11px', color: '#b2bec3', marginTop: '8px', fontStyle: 'italic' }}>
          Hotkey: F • Buffs gelten nur für den aktuellen Run
        </div>
      </div>
    </div>
  );
};
