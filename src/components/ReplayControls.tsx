import React, { useRef, useCallback, useEffect, useState } from 'react';

interface ReplayControlsProps {
  currentTick: number;
  totalTicks: number;
  paused: boolean;
  speed: number;
  wave: number;
  kills: number;
  seeking: boolean;
  onTogglePause: () => void;
  onSetSpeed: (speed: number) => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
  onSeek: (targetTick: number) => void;
}

const SPEEDS = [1, 2, 4, 8, 16];

function formatTime(ticks: number): string {
  const mins = Math.floor(ticks / 60);
  const secs = ticks % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ReplayControls({
  currentTick,
  totalTicks,
  paused,
  speed,
  wave,
  kills,
  seeking,
  onTogglePause,
  onSetSpeed,
  onSkipForward,
  onSkipBackward,
  onSeek,
}: ReplayControlsProps) {
  const progress = totalTicks > 0 ? (currentTick / totalTicks) * 100 : 0;
  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [previewTick, setPreviewTick] = useState<number | null>(null);

  const tickFromEvent = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!barRef.current || totalTicks <= 0) return 0;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return Math.round(ratio * totalTicks);
  }, [totalTicks]);

  const handleBarMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    const tick = tickFromEvent(e);
    setPreviewTick(tick);
  }, [tickFromEvent]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPreviewTick(tickFromEvent(e));
    };
    const handleUp = (e: MouseEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      const tick = tickFromEvent(e);
      setPreviewTick(null);
      onSeek(tick);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [tickFromEvent, onSeek]);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 48,
      background: 'linear-gradient(180deg, rgba(30,20,50,0.95) 0%, rgba(20,12,35,0.98) 100%)',
      borderTop: '1px solid rgba(139,92,246,0.4)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 10,
      zIndex: 9999,
      fontFamily: "'JetBrains Mono', monospace",
      color: '#e2e8f0',
      fontSize: 13,
      userSelect: 'none',
    }}>
      {/* Replay badge */}
      <span style={{
        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
        color: '#fff',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1,
      }}>
        🎬 REPLAY
      </span>

      {/* Skip backward */}
      <button onClick={onSkipBackward} title="−10s" style={btnStyle}>⏪</button>

      {/* Play/Pause */}
      <button onClick={onTogglePause} title={paused ? 'Abspielen' : 'Pause'} style={{
        ...btnStyle,
        fontSize: 18,
        width: 36,
        height: 30,
      }}>
        {paused ? '▶' : '⏸'}
      </button>

      {/* Skip forward */}
      <button onClick={onSkipForward} title="+10s" style={btnStyle}>⏩</button>

      {/* Speed buttons */}
      <div style={{ display: 'flex', gap: 2 }}>
        {SPEEDS.map(s => (
          <button
            key={s}
            onClick={() => onSetSpeed(s)}
            style={{
              ...btnStyle,
              fontSize: 11,
              padding: '2px 6px',
              background: speed === s
                ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
                : 'rgba(255,255,255,0.08)',
              color: speed === s ? '#fff' : '#94a3b8',
              border: speed === s ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Progress bar — draggable */}
      <div
        ref={barRef}
        onMouseDown={handleBarMouseDown}
        style={{
          flex: 1,
          height: 14,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 4,
          position: 'relative',
          cursor: seeking ? 'wait' : 'pointer',
          padding: '4px 0',
        }}
      >
        {/* Track */}
        <div style={{
          position: 'absolute',
          top: 4,
          left: 0,
          right: 0,
          height: 6,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 3,
          overflow: 'hidden',
        }}>
          {/* Filled portion */}
          <div style={{
            width: `${Math.min(previewTick != null ? (previewTick / totalTicks) * 100 : progress, 100)}%`,
            height: '100%',
            background: previewTick != null
              ? 'linear-gradient(90deg, #a855f7, #c084fc)'
              : 'linear-gradient(90deg, #7c3aed, #a855f7)',
            borderRadius: 3,
            transition: previewTick != null ? 'none' : 'width 0.3s ease',
          }} />
        </div>
        {/* Drag handle */}
        {previewTick != null && (
          <div style={{
            position: 'absolute',
            top: 1,
            left: `${(previewTick / totalTicks) * 100}%`,
            width: 10,
            height: 12,
            marginLeft: -5,
            background: '#c084fc',
            borderRadius: 3,
            border: '1px solid #e9d5ff',
            boxShadow: '0 0 6px rgba(168,85,247,0.6)',
          }} />
        )}
      </div>

      {/* Seeking indicator */}
      {seeking && (
        <span style={{ color: '#c084fc', fontSize: 11, animation: 'pulse 1s infinite' }}>
          ⏳
        </span>
      )}

      {/* Time display */}
      <span style={{ color: '#a78bfa', fontVariantNumeric: 'tabular-nums', minWidth: 100, textAlign: 'right' }}>
        {formatTime(currentTick)} / {formatTime(totalTicks)}
      </span>

      {/* Frame number */}
      <span style={{ color: '#64748b', fontSize: 11, minWidth: 75, textAlign: 'right' }}>
        F{currentTick}
      </span>

      {/* Wave & kills */}
      <span style={{ color: '#94a3b8', fontSize: 11, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 10, minWidth: 80 }}>
        W{wave} · {kills}💀
      </span>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 4,
  color: '#e2e8f0',
  cursor: 'pointer',
  padding: '4px 8px',
  fontSize: 14,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
