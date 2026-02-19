import React from 'react';
import { TileType, BUILDING_STATS } from '../game/Grid';
import { TECH_TREE } from '../game/TechTree';
import { BUILDING_DESC, scaleVals } from './constants';

export const BuildGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <div style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase', fontWeight: 'bold' }}>{label}</div>
    {children}
  </div>
);

interface BuildBtnProps {
  type: TileType;
  selected: number;
  set: (t: TileType) => void;
  label: string;
  cost: string;
  color: string;
  affordable?: boolean;
  locked?: boolean;
}

export const BuildBtn = ({ type, selected, set, label, cost, color, affordable = true, locked = false }: BuildBtnProps) => {
  const [hover, setHover] = React.useState(false);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [shift, setShift] = React.useState(false);
  const stats = BUILDING_STATS[type];
  const desc = BUILDING_DESC[type] || '';

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'Shift') setShift(true); };
    const up = (e: KeyboardEvent) => { if (e.key === 'Shift') setShift(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  if (locked) {
    const techNode = TECH_TREE.find(n => n.unlocks === type);
    return (
      <button disabled style={{
        padding: '12px', backgroundColor: '#f8f9fa',
        border: '1px solid #dfe4ea', color: '#b2bec3',
        textAlign: 'left', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '10px',
        borderRadius: '8px', opacity: 0.6, width: '100%'
      }}>
        <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: '#dfe4ea', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>🔒</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{label}</span>
          <span style={{ fontSize: '11px' }}>{techNode ? `${techNode.killCost} KP im Techbaum` : 'Gesperrt'}</span>
        </div>
      </button>
    );
  }

  const incParts: string[] = [];
  if (stats?.income?.energy) incParts.push(`+${stats.income.energy} Energie`);
  if (stats?.income?.scrap) incParts.push(`+${stats.income.scrap} Schrott`);
  if (stats?.income?.steel) incParts.push(`+${stats.income.steel} Stahl`);
  if (stats?.income?.electronics) incParts.push(`+${stats.income.electronics} Elektronik`);
  if (stats?.income?.data) incParts.push(`+${stats.income.data} Daten`);
  const conParts: string[] = [];
  if (stats?.consumes?.energy) conParts.push(`${stats.consumes.energy} Energie`);
  if (stats?.consumes?.scrap) conParts.push(`${stats.consumes.scrap} Schrott`);
  if (stats?.consumes?.electronics) conParts.push(`${stats.consumes.electronics} Elektronik`);
  if (stats?.consumes?.data) conParts.push(`${stats.consumes.data} Daten`);

  const showScaling = hover && shift;

  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}>
      <button onClick={affordable ? () => set(type) : undefined} disabled={!affordable} style={{
        padding: '12px', backgroundColor: selected === type ? '#f1f2f6' : 'transparent',
        border: selected === type ? `2px solid ${color}` : '1px solid #dfe4ea',
        color: '#2d3436', textAlign: 'left', cursor: affordable ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '8px',
        opacity: affordable ? 1 : 0.55, width: '100%'
      }}>
        <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: color, flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{label}</span>
          <span style={{ fontSize: '11px', opacity: 0.6 }}>{cost}</span>
        </div>
      </button>
      {hover && (
        <div style={{
          position: 'fixed', left: mousePos.x + 15, top: mousePos.y - 10, zIndex: 1000,
          backgroundColor: 'rgba(255,255,255,0.98)', border: '2px solid #2d3436',
          padding: '10px 12px', borderRadius: '8px', width: showScaling ? 260 : 200,
          boxShadow: '0 4px 15px rgba(0,0,0,0.15)', pointerEvents: 'none'
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', color, marginBottom: '6px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
            {label} {showScaling && <span style={{ fontSize: '10px', color: '#7f8c8d' }}>Lv 1-5</span>}
          </div>
          <div style={{ fontSize: '11px', color: '#555', marginBottom: '6px' }}>{desc}</div>
          {!showScaling ? (
            <>
              {incParts.length > 0 && <div style={{ fontSize: '11px', color: '#27ae60', fontWeight: 'bold' }}>{incParts.join(', ')}/s</div>}
              {conParts.length > 0 && <div style={{ fontSize: '11px', color: '#e74c3c', marginTop: '2px' }}>Verbraucht: {conParts.join(', ')}/s</div>}
              {stats?.damage && <div style={{ fontSize: '11px', color: '#e67e22', marginTop: '2px' }}>Schaden: {stats.damage}{stats.range ? ` • Reichweite: ${stats.range}` : ''}</div>}
              {stats?.range && !stats?.damage && <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '2px' }}>Reichweite: {stats.range}</div>}
              <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '4px' }}>HP: {stats?.maxHealth}</div>
              <div style={{ fontSize: '10px', color: '#b2bec3', marginTop: '6px', fontStyle: 'italic' }}>Shift halten für Skalierung</div>
            </>
          ) : (
            <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px', borderTop: '1px solid #eee', paddingTop: '4px' }}>
              <div style={{ fontSize: '10px', color: '#7f8c8d', fontWeight: 'bold', marginBottom: '1px' }}>Stufe 1 / 2 / 3 / 4 / 5</div>
              {stats?.damage && <div><span style={{ color: '#e67e22', fontWeight: 'bold' }}>Schaden:</span> {scaleVals(stats.damage)}</div>}
              {stats?.range && <div><span style={{ color: '#7f8c8d' }}>Reichweite:</span> {stats.range} (fest)</div>}
              {stats?.income?.energy && <div><span style={{ color: '#27ae60', fontWeight: 'bold' }}>Energie:</span> {scaleVals(stats.income.energy)}/s</div>}
              {stats?.income?.scrap && <div><span style={{ color: '#27ae60', fontWeight: 'bold' }}>Schrott:</span> {scaleVals(stats.income.scrap)}/s</div>}
              {stats?.income?.steel && <div><span style={{ color: '#27ae60', fontWeight: 'bold' }}>Stahl:</span> {scaleVals(stats.income.steel)}/s</div>}
              {stats?.income?.electronics && <div><span style={{ color: '#27ae60', fontWeight: 'bold' }}>Elektronik:</span> {scaleVals(stats.income.electronics)}/s</div>}
              {stats?.income?.data && <div><span style={{ color: '#27ae60', fontWeight: 'bold' }}>Daten:</span> {scaleVals(stats.income.data)}/s</div>}
              <div><span style={{ color: '#7f8c8d' }}>HP:</span> {scaleVals(stats?.maxHealth || 0)}</div>
              {conParts.length > 0 && <div style={{ color: '#e74c3c', marginTop: '2px' }}>Verbraucht: {conParts.join(', ')}/s (fest)</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
