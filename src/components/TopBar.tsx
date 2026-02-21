import { useState } from 'react';
import { DIFFICULTY_PRESETS } from '../game/types';
import type { Difficulty, GameMode, WaveComposition } from '../game/types';
import { BUILDING_REGISTRY } from '../config';

interface WaveInfo {
  wave: number;
  buildPhase: boolean;
  buildTimer: number;
  enemiesLeft: number;
  enemiesTotal: number;
}

interface BreakdownEntry {
  type: number;
  x: number;
  y: number;
  amount: number;
}

interface TopBarProps {
  paused: boolean;
  isGameOver: boolean;
  difficulty: Difficulty;
  gameMode: GameMode;
  gameStats: { time: number; killed: number };
  coreHealth: { current: number; max: number };
  resources: { energy: number; scrap: number; steel: number; electronics: number; data: number };
  netIncome: { energy: number; scrap: number; steel: number; electronics: number; data: number };
  resourceBreakdown: Record<string, BreakdownEntry[]>;
  killPoints: number;
  showTechTree: boolean;
  waveInfo: WaveInfo;
  gameSpeed: number;
  nextWavePreview: WaveComposition[] | null;
  isReplay?: boolean;
  replayId?: string;
  onTogglePause: () => void;
  onRestart: () => void;
  onToggleTechTree: () => void;
  onTogglePrestige: () => void;
  onToggleStats: () => void;
  onToggleMarket: () => void;
  onToggleResearch: () => void;
  onToggleGuide: () => void;
  onToggleLeaderboard: () => void;
  onToggleMute: () => void;
  onToggleSpeed: () => void;
  isMuted: boolean;
  onSave: () => void;
  onLoad: () => void;
  hasSave: boolean;
  seed: string;
  onHighlightResource: (res: string | null) => void;
}

const RESOURCE_COLORS: Record<string, string> = {
  energy: '#f1c40f',
  scrap: '#9b59b6',
  steel: '#e67e22',
  electronics: '#2ecc71',
  data: '#3498db',
};

const RESOURCE_LABELS: Record<string, string> = {
  energy: 'Energie',
  scrap: 'Schrott',
  steel: 'Stahl',
  electronics: 'Elektronik',
  data: 'Daten',
};

/** Aggregate breakdown entries by building type */
function aggregateBreakdown(entries: BreakdownEntry[]): { name: string; total: number; count: number }[] {
  const map = new Map<number, { name: string; total: number; count: number }>();
  for (const e of entries) {
    const existing = map.get(e.type);
    const cfg = BUILDING_REGISTRY[e.type];
    const name = cfg?.name || `#${e.type}`;
    if (existing) {
      existing.total += e.amount;
      existing.count++;
    } else {
      map.set(e.type, { name, total: e.amount, count: 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

const ResourceDisplay = ({ resKey, amount, net, breakdown, onHighlight }: {
  resKey: string;
  amount: number;
  net: number;
  breakdown: BreakdownEntry[];
  onHighlight: (res: string | null) => void;
}) => {
  const [hovered, setHovered] = useState(false);
  const color = RESOURCE_COLORS[resKey];
  const label = RESOURCE_LABELS[resKey];
  const agg = hovered ? aggregateBreakdown(breakdown) : [];

  return (
    <div
      style={{ fontSize: '14px', position: 'relative', cursor: 'default', userSelect: 'none' }}
      onMouseEnter={() => { setHovered(true); onHighlight(resKey); }}
      onMouseLeave={() => { setHovered(false); onHighlight(null); }}
    >
      {label}: <span style={{ color, fontWeight: 'bold' }}>{Math.floor(amount)}</span>{' '}
      <span style={{ fontSize: '11px', color: net >= 0 ? '#27ae60' : '#e74c3c' }}>
        {net >= 0 ? '+' : ''}{net}/s
      </span>

      {hovered && agg.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
          marginTop: '6px', zIndex: 9999, backgroundColor: '#2d3436', color: '#dfe6e9',
          borderRadius: '8px', padding: '10px 14px', fontSize: '12px', fontFamily: 'monospace',
          minWidth: '200px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '6px', color, fontSize: '13px' }}>
            {label} Aufschlüsselung
          </div>
          {agg.map((entry, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', gap: '12px',
              padding: '2px 0', borderBottom: i < agg.length - 1 ? '1px solid #636e7240' : 'none',
            }}>
              <span>{entry.name} <span style={{ color: '#b2bec3' }}>x{entry.count}</span></span>
              <span style={{ color: entry.total >= 0 ? '#2ecc71' : '#e74c3c', fontWeight: 'bold' }}>
                {entry.total >= 0 ? '+' : ''}{Math.round(entry.total * 10) / 10}
              </span>
            </div>
          ))}
          <div style={{
            display: 'flex', justifyContent: 'space-between', gap: '12px',
            marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #636e72',
            fontWeight: 'bold',
          }}>
            <span>Gesamt</span>
            <span style={{ color: net >= 0 ? '#2ecc71' : '#e74c3c' }}>
              {net >= 0 ? '+' : ''}{net}/s
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

function menuBtn(bg: string): React.CSSProperties {
  return {
    padding: '4px 10px', cursor: 'pointer', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace',
    backgroundColor: bg, color: '#fff', border: 'none',
  };
}

export const TopBar = ({
  paused, isGameOver, difficulty, gameMode, gameStats, coreHealth, resources, netIncome,
  resourceBreakdown, killPoints, showTechTree, waveInfo, gameSpeed, nextWavePreview,
  isReplay, replayId,
  onTogglePause, onRestart, onToggleTechTree, onTogglePrestige, onToggleStats, onToggleMarket,
  onToggleResearch, onToggleGuide, onToggleLeaderboard, onToggleMute, onToggleSpeed,
  isMuted, onSave, onLoad, hasSave, seed, onHighlightResource,
}: TopBarProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      backgroundColor: '#ffffff', borderBottom: '1px solid #dfe4ea',
      flexShrink: 0,
    }}>
      {/* Row 1: Controls, info, wave, menu */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap',
        padding: '10px 40px', gap: '12px 36px',
      }}>
        {/* Controls group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isReplay && (
          <span style={{
            padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
            fontFamily: 'monospace', backgroundColor: '#6c5ce7', color: '#fff',
            letterSpacing: '1px',
          }} title={replayId ? `Replay: ${replayId}` : undefined}>
            🎬 REPLAY
          </span>
        )}
        <button onClick={onTogglePause} style={{
          padding: '4px 10px', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace',
          backgroundColor: paused ? '#e74c3c' : '#27ae60', color: '#fff', border: 'none'
        }}>{paused ? '▶' : '⏸'}</button>

        <button onClick={onToggleSpeed} style={{
          padding: '4px 8px', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace',
          backgroundColor: gameSpeed === 1 ? '#636e72' : gameSpeed === 2 ? '#f39c12' : '#e74c3c',
          color: '#fff', border: 'none', minWidth: '32px'
        }}>{gameSpeed}x</button>

        <button onClick={onSave} style={{
          padding: '4px 6px', cursor: 'pointer', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace',
          backgroundColor: '#27ae60', color: '#fff', border: 'none'
        }}>💾</button>

        {hasSave && <button onClick={onLoad} style={{
          padding: '4px 6px', cursor: 'pointer', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace',
          backgroundColor: '#3498db', color: '#fff', border: 'none'
        }}>📂</button>}

        {isGameOver && <button onClick={onRestart} style={{
          padding: '4px 10px', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace',
          backgroundColor: '#3498db', color: '#fff', border: 'none'
        }}>↺</button>}
      </div>

      {/* Info group */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace',
          backgroundColor: difficulty === 'leicht' ? '#27ae60' : difficulty === 'mittel' ? '#f39c12' : '#e74c3c',
          color: '#fff'
        }}>{DIFFICULTY_PRESETS[difficulty].label}</div>

        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{formatTime(gameStats.time)}</div>
        {seed && <div style={{ fontSize: '10px', color: '#b2bec3', fontFamily: 'monospace', cursor: 'pointer' }}
          title="Seed kopieren"
          onClick={() => navigator.clipboard?.writeText(seed)}
        >🌱{seed}</div>}
        <div style={{ color: '#e84118', fontWeight: 'bold', fontSize: '13px' }}>☠{gameStats.killed}</div>
      </div>

      {/* Wave info */}
      {gameMode === 'wellen' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 8px',
          borderRadius: '6px', backgroundColor: waveInfo.buildPhase ? '#00d2d320' : '#e7411820',
          border: `1px solid ${waveInfo.buildPhase ? '#00d2d3' : '#e84118'}`, fontSize: '12px',
        }}>
          <span style={{ fontWeight: 'bold', color: '#2d3436' }}>
            🌊 {waveInfo.wave === 0 ? 'Start' : `W${waveInfo.wave}`}
          </span>
          {waveInfo.buildPhase ? (
            <span style={{ color: '#00d2d3', fontWeight: 'bold' }}>
              Bau {waveInfo.buildTimer}s
            </span>
          ) : (
            <span style={{ color: '#e84118' }}>
              {waveInfo.enemiesLeft}/{waveInfo.enemiesTotal}
            </span>
          )}
        </div>
      )}

      {/* Wave preview */}
      {gameMode === 'wellen' && waveInfo.buildPhase && nextWavePreview && nextWavePreview.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 6px',
          borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace',
          border: '1px solid #b2bec3'
        }} title="Nächste Welle">
          {nextWavePreview.filter(w => w.weight > 0).map(w => {
            const totalWeight = nextWavePreview.reduce((s, ww) => s + ww.weight, 0);
            return (
              <span key={w.type} style={{
                padding: '1px 3px', borderRadius: '3px', fontWeight: 'bold',
                backgroundColor: w.type === 'boss' ? '#e74c3c20' : w.type === 'fast' ? '#f39c1220' : w.type === 'tank' ? '#2d343620' : w.type === 'shielded' ? '#3498db20' : '#dfe6e9',
                color: w.type === 'boss' ? '#e74c3c' : w.type === 'fast' ? '#f39c12' : w.type === 'tank' ? '#636e72' : w.type === 'shielded' ? '#3498db' : '#2d3436'
              }}>
                {w.type === 'normal' ? '●' : w.type === 'fast' ? '▲' : w.type === 'tank' ? '◆' : w.type === 'shielded' ? '⬡' : w.type === 'swarm' ? '•' : '★'}
                {Math.round(w.weight * 100 / totalWeight)}%
              </span>
            );
          })}
        </div>
      )}

      {/* Menu buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={onToggleTechTree} style={menuBtn(showTechTree ? '#8e44ad' : '#9b59b6')}>🔬 TECH ({killPoints})</button>
        <button onClick={onTogglePrestige} style={menuBtn('#f39c12')}>⭐</button>
        <button onClick={onToggleStats} style={menuBtn('#2980b9')}>📊</button>
        <button onClick={onToggleMarket} style={menuBtn('#00b894')}>🏪</button>
        <button onClick={onToggleResearch} style={menuBtn('#6c5ce7')}>🔬</button>
        <button onClick={onToggleGuide} style={menuBtn('#636e72')}>📖</button>
        <button onClick={onToggleLeaderboard} style={menuBtn('#d35400')}>🏆</button>
        <button onClick={onToggleMute} style={menuBtn(isMuted ? '#636e72' : '#2d3436')}>{isMuted ? '🔇' : '🔊'}</button>
      </div>
      </div>

      {/* Row 2: Core HP + Resources */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '6px 40px 10px', gap: '36px', borderTop: '1px solid #f1f2f6',
      }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>KERN: <span style={{ color: coreHealth.current < coreHealth.max * 0.3 ? '#e74c3c' : '#2d3436', fontWeight: 'bold' }}>{Math.max(0, Math.floor(coreHealth.current))}</span></div>
        <div style={{ width: '1px', height: '18px', backgroundColor: '#dfe4ea' }} />
        {(['energy', 'scrap', 'steel', 'electronics', 'data'] as const).map(key => (
          <ResourceDisplay
            key={key}
            resKey={key}
            amount={resources[key]}
            net={netIncome[key]}
            breakdown={resourceBreakdown[key] || []}
            onHighlight={onHighlightResource}
          />
        ))}
      </div>
    </div>
  );
};
