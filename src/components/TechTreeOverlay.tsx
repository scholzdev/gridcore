import { TileType } from '../game/Grid';
import { TECH_TREE } from '../game/TechTree';
import type { TechNode } from '../game/TechTree';
import { TechNodeCard } from './TechNodeCard';

interface TechTreeOverlayProps {
  killPoints: number;
  unlockedBuildings: Set<TileType>;
  onUnlock: (node: TechNode) => void;
  onClose: () => void;
  onReset: () => void;
}

export const TechTreeOverlay = ({ killPoints, unlockedBuildings, onUnlock, onClose, onReset }: TechTreeOverlayProps) => (
  <div onClick={onClose} style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 900,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
    <div onClick={(e) => e.stopPropagation()} style={{
      backgroundColor: '#fff', borderRadius: '16px', padding: '30px',
      maxWidth: '1100px', width: '95%', maxHeight: '90vh', overflowY: 'auto',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', color: '#2d3436' }}>🔬 Techbaum</h2>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#7f8c8d'
        }}>✕</button>
      </div>
      {[1, 2, 3, 4].map(tier => {
        const tierNodes = TECH_TREE.filter((n: TechNode) => n.tier === tier);
        const tierLabels = ['', 'Basis', 'Erweitert', 'Fortgeschritten', 'Elite'];
        const tierColors = ['', '#27ae60', '#f39c12', '#e74c3c', '#8e44ad'];
        return (
          <div key={tier} style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '11px', fontWeight: 'bold', color: tierColors[tier],
              textTransform: 'uppercase', marginBottom: '8px',
              borderBottom: `2px solid ${tierColors[tier]}30`, paddingBottom: '4px'
            }}>
              Tier {tier} — {tierLabels[tier]} · {tierNodes[0]?.killCost} KP pro Gebäude
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tierNodes.length}, 1fr)`, gap: '8px', alignItems: 'stretch' }}>
              {tierNodes.map((node: TechNode) => (
                <TechNodeCard
                  key={node.id}
                  node={node}
                  isUnlocked={unlockedBuildings.has(node.unlocks)}
                  canAfford={killPoints >= node.killCost}
                  onUnlock={() => onUnlock(node)}
                />
              ))}
            </div>
          </div>
        );
      })}
      <div style={{
        textAlign: 'center', marginTop: '12px', paddingTop: '12px',
        borderTop: '1px solid #dfe4ea'
      }}>
        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#8e44ad' }}>{killPoints} KP</span>
        <div style={{ fontSize: '11px', color: '#b2bec3', marginTop: '4px' }}>
          Drücke T zum Schließen · Besiege Gegner für KP
        </div>
        <button onClick={onReset} style={{
          marginTop: '8px', padding: '4px 12px', borderRadius: '6px', fontSize: '11px',
          fontFamily: 'monospace', cursor: 'pointer', backgroundColor: 'transparent',
          color: '#b2bec3', border: '1px solid #dfe4ea', transition: 'all 0.15s'
        }}>↺ Fortschritt zurücksetzen</button>
      </div>
    </div>
  </div>
);
