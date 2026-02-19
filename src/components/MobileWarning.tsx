import { useEffect, useState } from 'react';

export function MobileWarning() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const check = () => {
      const isMobile = window.innerWidth < 900 || ('ontouchstart' in window && window.innerWidth < 1100);
      setShow(isMobile);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: '#1a1a2e', color: '#dfe6e9',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'monospace', padding: '40px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '48px', marginBottom: '24px' }}>🖥️</div>
      <h1 style={{ fontSize: '24px', color: '#00d2d3', margin: '0 0 16px 0' }}>GRIDCORE</h1>
      <p style={{ fontSize: '16px', lineHeight: 1.6, maxWidth: '400px', margin: '0 0 12px 0' }}>
        Dieses Spiel benötigt einen Desktop-Browser mit Maus und Tastatur.
      </p>
      <p style={{ fontSize: '14px', color: '#636e72' }}>
        Bitte öffne GRIDCORE an einem Computer.
      </p>
      <button
        onClick={() => setShow(false)}
        style={{
          marginTop: '32px', padding: '10px 28px',
          background: 'transparent', border: '1px solid #636e72',
          color: '#636e72', borderRadius: '6px', cursor: 'pointer',
          fontFamily: 'monospace', fontSize: '13px',
        }}
      >
        Trotzdem spielen
      </button>
    </div>
  );
}
