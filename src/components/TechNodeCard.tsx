import React from 'react';
import { BUILDING_STATS, BUILDING_DESC, BUILDING_COLORS, scaleVals } from '../config';
import type { TechNode } from '../config';

interface TechNodeCardProps {
  node: TechNode;
  isUnlocked: boolean;
  canAfford: boolean;
  onUnlock: () => void;
}

export const TechNodeCard = ({ node, isUnlocked, canAfford, onUnlock }: TechNodeCardProps) => {
  const [hover, setHover] = React.useState(false);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [shift, setShift] = React.useState(false);

  const bColor = BUILDING_COLORS[node.unlocks] || '#7f8c8d';
  const bStats = BUILDING_STATS[node.unlocks];
  const desc = BUILDING_DESC[node.unlocks] || node.description;

  const costStr = (() => {
    const c = bStats?.cost;
    if (!c) return '';
    const p: string[] = [];
    if (c.scrap) p.push(`${c.scrap} Schrott`);
    if (c.energy) p.push(`${c.energy} Energie`);
    if (c.steel) p.push(`${c.steel} Stahl`);
    if (c.electronics) p.push(`${c.electronics} Elektronik`);
    if (c.data) p.push(`${c.data} Daten`);
    return p.join(' / ');
  })();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'Shift') setShift(true); };
    const up = (e: KeyboardEvent) => { if (e.key === 'Shift') setShift(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const incParts: string[] = [];
  if (bStats?.income?.energy) incParts.push(`+${bStats.income.energy} Energie`);
  if (bStats?.income?.scrap) incParts.push(`+${bStats.income.scrap} Schrott`);
  if (bStats?.income?.steel) incParts.push(`+${bStats.income.steel} Stahl`);
  if (bStats?.income?.electronics) incParts.push(`+${bStats.income.electronics} Elektronik`);
  if (bStats?.income?.data) incParts.push(`+${bStats.income.data} Daten`);
  const conParts: string[] = [];
  if (bStats?.consumes?.energy) conParts.push(`${bStats.consumes.energy} Energie`);
  if (bStats?.consumes?.scrap) conParts.push(`${bStats.consumes.scrap} Schrott`);
  if (bStats?.consumes?.electronics) conParts.push(`${bStats.consumes.electronics} Elektronik`);
  if (bStats?.consumes?.data) conParts.push(`${bStats.consumes.data} Daten`);

  const showDetails = hover && shift;

  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      style={{
        padding: '10px', borderRadius: '8px',
        border: isUnlocked ? `2px solid ${bColor}` : canAfford ? '2px solid #8e44ad' : '1px solid #dfe4ea',
        backgroundColor: isUnlocked ? `${bColor}10` : canAfford ? '#fff' : '#f8f9fa',
        display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'default'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: bColor, flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#2d3436' }}>{node.name}</span>
            {!isUnlocked && <span style={{ fontSize: '12px', flexShrink: 0 }}>🔒</span>}
          </div>
          <span style={{ fontSize: '10px', opacity: 0.6, display: 'block', marginTop: '2px', lineHeight: '1.3' }}>{costStr}</span>
        </div>
      </div>
      {!isUnlocked && (
        <button onClick={onUnlock} disabled={!canAfford} style={{
          marginTop: 'auto', padding: '5px 10px', borderRadius: '6px', fontSize: '11px',
          fontWeight: 'bold', fontFamily: 'monospace', cursor: canAfford ? 'pointer' : 'default',
          backgroundColor: canAfford ? '#8e44ad' : '#dfe4ea',
          color: canAfford ? '#fff' : '#7f8c8d',
          border: 'none', transition: 'all 0.15s', width: '100%'
        }}>
          {canAfford ? `Freischalten (${node.killCost} KP)` : `${node.killCost} KP benötigt`}
        </button>
      )}
      {hover && (
        <div style={{
          position: 'fixed', left: mousePos.x + 15, top: mousePos.y - 10, zIndex: 1100,
          backgroundColor: '#ffffff', border: '2px solid #2d3436',
          padding: '10px 12px', borderRadius: '8px', width: showDetails ? 260 : 200,
          boxShadow: '0 4px 15px rgba(0,0,0,0.25)', pointerEvents: 'none'
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', color: bColor, marginBottom: '6px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
            {node.name} {showDetails && <span style={{ fontSize: '10px', color: '#7f8c8d' }}>Lv 1-5</span>}
          </div>
          <div style={{ fontSize: '11px', color: '#555', marginBottom: '6px' }}>{desc}</div>
          {!showDetails ? (
            <>
              {incParts.length > 0 && <div style={{ fontSize: '11px', color: '#27ae60', fontWeight: 'bold' }}>{incParts.join(', ')}/s</div>}
              {conParts.length > 0 && <div style={{ fontSize: '11px', color: '#e74c3c', marginTop: '2px' }}>Verbraucht: {conParts.join(', ')}/s</div>}
              {bStats?.damage && <div style={{ fontSize: '11px', color: '#e67e22', marginTop: '2px' }}>Schaden: {bStats.damage}{bStats.range ? ` · Reichweite: ${bStats.range}` : ''}</div>}
              {bStats?.range && !bStats?.damage && <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '2px' }}>Reichweite: {bStats.range}</div>}
              <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '4px' }}>HP: {bStats?.maxHealth}</div>
              <div style={{ fontSize: '10px', color: '#b2bec3', marginTop: '6px', fontStyle: 'italic' }}>Shift halten für Skalierung</div>
            </>
          ) : (
            <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px', borderTop: '1px solid #eee', paddingTop: '4px' }}>
              <div style={{ fontSize: '10px', color: '#7f8c8d', fontWeight: 'bold', marginBottom: '1px' }}>Stufe 1 / 2 / 3 / 4 / 5</div>
              {bStats?.damage && <div><span style={{ color: '#e67e22', fontWeight: 'bold' }}>Schaden:</span> {scaleVals(bStats.damage)}</div>}
              {bStats?.range && <div><span style={{ color: '#7f8c8d' }}>Reichweite:</span> {bStats.range} (fest)</div>}
              {bStats?.income?.energy && <div><span style={{ color: '#27ae60', fontWeight: 'bold' }}>Energie:</span> {scaleVals(bStats.income.energy)}/s</div>}
              {bStats?.income?.scrap && <div><span style={{ color: '#27ae60', fontWeight: 'bold' }}>Schrott:</span> {scaleVals(bStats.income.scrap)}/s</div>}
              {bStats?.income?.steel && <div><span style={{ color: '#27ae60', fontWeight: 'bold' }}>Stahl:</span> {scaleVals(bStats.income.steel)}/s</div>}
              {bStats?.income?.electronics && <div><span style={{ color: '#27ae60', fontWeight: 'bold' }}>Elektronik:</span> {scaleVals(bStats.income.electronics)}/s</div>}
              {bStats?.income?.data && <div><span style={{ color: '#27ae60', fontWeight: 'bold' }}>Daten:</span> {scaleVals(bStats.income.data)}/s</div>}
              <div><span style={{ color: '#7f8c8d' }}>HP:</span> {scaleVals(bStats?.maxHealth || 0)}</div>
              {conParts.length > 0 && <div style={{ color: '#e74c3c', marginTop: '2px' }}>Verbraucht: {conParts.join(', ')}/s (fest)</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
