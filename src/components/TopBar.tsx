import { DIFFICULTY_PRESETS } from '../game/types';
import type { Difficulty, GameMode } from '../game/types';

interface WaveInfo {
  wave: number;
  buildPhase: boolean;
  buildTimer: number;
  enemiesLeft: number;
  enemiesTotal: number;
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
  killPoints: number;
  showTechTree: boolean;
  waveInfo: WaveInfo;
  onTogglePause: () => void;
  onRestart: () => void;
  onToggleTechTree: () => void;
  onTogglePrestige: () => void;
  onToggleStats: () => void;
  onToggleMarket: () => void;
  onToggleResearch: () => void;
  onSave: () => void;
  onLoad: () => void;
  hasSave: boolean;
}

export const TopBar = ({
  paused, isGameOver, difficulty, gameMode, gameStats, coreHealth, resources, netIncome,
  killPoints, showTechTree, waveInfo, onTogglePause, onRestart, onToggleTechTree,
  onTogglePrestige, onToggleStats, onToggleMarket, onToggleResearch, onSave, onLoad, hasSave
}: TopBarProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '10px 25px', backgroundColor: '#ffffff', borderBottom: '1px solid #dfe4ea',
      flexShrink: 0, gap: '30px'
    }}>
      <button onClick={onTogglePause} style={{
        padding: '4px 12px', cursor: 'pointer', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', fontFamily: 'monospace',
        backgroundColor: paused ? '#e74c3c' : '#27ae60', color: '#fff', border: 'none'
      }}>{paused ? '▶ WEITER' : '⏸ PAUSE'}</button>

      {isGameOver && <button onClick={onRestart} style={{
        padding: '4px 12px', cursor: 'pointer', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', fontFamily: 'monospace',
        backgroundColor: '#3498db', color: '#fff', border: 'none'
      }}>↺ NEUSTART</button>}

      <div style={{
        padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace',
        backgroundColor: difficulty === 'leicht' ? '#27ae60' : difficulty === 'mittel' ? '#f39c12' : '#e74c3c',
        color: '#fff'
      }}>{DIFFICULTY_PRESETS[difficulty].label}</div>

      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatTime(gameStats.time)}</div>
      <div style={{ color: '#e84118', fontWeight: 'bold', fontSize: '14px' }}>BESIEGT: {gameStats.killed}</div>

      {gameMode === 'wellen' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 10px',
          borderRadius: '6px', backgroundColor: waveInfo.buildPhase ? '#00d2d320' : '#e7411820',
          border: `1px solid ${waveInfo.buildPhase ? '#00d2d3' : '#e84118'}`
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#2d3436' }}>
            🌊 {waveInfo.wave === 0 ? 'Start' : `Welle ${waveInfo.wave}`}
          </span>
          {waveInfo.buildPhase ? (
            <span style={{ fontSize: '12px', color: '#00d2d3', fontWeight: 'bold' }}>
              {waveInfo.wave > 0 ? `Geschafft! ` : ''}Bauphase {waveInfo.buildTimer}s · Nächste: {waveInfo.wave + 1}
            </span>
          ) : (
            <span style={{ fontSize: '12px', color: '#e84118' }}>
              {waveInfo.enemiesLeft}/{waveInfo.enemiesTotal} übrig
            </span>
          )}
        </div>
      )}

      <button onClick={onToggleTechTree} style={{
        padding: '4px 12px', cursor: 'pointer', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace',
        backgroundColor: showTechTree ? '#8e44ad' : '#9b59b6', color: '#fff', border: 'none'
      }}>🔬 TECHBAUM ({killPoints} KP)</button>

      <button onClick={onTogglePrestige} style={{
        padding: '4px 12px', cursor: 'pointer', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace',
        backgroundColor: '#f39c12', color: '#fff', border: 'none'
      }}>⭐ PRESTIGE</button>

      <button onClick={onToggleStats} style={{
        padding: '4px 12px', cursor: 'pointer', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace',
        backgroundColor: '#2980b9', color: '#fff', border: 'none'
      }}>📊 STATS</button>

      <button onClick={onToggleMarket} style={{
        padding: '4px 12px', cursor: 'pointer', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace',
        backgroundColor: '#00b894', color: '#fff', border: 'none'
      }}>🏪 MARKT</button>

      <button onClick={onToggleResearch} style={{
        padding: '4px 12px', cursor: 'pointer', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace',
        backgroundColor: '#6c5ce7', color: '#fff', border: 'none'
      }}>🔬 FORSCHUNG</button>

      <button onClick={onSave} style={{
        padding: '4px 8px', cursor: 'pointer', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace',
        backgroundColor: '#27ae60', color: '#fff', border: 'none'
      }}>💾</button>

      {hasSave && <button onClick={onLoad} style={{
        padding: '4px 8px', cursor: 'pointer', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace',
        backgroundColor: '#3498db', color: '#fff', border: 'none'
      }}>📂</button>}

      <div style={{ fontSize: '14px' }}>KERN: <span style={{ color: coreHealth.current < coreHealth.max * 0.3 ? '#e74c3c' : '#2d3436', fontWeight: 'bold' }}>{Math.max(0, Math.floor(coreHealth.current))}</span></div>
      <div style={{ width: '1px', height: '20px', backgroundColor: '#dfe4ea' }} />
      <div style={{ fontSize: '14px' }}>Energie: <span style={{ color: '#f1c40f', fontWeight: 'bold' }}>{Math.floor(resources.energy)}</span> <span style={{ fontSize: '11px', color: netIncome.energy >= 0 ? '#27ae60' : '#e74c3c' }}>{netIncome.energy >= 0 ? '+' : ''}{netIncome.energy}/s</span></div>
      <div style={{ fontSize: '14px' }}>Schrott: <span style={{ color: '#9b59b6', fontWeight: 'bold' }}>{Math.floor(resources.scrap)}</span> <span style={{ fontSize: '11px', color: netIncome.scrap >= 0 ? '#27ae60' : '#e74c3c' }}>{netIncome.scrap >= 0 ? '+' : ''}{netIncome.scrap}/s</span></div>
      <div style={{ fontSize: '14px' }}>Stahl: <span style={{ color: '#e67e22', fontWeight: 'bold' }}>{Math.floor(resources.steel)}</span> <span style={{ fontSize: '11px', color: netIncome.steel >= 0 ? '#27ae60' : '#e74c3c' }}>{netIncome.steel >= 0 ? '+' : ''}{netIncome.steel}/s</span></div>
      <div style={{ fontSize: '14px' }}>Elektronik: <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>{Math.floor(resources.electronics)}</span> <span style={{ fontSize: '11px', color: netIncome.electronics >= 0 ? '#27ae60' : '#e74c3c' }}>{netIncome.electronics >= 0 ? '+' : ''}{netIncome.electronics}/s</span></div>
      <div style={{ fontSize: '14px' }}>Daten: <span style={{ color: '#3498db', fontWeight: 'bold' }}>{Math.floor(resources.data)}</span> <span style={{ fontSize: '11px', color: netIncome.data >= 0 ? '#27ae60' : '#e74c3c' }}>{netIncome.data >= 0 ? '+' : ''}{netIncome.data}/s</span></div>
    </div>
  );
};
