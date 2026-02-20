import { MODULE_DEFS } from '../config';
import { MAX_BUILDING_LEVEL } from '../constants';

interface TooltipProps {
  x: number;
  y: number;
  data: any;
}

export const Tooltip = ({ x, y, data }: TooltipProps) => (
  <div style={{
    position: 'fixed', left: x, top: y,
    backgroundColor: 'rgba(255, 255, 255, 0.98)', border: '2px solid #2d3436',
    padding: '12px', borderRadius: '8px', pointerEvents: 'none', zIndex: 1000,
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)', minWidth: '180px'
  }}>
    <div style={{ fontWeight: 'bold', borderBottom: '1px solid #dfe4ea', marginBottom: '8px', color: '#00d2d3', display: 'flex', justifyContent: 'space-between' }}>
      <span>{data.name}</span>
      <span style={{ color: '#2d3436' }}>Lv.{data.level}</span>
    </div>
    <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {data.stats.income?.scrap && <div>Schrott: <span style={{ color: '#9b59b6', fontWeight: 'bold' }}>+{data.stats.income.scrap}/s</span></div>}
      {data.stats.income?.energy && <div>Energie: <span style={{ color: '#f1c40f', fontWeight: 'bold' }}>+{data.stats.income.energy}/s</span></div>}
      {data.stats.income?.steel && <div>Stahl: <span style={{ color: '#e67e22', fontWeight: 'bold' }}>+{data.stats.income.steel}/s</span></div>}
      {data.stats.income?.electronics && <div>Elektronik: <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>+{data.stats.income.electronics}/s</span></div>}
      {data.stats.income?.data && <div>Daten: <span style={{ color: '#3498db', fontWeight: 'bold' }}>+{data.stats.income.data}/s</span></div>}
      {data.stats.damage && <div>Schaden: <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>{data.stats.damage}</span>{data.stats.splash ? ' (Fläche)' : ''}</div>}
      {data.stats.range && <div style={{ opacity: 0.7 }}>Reichweite: {data.stats.range}</div>}
      {data.stats.consumes && <div style={{ marginTop: '4px', color: '#e74c3c', fontSize: '11px' }}>Verbraucht: {data.stats.consumes.energy ? `${data.stats.consumes.energy} En ` : ''}{data.stats.consumes.scrap ? `${data.stats.consumes.scrap} Sc ` : ''}{data.stats.consumes.electronics ? `${data.stats.consumes.electronics} Ek ` : ''}{data.stats.consumes.data ? `${data.stats.consumes.data} Da` : ''}</div>}

      <div style={{ marginTop: '5px', opacity: 0.7, fontSize: '11px' }}>Zustand: {Math.floor(data.hp)} HP{data.shield > 0 ? ` | Schild: ${Math.floor(data.shield)}` : ''}</div>

      {data.upgradeCost && data.level < MAX_BUILDING_LEVEL && data.tileType !== 2 /* CORE */ && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #ccc' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#27ae60' }}>UPGRADE-KOSTEN (Klick):</div>
          <div style={{ fontSize: '11px' }}>
            {data.upgradeCost.scrap > 0 && <span>{data.upgradeCost.scrap} Sc </span>}
            {data.upgradeCost.energy > 0 && <span>{data.upgradeCost.energy} En </span>}
            {data.upgradeCost.steel > 0 && <span>{data.upgradeCost.steel} St </span>}
            {data.upgradeCost.electronics > 0 && <span>{data.upgradeCost.electronics} Ec </span>}
            {data.upgradeCost.data > 0 && <span>{data.upgradeCost.data} Da</span>}
          </div>
        </div>
      )}
      {data.level >= MAX_BUILDING_LEVEL && data.tileType !== 2 /* CORE */ && <div style={{ marginTop: '5px', color: '#e74c3c', fontSize: '11px', fontWeight: 'bold' }}>MAX STUFE</div>}

      {data.canRemove && data.refund && (
        <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #ccc' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#e74c3c' }}>ENTFERNEN (Rechtsklick):</div>
          <div style={{ fontSize: '11px', color: '#7f8c8d' }}>
            Erstattung: {[data.refund.scrap > 0 && `${data.refund.scrap} Sc`, data.refund.energy > 0 && `${data.refund.energy} En`, data.refund.steel > 0 && `${data.refund.steel} St`, data.refund.electronics > 0 && `${data.refund.electronics} Ec`, data.refund.data > 0 && `${data.refund.data} Da`].filter(Boolean).join(' ')}
          </div>
        </div>
      )}

      {data.module !== 0 && MODULE_DEFS[data.module] && (
        <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #ccc' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11px', color: MODULE_DEFS[data.module].color }}>MODUL: {MODULE_DEFS[data.module].name}</div>
          <div style={{ fontSize: '11px', color: '#7f8c8d' }}>{MODULE_DEFS[data.module].description}</div>
        </div>
      )}
    </div>
  </div>
);
