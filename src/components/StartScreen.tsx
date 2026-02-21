import { useState, useRef } from 'react';
import { DIFFICULTY_PRESETS } from '../game/types';
import type { Difficulty, GameMode } from '../game/types';
import { hasTutorialBeenCompleted } from '../game/Tutorial';
import { isValidReplay } from '../game/Replay';
import type { ReplayData } from '../game/Replay';

interface StartScreenProps {
  gameMode: GameMode;
  setGameMode: (m: GameMode) => void;
  setDifficulty: (d: Difficulty) => void;
  setGameStarted: (b: boolean) => void;
  seed: string;
  setSeed: (s: string) => void;
  onStartTutorial: () => void;
  onLoadReplay: (replay: ReplayData) => void;
}

export const StartScreen = ({ gameMode, setGameMode, setDifficulty, setGameStarted, seed, setSeed, onStartTutorial, onLoadReplay }: StartScreenProps) => {
  const [showSeed, setShowSeed] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [replayError, setReplayError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tutorialDone = hasTutorialBeenCompleted();

  const handleReplayFile = (file: File) => {
    setReplayError('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!isValidReplay(data)) { setReplayError('Ungültiges Replay-Format'); return; }
        onLoadReplay(data);
      } catch { setReplayError('JSON konnte nicht gelesen werden'); }
    };
    reader.readAsText(file);
  };

  return (
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

    {/* Tutorial Button */}
    <button
      onClick={onStartTutorial}
      style={{
        width: '320px', padding: '14px 24px', cursor: 'pointer',
        borderRadius: '10px', fontSize: '15px', fontWeight: 'bold',
        fontFamily: 'monospace',
        backgroundColor: tutorialDone ? 'transparent' : '#00d2d3',
        color: tutorialDone ? '#00d2d3' : '#fff',
        border: '2px solid #00d2d3',
        transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#00d2d3'; e.currentTarget.style.color = '#fff'; }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = tutorialDone ? 'transparent' : '#00d2d3';
        e.currentTarget.style.color = tutorialDone ? '#00d2d3' : '#fff';
      }}
    >
      🎓 {tutorialDone ? 'Tutorial wiederholen' : 'Tutorial starten'}
    </button>

    {/* Seed Input */}
    <div style={{ textAlign: 'center' }}>
      <button
        onClick={() => setShowSeed(!showSeed)}
        style={{
          background: 'none', border: 'none', fontSize: '12px', color: '#b2bec3',
          cursor: 'pointer', fontFamily: 'monospace', textDecoration: 'underline'
        }}
      >
        🌱 Seed eingeben (optional)
      </button>
      {showSeed && (
        <div style={{ marginTop: '8px' }}>
          <input
            type="text"
            value={seed}
            onChange={(e) => setSeed(e.target.value.toUpperCase().slice(0, 10))}
            placeholder="z.B. ABC123 (leer = zufällig)"
            maxLength={10}
            style={{
              padding: '8px 14px', borderRadius: '8px', border: '2px solid #dfe4ea',
              fontSize: '16px', fontFamily: 'monospace', textAlign: 'center',
              width: '240px', outline: 'none', letterSpacing: '2px',
              color: '#2d3436', backgroundColor: '#fff'
            }}
          />
          <div style={{ fontSize: '10px', color: '#b2bec3', marginTop: '4px' }}>
            Gleicher Seed = gleiche Karte (Erzverteilung)
          </div>
        </div>
      )}
    </div>

    {/* Replay Loader */}
    <div style={{ textAlign: 'center' }}>
      <button
        onClick={() => setShowReplay(!showReplay)}
        style={{
          background: 'none', border: 'none', fontSize: '12px', color: '#b2bec3',
          cursor: 'pointer', fontFamily: 'monospace', textDecoration: 'underline'
        }}
      >
        🎬 Replay laden
      </button>
      {showReplay && (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.[0]) handleReplayFile(e.target.files[0]); }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '10px 24px', cursor: 'pointer', borderRadius: '8px', fontSize: '14px',
              fontWeight: 'bold', fontFamily: 'monospace', backgroundColor: '#6c5ce7',
              color: '#fff', border: 'none', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#5f3dc4'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#6c5ce7'; }}
          >
            📂 Replay-Datei öffnen (.json)
          </button>
          <div style={{ fontSize: '10px', color: '#b2bec3' }}>
            Replay-Dateien werden von der AI-Simulation erzeugt
          </div>
          {replayError && (
            <div style={{ fontSize: '12px', color: '#e74c3c', fontWeight: 'bold' }}>{replayError}</div>
          )}
        </div>
      )}
    </div>
  </div>
  );
};
