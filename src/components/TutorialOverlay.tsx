import React, { useEffect, useState } from 'react';
import type { TutorialStep, TutorialArrow } from '../game/Tutorial';

interface TutorialOverlayProps {
  step: TutorialStep;
  stepIndex: number;
  totalSteps: number;
  onAdvance: () => void;
  onSkip: () => void;
}

const BACKDROP_COLOR = 'rgba(0,0,0,0.45)';

function getPositionStyle(position: TutorialStep['position']): React.CSSProperties {
  switch (position) {
    case 'center':
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    case 'bottom-left':
      return { bottom: '120px', left: '290px' };
    case 'bottom-right':
      return { bottom: '120px', right: '40px' };
    case 'top-center':
      return { top: '100px', left: '50%', transform: 'translateX(-50%)' };
    case 'left':
      return { top: '50%', left: '290px', transform: 'translateY(-50%)' };
    case 'right':
      return { top: '50%', right: '40px', transform: 'translateY(-50%)' };
    default:
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }
}

function ArrowIndicator({ direction }: { direction: TutorialArrow }) {
  if (direction === 'none') return null;
  const arrowMap: Record<string, { char: string; style: React.CSSProperties }> = {
    left: { char: '◀', style: { position: 'absolute', left: '-30px', top: '50%', transform: 'translateY(-50%)' } },
    right: { char: '▶', style: { position: 'absolute', right: '-30px', top: '50%', transform: 'translateY(-50%)' } },
    up: { char: '▲', style: { position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)' } },
    down: { char: '▼', style: { position: 'absolute', bottom: '-30px', left: '50%', transform: 'translateX(-50%)' } },
  };
  const arrow = arrowMap[direction];
  if (!arrow) return null;
  return (
    <div style={{
      ...arrow.style,
      fontSize: '24px',
      color: '#00d2d3',
      animation: `tutorialPulse 1.2s ease-in-out infinite`,
      textShadow: '0 0 10px rgba(0,210,211,0.6)',
    }}>
      {arrow.char}
    </div>
  );
}

export const TutorialOverlay = ({ step, stepIndex, totalSteps, onAdvance, onSkip }: TutorialOverlayProps) => {
  const [visible, setVisible] = useState(false);

  // Fade in on mount / step change
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, [stepIndex]);

  const progress = ((stepIndex + 1) / totalSteps) * 100;

  return (
    <>
      {/* CSS animation */}
      <style>{`
        @keyframes tutorialPulse {
          0%, 100% { opacity: 0.6; transform: translateY(-50%) scale(1); }
          50% { opacity: 1; transform: translateY(-50%) scale(1.3); }
        }
        @keyframes tutorialPulseX {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.3); }
        }
        @keyframes tutorialFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes tutorialSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Semi-transparent backdrop — click-through for canvas steps */}
      {step.highlight.kind !== 'canvas' && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: BACKDROP_COLOR,
          zIndex: 9998,
          pointerEvents: step.highlight.kind === 'none' ? 'auto' : 'none',
        }} />
      )}

      {/* Tooltip card */}
      <div style={{
        position: 'fixed',
        ...getPositionStyle(step.position),
        zIndex: 10000,
        maxWidth: '420px',
        minWidth: '320px',
        pointerEvents: 'auto',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}>
        <ArrowIndicator direction={step.arrow} />

        <div style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          padding: '24px 28px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 0 2px rgba(0,210,211,0.3)',
          fontFamily: 'monospace',
          position: 'relative',
        }}>
          {/* Progress bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
            borderRadius: '16px 16px 0 0', backgroundColor: '#eee', overflow: 'hidden',
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#00d2d3',
              transition: 'width 0.4s ease',
            }} />
          </div>

          {/* Step counter */}
          <div style={{
            fontSize: '10px', color: '#b2bec3', marginBottom: '8px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>Schritt {stepIndex + 1} / {totalSteps}</span>
            <button
              onClick={onSkip}
              style={{
                background: 'none', border: 'none', color: '#b2bec3',
                cursor: 'pointer', fontFamily: 'monospace', fontSize: '10px',
                textDecoration: 'underline', padding: '2px 4px',
              }}
            >
              Tutorial überspringen
            </button>
          </div>

          {/* Title */}
          <div style={{
            fontSize: '17px', fontWeight: 'bold', color: '#2d3436',
            marginBottom: '10px',
          }}>
            {step.title}
          </div>

          {/* Message */}
          <div style={{
            fontSize: '13px', color: '#636e72', lineHeight: '1.7',
            whiteSpace: 'pre-line', marginBottom: '18px',
          }}>
            {step.message}
          </div>

          {/* Action button */}
          {step.manualAdvance ? (
            <button
              onClick={onAdvance}
              style={{
                width: '100%', padding: '10px 0', cursor: 'pointer',
                borderRadius: '10px', fontSize: '14px', fontWeight: 'bold',
                fontFamily: 'monospace', backgroundColor: '#00d2d3',
                color: '#fff', border: 'none',
                transition: 'all 0.15s',
                boxShadow: '0 4px 12px rgba(0,210,211,0.3)',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#00b8b8'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#00d2d3'; }}
            >
              {stepIndex === totalSteps - 1 ? '🎮 Spiel starten!' : 'Weiter →'}
            </button>
          ) : (
            <div style={{
              fontSize: '11px', color: '#b2bec3', textAlign: 'center',
              fontStyle: 'italic',
            }}>
              ✨ Führe die Aktion aus, um fortzufahren...
            </div>
          )}
        </div>
      </div>
    </>
  );
};
