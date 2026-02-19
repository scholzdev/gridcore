import { PRESTIGE_UPGRADES, getUpgradeCost, getAvailablePoints } from '../game/Prestige';
import type { PrestigeData } from '../game/Prestige';

interface PrestigeOverlayProps {
  prestige: PrestigeData;
  onBuy: (key: string) => void;
  onClose: () => void;
  onReset: () => void;
}

export const PrestigeOverlay = ({ prestige, onBuy, onClose, onReset }: PrestigeOverlayProps) => {
  const available = getAvailablePoints(prestige);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 900,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: '#fff', borderRadius: '16px', padding: '30px',
        maxWidth: '600px', width: '95%', maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#2d3436' }}>⭐ Prestige</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#7f8c8d'
          }}>✕</button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#f39c12' }}>{available}</span>
          <span style={{ fontSize: '14px', color: '#7f8c8d', marginLeft: '8px' }}>verfügbare Punkte</span>
          <div style={{ fontSize: '11px', color: '#b2bec3', marginTop: '4px' }}>
            Gesamt verdient: {prestige.totalPoints}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {PRESTIGE_UPGRADES.map(upg => {
            const currentLvl = prestige.bonuses[upg.key];
            const cost = getUpgradeCost(currentLvl, upg.costBase);
            const maxed = currentLvl >= upg.maxLevel;
            const canBuy = !maxed && available >= cost;
            return (
              <div key={upg.key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: '10px',
                backgroundColor: maxed ? '#f0f0f0' : '#fafafa',
                border: `1px solid ${maxed ? '#dfe4ea' : '#f39c1240'}`
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#2d3436' }}>
                    {upg.name}
                    <span style={{ fontSize: '11px', color: '#f39c12', marginLeft: '8px' }}>
                      Stufe {currentLvl}/{upg.maxLevel}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '2px' }}>{upg.desc}</div>
                  {currentLvl > 0 && (
                    <div style={{ fontSize: '10px', color: '#27ae60', marginTop: '2px' }}>
                      Aktuell: {upg.effectLabel} × {currentLvl}
                    </div>
                  )}
                </div>
                <button
                  disabled={!canBuy}
                  onClick={() => canBuy && onBuy(upg.key)}
                  style={{
                    padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                    fontFamily: 'monospace', cursor: canBuy ? 'pointer' : 'default',
                    backgroundColor: maxed ? '#dfe4ea' : canBuy ? '#f39c12' : '#e0e0e0',
                    color: maxed ? '#b2bec3' : canBuy ? '#fff' : '#999',
                    border: 'none', minWidth: '80px'
                  }}
                >
                  {maxed ? 'MAX' : `${cost} PP`}
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #dfe4ea' }}>
          <div style={{ fontSize: '11px', color: '#b2bec3', marginBottom: '8px' }}>
            Punkte werden beim Spielende verdient (Kills + Zeit)
          </div>
          <button onClick={onReset} style={{
            padding: '4px 12px', borderRadius: '6px', fontSize: '11px',
            fontFamily: 'monospace', cursor: 'pointer', backgroundColor: 'transparent',
            color: '#b2bec3', border: '1px solid #dfe4ea'
          }}>↺ Prestige zurücksetzen</button>
        </div>
      </div>
    </div>
  );
};
