import { TileType, BUILDING_NAMES } from '../config';
import type { TileStats } from '../game/types';

interface StatsOverlayProps {
  tileStats: Map<string, TileStats>;
  globalStats: { totalDamage: number };
  enemiesKilled: number;
  gameTime: number;
  grid: { tiles: number[][]; levels: number[][] };
  onClose: () => void;
}

export const StatsOverlay = ({ tileStats, globalStats, enemiesKilled, gameTime, grid, onClose }: StatsOverlayProps) => {
  // Build sorted list of turret stats
  const entries: { key: string; x: number; y: number; type: number; level: number; damage: number; kills: number }[] = [];
  tileStats.forEach((stats, key) => {
    const [xs, ys] = key.split(',').map(Number);
    const type = grid.tiles[ys]?.[xs];
    if (type !== undefined && type !== TileType.EMPTY) {
      entries.push({ key, x: xs, y: ys, type, level: grid.levels[ys]?.[xs] || 1, damage: stats.totalDamage, kills: stats.kills });
    }
  });
  entries.sort((a, b) => b.damage - a.damage);

  const formatDmg = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : Math.round(n).toString();
  const mins = Math.floor(gameTime / 60);
  const secs = gameTime % 60;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 900,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: '#fff', borderRadius: '16px', padding: '30px',
        maxWidth: '700px', width: '95%', maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#2d3436' }}>📊 Statistiken</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#7f8c8d'
          }}>✕</button>
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '10px 20px', backgroundColor: '#fafafa', borderRadius: '10px' }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#e74c3c' }}>{formatDmg(globalStats.totalDamage)}</div>
            <div style={{ fontSize: '11px', color: '#7f8c8d' }}>Gesamtschaden</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 20px', backgroundColor: '#fafafa', borderRadius: '10px' }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#e84118' }}>{enemiesKilled}</div>
            <div style={{ fontSize: '11px', color: '#7f8c8d' }}>Besiegt</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 20px', backgroundColor: '#fafafa', borderRadius: '10px' }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#2d3436' }}>{mins}:{secs < 10 ? '0' : ''}{secs}</div>
            <div style={{ fontSize: '11px', color: '#7f8c8d' }}>Spielzeit</div>
          </div>
          {gameTime > 0 && (
            <div style={{ textAlign: 'center', padding: '10px 20px', backgroundColor: '#fafafa', borderRadius: '10px' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#f39c12' }}>{formatDmg(globalStats.totalDamage / gameTime)}</div>
              <div style={{ fontSize: '11px', color: '#7f8c8d' }}>DPS (gesamt)</div>
            </div>
          )}
        </div>

        {/* Turret table */}
        {entries.length > 0 && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '8px', textTransform: 'uppercase' }}>
              Turm-Statistiken (Top {Math.min(entries.length, 20)})
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'monospace' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #dfe4ea', color: '#7f8c8d', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px' }}>Gebäude</th>
                  <th style={{ padding: '6px 8px' }}>Position</th>
                  <th style={{ padding: '6px 8px' }}>Stufe</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Schaden</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Kills</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>DPS</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, 20).map((e, i) => (
                  <tr key={e.key} style={{ borderBottom: '1px solid #f1f2f6', backgroundColor: i % 2 === 0 ? '#fafafa' : '#fff' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold', color: '#2d3436' }}>{BUILDING_NAMES[e.type as TileType] || '???'}</td>
                    <td style={{ padding: '5px 8px', color: '#7f8c8d' }}>({e.x}, {e.y})</td>
                    <td style={{ padding: '5px 8px', color: '#7f8c8d' }}>{e.level}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', color: '#e74c3c' }}>{formatDmg(e.damage)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#e84118' }}>{e.kills}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#f39c12' }}>{gameTime > 0 ? formatDmg(e.damage / gameTime) : '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {entries.length === 0 && (
          <div style={{ textAlign: 'center', color: '#b2bec3', padding: '20px', fontSize: '14px' }}>
            Noch keine Kampfstatistiken vorhanden.
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#b2bec3' }}>
          Drücke S zum Schließen
        </div>
      </div>
    </div>
  );
};
