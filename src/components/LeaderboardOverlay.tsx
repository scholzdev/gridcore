import React, { useEffect, useState } from 'react';
import type { Difficulty, GameMode } from '../game/types';

interface LeaderboardEntry {
  id: number;
  name: string;
  wave: number;
  kills: number;
  time_s: number;
  difficulty: string;
  game_mode: string;
  damage: number;
  seed: string;
  created: string;
}

type Tab = 'global' | 'personal';

interface LeaderboardOverlayProps {
  onClose: () => void;
  showSubmit?: boolean;
  submitData?: {
    wave: number;
    kills: number;
    time_s: number;
    difficulty: Difficulty;
    game_mode: GameMode;
    damage: number;
    seed: string;
  };
}

export const LeaderboardOverlay: React.FC<LeaderboardOverlayProps> = ({ onClose, showSubmit, submitData }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [personalEntries, setPersonalEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('global');
  const [filterMode, setFilterMode] = useState<'' | 'endlos' | 'wellen'>('');
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('gridcore_player_name') || '');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchScores = async (mode?: string) => {
    setLoading(true);
    setError('');
    try {
      const url = mode ? `/api/scores?mode=${mode}` : '/api/scores';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      setError('Bestenliste konnte nicht geladen werden.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonal = async () => {
    const name = localStorage.getItem('gridcore_player_name');
    if (!name) { setPersonalEntries([]); return; }
    try {
      const res = await fetch(`/api/scores/personal?name=${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPersonalEntries(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchScores(filterMode || undefined);
    fetchPersonal();
  }, [filterMode]);

  const handleSubmit = async () => {
    if (!submitData || !playerName.trim()) return;
    setSubmitting(true);
    try {
      localStorage.setItem('gridcore_player_name', playerName.trim());
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playerName.trim(),
          ...submitData,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setSubmitted(true);
      fetchScores(filterMode || undefined);
      fetchPersonal();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Eintragen');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatDmg = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : Math.round(n).toString();

  const diffColor = (d: string) =>
    d === 'leicht' ? '#27ae60' : d === 'mittel' ? '#f39c12' : '#e74c3c';

  const diffLabel = (d: string) =>
    d === 'leicht' ? 'Leicht' : d === 'mittel' ? 'Mittel' : 'Schwer';

  const displayEntries = tab === 'personal' ? personalEntries : entries;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 900,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: '#fff', borderRadius: '16px', padding: '30px',
        maxWidth: '850px', width: '95%', maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#2d3436' }}>🏆 Bestenliste</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#7f8c8d'
          }}>✕</button>
        </div>

        {/* Score Submit Form */}
        {showSubmit && submitData && !submitted && (
          <div style={{
            marginBottom: '20px', padding: '16px', backgroundColor: '#f8f9fa',
            borderRadius: '12px', border: '2px solid #f39c12'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2d3436', marginBottom: '10px' }}>
              🎮 Dein Ergebnis eintragen
            </div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', flexWrap: 'wrap', fontSize: '12px', color: '#636e72' }}>
              <span>Kills: <b style={{ color: '#e84118' }}>{submitData.kills}</b></span>
              <span>Zeit: <b>{formatTime(submitData.time_s)}</b></span>
              <span>Schaden: <b style={{ color: '#e74c3c' }}>{formatDmg(submitData.damage)}</b></span>
              {submitData.game_mode === 'wellen' && <span>Welle: <b>{submitData.wave}</b></span>}
              <span style={{ color: diffColor(submitData.difficulty), fontWeight: 'bold' }}>{diffLabel(submitData.difficulty)}</span>
              {submitData.seed && <span>🌱 <b>{submitData.seed}</b></span>}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Dein Name (max 20)"
                maxLength={20}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #dfe4ea',
                  fontSize: '14px', fontFamily: 'monospace', outline: 'none'
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              />
              <button
                onClick={handleSubmit}
                disabled={submitting || !playerName.trim()}
                style={{
                  padding: '8px 20px', borderRadius: '8px', border: 'none',
                  backgroundColor: submitting || !playerName.trim() ? '#b2bec3' : '#f39c12',
                  color: '#fff', fontWeight: 'bold', fontSize: '14px', cursor: submitting ? 'wait' : 'pointer',
                  fontFamily: 'monospace'
                }}
              >
                {submitting ? '...' : 'Eintragen'}
              </button>
            </div>
          </div>
        )}

        {submitted && (
          <div style={{
            marginBottom: '20px', padding: '12px', backgroundColor: '#d4edda',
            borderRadius: '10px', color: '#155724', fontSize: '14px', textAlign: 'center', fontWeight: 'bold'
          }}>
            ✅ Score eingetragen!
          </div>
        )}

        {/* Tabs: Global / Personal Best */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button onClick={() => setTab('global')} style={{
            padding: '6px 16px', borderRadius: '8px', border: 'none',
            backgroundColor: tab === 'global' ? '#d35400' : '#f1f2f6',
            color: tab === 'global' ? '#fff' : '#636e72',
            fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace'
          }}>🌍 Global</button>
          <button onClick={() => { setTab('personal'); fetchPersonal(); }} style={{
            padding: '6px 16px', borderRadius: '8px', border: 'none',
            backgroundColor: tab === 'personal' ? '#d35400' : '#f1f2f6',
            color: tab === 'personal' ? '#fff' : '#636e72',
            fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace'
          }}>⭐ Mein Bester</button>
        </div>

        {/* Mode Filter (only for global) */}
        {tab === 'global' && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {(['', 'endlos', 'wellen'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                style={{
                  padding: '5px 12px', borderRadius: '8px', border: 'none',
                  backgroundColor: filterMode === mode ? '#2d3436' : '#f1f2f6',
                  color: filterMode === mode ? '#fff' : '#636e72',
                  fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace'
                }}
              >
                {mode === '' ? 'Alle' : mode === 'endlos' ? 'Endlos' : 'Wellen'}
              </button>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ color: '#e74c3c', fontSize: '13px', marginBottom: '12px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && tab === 'global' && (
          <div style={{ textAlign: 'center', color: '#b2bec3', padding: '40px', fontSize: '14px' }}>
            Laden...
          </div>
        )}

        {/* Personal best summary */}
        {tab === 'personal' && personalEntries.length > 0 && (
          <div style={{
            display: 'flex', gap: '16px', marginBottom: '16px', justifyContent: 'center', flexWrap: 'wrap'
          }}>
            <div style={{ textAlign: 'center', padding: '10px 20px', backgroundColor: '#fafafa', borderRadius: '10px' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#e84118' }}>{personalEntries[0].kills}</div>
              <div style={{ fontSize: '11px', color: '#7f8c8d' }}>Beste Kills</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px 20px', backgroundColor: '#fafafa', borderRadius: '10px' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#e74c3c' }}>{formatDmg(personalEntries[0].damage)}</div>
              <div style={{ fontSize: '11px', color: '#7f8c8d' }}>Schaden</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px 20px', backgroundColor: '#fafafa', borderRadius: '10px' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#2d3436' }}>{formatTime(personalEntries[0].time_s)}</div>
              <div style={{ fontSize: '11px', color: '#7f8c8d' }}>Spielzeit</div>
            </div>
            {personalEntries[0].seed && (
              <div style={{ textAlign: 'center', padding: '10px 20px', backgroundColor: '#fafafa', borderRadius: '10px' }}>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#00b894' }}>{personalEntries[0].seed}</div>
                <div style={{ fontSize: '11px', color: '#7f8c8d' }}>Seed</div>
              </div>
            )}
          </div>
        )}

        {tab === 'personal' && personalEntries.length === 0 && (
          <div style={{ textAlign: 'center', color: '#b2bec3', padding: '30px', fontSize: '14px' }}>
            {playerName ? 'Noch keine Scores vorhanden.' : 'Trage zuerst einen Score ein, um deine Bestleistungen zu sehen.'}
          </div>
        )}

        {/* Table */}
        {!(loading && tab === 'global') && displayEntries.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'monospace' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #dfe4ea', color: '#7f8c8d', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px', width: '30px' }}>#</th>
                <th style={{ padding: '6px 8px' }}>Name</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Kills</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Zeit</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Schaden</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>Welle</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>Seed</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>Schwierigkeit</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>Modus</th>
              </tr>
            </thead>
            <tbody>
              {displayEntries.map((e, i) => (
                <tr key={e.id} style={{
                  borderBottom: '1px solid #f1f2f6',
                  backgroundColor: tab === 'global' && i < 3 ? ['#fff9e6', '#f5f5f5', '#fdf2e9'][i] : i % 2 === 0 ? '#fafafa' : '#fff'
                }}>
                  <td style={{ padding: '5px 8px', fontWeight: 'bold', color: tab === 'global' && i < 3 ? ['#f39c12', '#95a5a6', '#e67e22'][i] : '#b2bec3' }}>
                    {tab === 'global' && i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                  </td>
                  <td style={{ padding: '5px 8px', fontWeight: 'bold', color: '#2d3436' }}>{e.name}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', color: '#e84118' }}>{e.kills}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', color: '#636e72' }}>{formatTime(e.time_s)}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', color: '#e74c3c' }}>{formatDmg(e.damage)}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'center', color: '#636e72' }}>{e.game_mode === 'wellen' ? e.wave : '–'}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'center', color: '#00b894', fontSize: '10px', cursor: e.seed ? 'pointer' : 'default' }}
                    title={e.seed ? 'Seed kopieren' : ''}
                    onClick={() => e.seed && navigator.clipboard?.writeText(e.seed)}
                  >
                    {e.seed || '–'}
                  </td>
                  <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold',
                      backgroundColor: diffColor(e.difficulty) + '20', color: diffColor(e.difficulty)
                    }}>{diffLabel(e.difficulty)}</span>
                  </td>
                  <td style={{ padding: '5px 8px', textAlign: 'center', color: '#636e72', fontSize: '11px' }}>
                    {e.game_mode === 'endlos' ? 'Endlos' : 'Wellen'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && tab === 'global' && entries.length === 0 && !error && (
          <div style={{ textAlign: 'center', color: '#b2bec3', padding: '40px', fontSize: '14px' }}>
            Noch keine Einträge vorhanden. Sei der Erste! 🚀
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#b2bec3' }}>
          Drücke L zum Schließen
        </div>
      </div>
    </div>
  );
};
