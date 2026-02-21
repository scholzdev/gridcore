import { useRef, useEffect, useState, useCallback } from 'react';
import { TileType, TECH_TREE } from '../config';
import type { TechNode } from '../config';
import { TechNodeCard } from './TechNodeCard';

interface TechTreeOverlayProps {
  killPoints: number;
  unlockedBuildings: Set<TileType>;
  onUnlock: (node: TechNode) => void;
  onClose: () => void;
  onReset: () => void;
}

const tierLabels = ['', 'Basis', 'Erweitert', 'Fortgeschritten', 'Elite', 'Legendär', 'Ultimativ'];
const tierColors = ['', '#27ae60', '#f39c12', '#e74c3c', '#8e44ad', '#2c3e50', '#ff006e'];

export const TechTreeOverlay = ({ killPoints, unlockedBuildings, onUnlock, onClose, onReset }: TechTreeOverlayProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; color: string }[]>([]);

  const computeLines = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const tierEls = container.querySelectorAll('[data-tier]');
    const newLines: typeof lines = [];

    // Connect each tier to the next
    for (let i = 0; i < tierEls.length - 1; i++) {
      const currentTier = tierEls[i];
      const nextTier = tierEls[i + 1];
      const tier = parseInt(currentTier.getAttribute('data-tier') || '0');
      const currentCards = currentTier.querySelectorAll('[data-node]');
      const nextCards = nextTier.querySelectorAll('[data-node]');
      const containerRect = container.getBoundingClientRect();

      // Connect bottom center of each card in current tier to top center of each card in next tier
      currentCards.forEach(cc => {
        const cRect = cc.getBoundingClientRect();
        const cx = cRect.left + cRect.width / 2 - containerRect.left;
        const cy = cRect.bottom - containerRect.top;

        nextCards.forEach(nc => {
          const nRect = nc.getBoundingClientRect();
          const nx = nRect.left + nRect.width / 2 - containerRect.left;
          const ny = nRect.top - containerRect.top;

          newLines.push({ x1: cx, y1: cy, x2: nx, y2: ny, color: tierColors[tier + 1] || '#dfe4ea' });
        });
      });
    }
    setLines(newLines);
  }, []);

  useEffect(() => {
    const timer = setTimeout(computeLines, 100);
    window.addEventListener('resize', computeLines);
    return () => { clearTimeout(timer); window.removeEventListener('resize', computeLines); };
  }, [computeLines]);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 900,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: '#fff', borderRadius: '12px', padding: '20px',
        maxWidth: '950px', width: '92%', maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column',
        position: 'relative'
      }} ref={containerRef}>
        {/* SVG connection lines */}
        <svg style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          pointerEvents: 'none', zIndex: 0, overflow: 'visible'
        }}>
          {lines.map((l, i) => (
            <line key={i}
              x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke={l.color}
              strokeWidth={1.5}
              strokeOpacity={0.2}
              strokeDasharray="4 3"
            />
          ))}
        </svg>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#2d3436' }}>🔬 Techbaum</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#7f8c8d'
          }}>✕</button>
        </div>

        {[1, 2, 3, 4, 5, 6].map(tier => {
          const tierNodes = TECH_TREE.filter((n: TechNode) => n.tier === tier);
          if (tierNodes.length === 0) return null;
          return (
            <div key={tier} data-tier={tier} style={{ marginBottom: '20px', position: 'relative', zIndex: 1 }}>
              <div style={{
                fontSize: '12px', fontWeight: 'bold', color: tierColors[tier],
                textTransform: 'uppercase', marginBottom: '10px',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  backgroundColor: tierColors[tier], color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 'bold', flexShrink: 0
                }}>{tier}</div>
                <span>{tierLabels[tier]}</span>
                <div style={{ flex: 1, height: '2px', backgroundColor: `${tierColors[tier]}30` }} />
                <span style={{ fontSize: '10px', color: '#7f8c8d', fontWeight: 'normal' }}>{tierNodes[0]?.killCost} KP</span>
              </div>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '10px',
                justifyContent: 'center', alignItems: 'stretch'
              }}>
                {tierNodes.map((node: TechNode) => (
                  <div key={node.id} data-node={node.id} style={{ width: '160px', flexShrink: 0 }}>
                    <TechNodeCard
                      node={node}
                      isUnlocked={unlockedBuildings.has(node.unlocks)}
                      canAfford={killPoints >= node.killCost}
                      onUnlock={() => onUnlock(node)}
                    />
                  </div>
                ))}
              </div>
              {/* Arrow connector to next tier */}
              {tier < 6 && TECH_TREE.some(n => n.tier === tier + 1) && (
                <div style={{
                  display: 'flex', justifyContent: 'center', marginTop: '8px',
                  color: tierColors[tier + 1], fontSize: '18px', opacity: 0.4
                }}>▼</div>
              )}
            </div>
          );
        })}

        <div style={{
          textAlign: 'center', marginTop: '12px', paddingTop: '12px',
          borderTop: '1px solid #dfe4ea', position: 'relative', zIndex: 1
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
};
