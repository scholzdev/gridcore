import { DIFFICULTY_PRESETS } from '../game/types';
import type { Difficulty, GameMode } from '../game/types';

interface StartScreenProps {
  gameMode: GameMode;
  setGameMode: (m: GameMode) => void;
  setDifficulty: (d: Difficulty) => void;
  setGameStarted: (b: boolean) => void;
}

export const StartScreen = ({ gameMode, setGameMode, setDifficulty, setGameStarted }: StartScreenProps) => (
  <div style={{
    backgroundColor: '#f1f2f6', color: '#2d3436', height: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', gap: '40px'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#00d2d3', marginBottom: '8px' }}> Gridcore</div>
      <div style={{ fontSize: '16px', color: '#7f8c8d' }}>Verteidige deinen Kern</div>
    </div>

    {/* Mode selector */}
    <div style={{ display: 'flex', gap: '12px', width: '320px' }}>
      {(['endlos', 'wellen'] as GameMode[]).map(m => {
        const labels: Record<GameMode, string> = { endlos: 'Endlos', wellen: 'Wellen' };
        const descs: Record<GameMode, string> = { endlos: 'Gegner kommen ununterbrochen', wellen: 'Wellen mit Bauphasen dazwischen' };
        const isActive = gameMode === m;
        return (
          <button key={m} onClick={() => setGameMode(m)} style={{
            flex: 1, padding: '14px 12px', cursor: 'pointer', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold',
            fontFamily: 'monospace', backgroundColor: isActive ? '#00d2d3' : 'transparent',
            color: isActive ? '#fff' : '#7f8c8d',
            border: isActive ? '2px solid #00d2d3' : '2px solid #dfe4ea', transition: 'all 0.15s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
          }}>
            <span>{labels[m]}</span>
            <span style={{ fontSize: '10px', fontWeight: 'normal', opacity: 0.8 }}>{descs[m]}</span>
          </button>
        );
      })}
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '320px' }}>
      <div style={{ fontSize: '14px', color: '#7f8c8d', textAlign: 'center', marginBottom: '4px' }}>Schwierigkeit wählen</div>
      {(Object.keys(DIFFICULTY_PRESETS) as Difficulty[]).map(d => {
        const cfg = DIFFICULTY_PRESETS[d];
        const colors: Record<Difficulty, string> = { leicht: '#27ae60', mittel: '#f39c12', schwer: '#e74c3c' };
        return (
          <button key={d} onClick={() => { setDifficulty(d); setGameStarted(true); }} style={{
            padding: '16px 24px', cursor: 'pointer', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold',
            fontFamily: 'monospace', backgroundColor: 'transparent', color: colors[d],
            border: `2px solid ${colors[d]}`, transition: 'all 0.15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = colors[d]; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = colors[d]; }}
          >
            <span>{cfg.label}</span>
            <span style={{ fontSize: '11px', opacity: 0.7 }}>HP {cfg.baseHp}+{cfg.hpPerSec}/s · Schaden {cfg.enemyDamage}</span>
          </button>
        );
      })}
    </div>
  </div>
);
