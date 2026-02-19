import React from 'react';
import { TRADE_ROUTES, TRADE_AMOUNTS, getTradeOutput, RESOURCE_LABELS, RESOURCE_COLORS } from '../game/Market';
import type { MarketState, TradableResource } from '../game/Market';

interface MarketOverlayProps {
  market: MarketState;
  resources: { energy: number; scrap: number; steel: number; electronics: number; data: number };
  onTrade: (routeIndex: number, amount: number) => boolean;
  onClose: () => void;
}

export const MarketOverlay = ({ market, resources, onTrade, onClose }: MarketOverlayProps) => {
  const [flash, setFlash] = React.useState<string | null>(null);

  const handleTrade = (routeIdx: number, amount: number) => {
    const ok = onTrade(routeIdx, amount);
    if (ok) {
      setFlash(`${routeIdx}-${amount}`);
      setTimeout(() => setFlash(null), 300);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000,
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '12px', padding: '24px', minWidth: '520px',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.3)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#2d3436' }}>🏪 Ressourcenmarkt</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#7f8c8d' }}>✕</button>
        </div>

        <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '16px' }}>
          Kurse ändern sich je nach Angebot & Nachfrage. Viel verkaufen senkt den Preis.
        </div>

        {/* Price display */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {(Object.keys(market.prices) as TradableResource[]).map(res => {
            const price = market.prices[res];
            const color = price > 1.1 ? '#e74c3c' : price < 0.9 ? '#27ae60' : '#7f8c8d';
            return (
              <div key={res} style={{
                flex: 1, minWidth: '100px', padding: '8px 12px', borderRadius: '8px',
                backgroundColor: '#f8f9fa', border: '1px solid #dfe4ea', textAlign: 'center'
              }}>
                <div style={{ fontSize: '11px', color: '#7f8c8d', fontWeight: 'bold' }}>{RESOURCE_LABELS[res]}</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: RESOURCE_COLORS[res] }}>{Math.floor(resources[res])}</div>
                <div style={{ fontSize: '11px', color, fontWeight: 'bold' }}>
                  {price > 1.05 ? '📈' : price < 0.95 ? '📉' : '—'} ×{price.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trade routes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {TRADE_ROUTES.map((route, idx) => {
            const canAfford = (amt: number) => resources[route.from] >= amt;
            return (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                borderRadius: '8px', backgroundColor: '#f8f9fa', border: '1px solid #dfe4ea'
              }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: RESOURCE_COLORS[route.from] }}>
                    {RESOURCE_LABELS[route.from]}
                  </span>
                  <span style={{ fontSize: '12px', color: '#7f8c8d' }}>→</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: RESOURCE_COLORS[route.to] }}>
                    {RESOURCE_LABELS[route.to]}
                  </span>
                </div>
                {TRADE_AMOUNTS.map(amt => {
                  const output = getTradeOutput(route, amt, market);
                  const affordable = canAfford(amt);
                  const isFlash = flash === `${idx}-${amt}`;
                  return (
                    <button key={amt} onClick={() => handleTrade(idx, amt)} disabled={!affordable} style={{
                      padding: '5px 10px', borderRadius: '6px', cursor: affordable ? 'pointer' : 'not-allowed',
                      border: '1px solid #dfe4ea', fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace',
                      backgroundColor: isFlash ? '#27ae60' : affordable ? '#fff' : '#f8f9fa',
                      color: isFlash ? '#fff' : affordable ? '#2d3436' : '#b2bec3',
                      opacity: affordable ? 1 : 0.55,
                      transition: 'background-color 0.15s'
                    }}>
                      {amt} → {output}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: '11px', color: '#b2bec3', marginTop: '12px', fontStyle: 'italic' }}>
          Hotkey: M • Kurse erholen sich langsam über Zeit
        </div>
      </div>
    </div>
  );
};
