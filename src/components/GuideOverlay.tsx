import { useState } from 'react';
import { TileType, BUILDING_STATS, MODULE_DEFS } from '../game/Grid';
import { BUILDING_NAMES, BUILDING_DESC, BUILDING_COLORS } from './constants';

interface GuideOverlayProps {
  onClose: () => void;
}

type Tab = 'basics' | 'buildings' | 'modules' | 'systems' | 'controls';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'basics', label: 'Grundlagen', icon: '📖' },
  { key: 'buildings', label: 'Gebäude', icon: '🏗️' },
  { key: 'modules', label: 'Module', icon: '🔧' },
  { key: 'systems', label: 'Systeme', icon: '⚙️' },
  { key: 'controls', label: 'Steuerung', icon: '🎮' },
];

const RESOURCE_COLORS: Record<string, string> = {
  energy: '#f1c40f', scrap: '#9b59b6', steel: '#e67e22', electronics: '#2ecc71', data: '#3498db'
};
const RESOURCE_NAMES: Record<string, string> = {
  energy: 'Energie', scrap: 'Schrott', steel: 'Stahl', electronics: 'Elektronik', data: 'Daten'
};

function formatCost(cost: Record<string, number | undefined>) {
  return Object.entries(cost)
    .filter(([, v]) => v)
    .map(([k, v]) => (
      <span key={k} style={{ color: RESOURCE_COLORS[k] || '#2d3436', marginRight: '6px' }}>
        {v} {RESOURCE_NAMES[k] || k}
      </span>
    ));
}

const sectionStyle: React.CSSProperties = {
  marginBottom: '16px', padding: '14px', borderRadius: '10px',
  backgroundColor: '#f8f9fa', border: '1px solid #eee'
};

const headingStyle: React.CSSProperties = {
  fontSize: '15px', fontWeight: 'bold', color: '#2d3436', marginBottom: '8px'
};

const textStyle: React.CSSProperties = {
  fontSize: '12px', color: '#636e72', lineHeight: '1.6'
};

function BasicsTab() {
  return (
    <div>
      <div style={sectionStyle}>
        <div style={headingStyle}>🎯 Spielziel</div>
        <div style={textStyle}>
          Verteidige deinen <b>Kern</b> gegen endlose Gegnerwellen! Gegner spawnen von allen vier Seiten
          und laufen direkt auf den Kern zu. Wird der Kern zerstört, ist das Spiel vorbei.
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={headingStyle}>🏗️ Bauen</div>
        <div style={textStyle}>
          Wähle ein Gebäude in der <b>linken Sidebar</b> und klicke auf ein leeres Feld.
          Manche Gebäude (Schrottbohrer, Kristallbohrer, Stahlschmelze) müssen auf <b>Erzvorkommen</b> (graue Felder) platziert werden.
          <br /><br />
          <b>Rechtsklick</b> auf ein Gebäude entfernt es (50% Rückerstattung).
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={headingStyle}>⬆️ Upgrades</div>
        <div style={textStyle}>
          Klicke erneut auf ein Gebäude mit dem gleichen Typ ausgewählt → <b>Upgrade auf nächstes Level</b> (max. 5).
          <br />Pro Level: <b>+50% HP</b>, <b>+50% Schaden</b> (Türme), <b>+50% Einkommen</b> (Produzenten).
          <br />Kosten steigen pro Level. Das Gebäude wird beim Upgrade voll geheilt.
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={headingStyle}>💰 Ressourcen</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {Object.entries(RESOURCE_NAMES).map(([key, name]) => (
            <div key={key} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: RESOURCE_COLORS[key], display: 'inline-block' }} />
              <b style={{ color: RESOURCE_COLORS[key], minWidth: '70px' }}>{name}</b>
              <span style={{ color: '#636e72' }}>
                {key === 'energy' && '— Grundressource. Benötigt für fast alles. Quelle: Solarfeld.'}
                {key === 'scrap' && '— Grundressource. Baumaterial. Quelle: Schrottbohrer (auf Erz) + Kills.'}
                {key === 'steel' && '— Tier 2. Benötigt Techbaum. Quelle: Gießerei, Stahlschmelze, Recycler.'}
                {key === 'electronics' && '— Tier 2. Benötigt Techbaum. Quelle: E-Fabrik, Kristallbohrer, Recycler.'}
                {key === 'data' && '— Tier 3. Für Forschung + Endgame. Quelle: Forschungslabor.'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={headingStyle}>🌊 Spielmodi</div>
        <div style={textStyle}>
          <b>Endlos:</b> Gegner spawnen kontinuierlich und werden stetig stärker. Überlebe so lange wie möglich.
          <br /><b>Wellen:</b> Bauphase zwischen Wellen. Definierte Gegnerzahl pro Welle.
          Nutze die Bauphasen zum Umbauen und Upgraden.
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={headingStyle}>⭐ Schwierigkeitsgrade</div>
        <div style={textStyle}>
          <b>Leicht:</b> Weniger Gegner, langsamer, weniger Schaden.
          <br /><b>Mittel:</b> Ausgewogen. Empfohlen für den Einstieg.
          <br /><b>Schwer:</b> Mehr Gegner, schneller, höherer Schaden. Für Veteranen.
        </div>
      </div>
    </div>
  );
}

function BuildingsTab() {
  const categories = [
    { title: '⚔️ Verteidigung', types: [TileType.TURRET, TileType.HEAVY_TURRET, TileType.TESLA_COIL, TileType.LASER_TURRET, TileType.PLASMA_CANNON, TileType.DRONE_HANGAR, TileType.MINEFIELD] },
    { title: '🏭 Produktion', types: [TileType.SOLAR_PANEL, TileType.MINER, TileType.STEEL_SMELTER, TileType.CRYSTAL_DRILL, TileType.FOUNDRY, TileType.FABRICATOR, TileType.RECYCLER, TileType.LAB] },
    { title: '🛡️ Unterstützung', types: [TileType.WALL, TileType.REPAIR_BAY, TileType.SLOW_FIELD, TileType.SHIELD_GENERATOR, TileType.RADAR_STATION, TileType.DATA_VAULT] },
  ];

  return (
    <div>
      {categories.map(cat => (
        <div key={cat.title}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2d3436', margin: '12px 0 8px' }}>{cat.title}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {cat.types.map(type => {
              const stats = BUILDING_STATS[type];
              if (!stats) return null;
              return (
                <div key={type} style={{
                  ...sectionStyle, marginBottom: '4px', padding: '10px 14px',
                  display: 'flex', alignItems: 'flex-start', gap: '10px'
                }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0,
                    backgroundColor: BUILDING_COLORS[type] || '#999', marginTop: '2px',
                    border: '2px solid #2c3e50'
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#2d3436' }}>
                        {BUILDING_NAMES[type]}
                      </span>
                      {stats.damage && <span style={{ fontSize: '11px', color: '#e74c3c' }}>⚔ {stats.damage} Dmg</span>}
                      {stats.range && <span style={{ fontSize: '11px', color: '#3498db' }}>◎ {stats.range}</span>}
                      <span style={{ fontSize: '11px', color: '#636e72' }}>♥ {stats.maxHealth}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '2px' }}>{BUILDING_DESC[type]}</div>
                    <div style={{ fontSize: '11px', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                      <span style={{ color: '#636e72', marginRight: '4px' }}>Kosten:</span>
                      {stats.cost && formatCost(stats.cost)}
                    </div>
                    {stats.income && (
                      <div style={{ fontSize: '11px', marginTop: '2px' }}>
                        <span style={{ color: '#27ae60' }}>📈 </span>
                        {Object.entries(stats.income).filter(([,v]) => v).map(([k, v]) => (
                          <span key={k} style={{ color: RESOURCE_COLORS[k], marginRight: '6px' }}>+{v} {RESOURCE_NAMES[k]}/s</span>
                        ))}
                      </div>
                    )}
                    {stats.consumes && (
                      <div style={{ fontSize: '11px', marginTop: '2px' }}>
                        <span style={{ color: '#e74c3c' }}>📉 </span>
                        {Object.entries(stats.consumes).filter(([,v]) => v).map(([k, v]) => (
                          <span key={k} style={{ color: RESOURCE_COLORS[k], marginRight: '6px' }}>-{v} {RESOURCE_NAMES[k]}/s</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ModulesTab() {
  const moduleEntries = Object.entries(MODULE_DEFS).map(([k, v]) => ({ id: Number(k), ...v }));
  return (
    <div>
      <div style={sectionStyle}>
        <div style={headingStyle}>🔧 Wie Module funktionieren</div>
        <div style={textStyle}>
          Module werden über die <b>rechte Sidebar</b> auf Gebäude installiert. Jedes Gebäude kann <b>ein Modul</b> haben.
          Module müssen erst über den <b>Techbaum</b> freigeschaltet werden (das benötigte Gebäude muss unlocked sein).
          Module kosten Stahl, Elektronik oder Daten.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {moduleEntries.map(mod => (
          <div key={mod.id} style={{
            ...sectionStyle, marginBottom: '2px', padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
              backgroundColor: mod.color, border: '2px solid #2c3e50'
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#2d3436' }}>{mod.name}</span>
                <span style={{ fontSize: '11px', color: '#7f8c8d' }}>{mod.description}</span>
              </div>
              <div style={{ fontSize: '11px', marginTop: '3px', display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                <span style={{ color: '#636e72', marginRight: '4px' }}>Kosten:</span>
                {formatCost(mod.cost)}
              </div>
              {mod.requiresUnlock && (
                <div style={{ fontSize: '10px', color: '#b2bec3', marginTop: '2px' }}>
                  🔒 Benötigt: {BUILDING_NAMES[mod.requiresUnlock]}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SystemsTab() {
  return (
    <div>
      <div style={sectionStyle}>
        <div style={headingStyle}>🔬 Techbaum (T)</div>
        <div style={textStyle}>
          Schalte neue Gebäude mit <b>Kill-Punkten (KP)</b> frei. Jeder getötete Gegner gibt 1 KP.
          Der Techbaum hat <b>4 Tiers</b> (5 / 15 / 30 / 50 KP). Freischaltungen sind <b>permanent</b> über alle Runs.
          <br /><br />
          <b>Starter-Gebäude:</b> Solarfeld, Schrottbohrer, Schwere Mauer, Wächtergeschütz
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={headingStyle}>🔬 Forschungsbaum 2.0 (F)</div>
        <div style={textStyle}>
          Forschung kostet <b>Daten</b> (produziert von Forschungslaboren).
          Gibt Run-Buffs wie +Feuerrate, -Baukosten, +Einkommen — <b>resettet bei Game Over</b>.
          <br />10 Forschungsknoten, 4 Tiers, je max. 3 Stufen. Kosten steigen exponentiell.
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={headingStyle}>🏪 Ressourcenmarkt (M)</div>
        <div style={textStyle}>
          Tausche Ressourcen untereinander über <b>7 Handelsrouten</b>.
          <br />Kurse sind <b>dynamisch</b>: Viel verkaufen → Preis sinkt. Viel kaufen → Preis steigt.
          Kurse erholen sich langsam über Zeit. Ideal für Engpässe.
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={headingStyle}>⭐ Prestige</div>
        <div style={textStyle}>
          Bei Game Over bekommst du <b>Prestige-Punkte</b> basierend auf Kills + Spielzeit.
          Damit kaufst du <b>permanente Boni</b>: +Schaden, +Einkommen, -Baukosten, Start-Ressourcen.
          <br />Max. 10 Stufen pro Upgrade. Bleibt über alle Runs.
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={headingStyle}>📊 Statistiken (S)</div>
        <div style={textStyle}>
          Zeigt DPS-Ranking aller Türme, Gesamt-Schaden und Kill-Verteilung.
          Nützlich um zu sehen, welche Türme am effektivsten sind.
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={headingStyle}>💾 Speichern / Laden</div>
        <div style={textStyle}>
          Dein Spielstand wird im Browser gespeichert (localStorage).
          Klicke 💾 zum Speichern und 📂 zum Laden. Ein Slot verfügbar.
        </div>
      </div>
    </div>
  );
}

function ControlsTab() {
  const keys = [
    { key: 'Linksklick', desc: 'Gebäude / Modul platzieren oder upgraden' },
    { key: 'Rechtsklick', desc: 'Gebäude abreißen (50% Rückerstattung)' },
    { key: 'P', desc: 'Pause / Weiter' },
    { key: 'T', desc: 'Techbaum öffnen / schließen' },
    { key: 'S', desc: 'Statistik-Overlay' },
    { key: 'M', desc: 'Ressourcenmarkt' },
    { key: 'F', desc: 'Forschungsbaum 2.0' },
    { key: 'H', desc: 'Diesen Guide öffnen / schließen' },
    { key: 'R', desc: 'Neustart (nur bei Game Over)' },
    { key: 'Shift + Hover', desc: 'Detaillierte Level-Skalierung (Lv 1–5) anzeigen' },
    { key: '💾', desc: 'Spielstand speichern' },
    { key: '📂', desc: 'Spielstand laden' },
  ];

  return (
    <div>
      <div style={sectionStyle}>
        <div style={headingStyle}>🎮 Tastenbelegung & Steuerung</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {keys.map(k => (
            <div key={k.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
              <span style={{
                fontWeight: 'bold', fontFamily: 'monospace', fontSize: '12px',
                padding: '2px 8px', borderRadius: '4px',
                backgroundColor: '#eee', border: '1px solid #ddd', color: '#2d3436',
                minWidth: '90px', textAlign: 'center'
              }}>{k.key}</span>
              <span style={{ color: '#636e72' }}>{k.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={headingStyle}>💡 Tipps für Anfänger</div>
        <div style={textStyle}>
          <b>1.</b> Baue zuerst 3–4 Solarfelder und 2–3 Schrottbohrer auf Erzvorkommen.
          <br /><b>2.</b> Platziere Mauern um den Kern als Puffer.
          <br /><b>3.</b> Baue 2 Wächtergeschütze an den exponiertesten Seiten.
          <br /><b>4.</b> Schalte im Techbaum die Gießerei frei → Stahl → bessere Gebäude.
          <br /><b>5.</b> Upgrades sind oft besser als neue Gebäude — ein Lv3-Turm &gt; 2× Lv1.
          <br /><b>6.</b> Reparaturbucht hinter der Frontlinie hält alles am Leben.
          <br /><b>7.</b> In den ersten Runs bewusst sterben → Prestige-Punkte sammeln.
        </div>
      </div>
    </div>
  );
}

export const GuideOverlay = ({ onClose }: GuideOverlayProps) => {
  const [tab, setTab] = useState<Tab>('basics');

  return (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 900,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: '#fff', borderRadius: '16px', padding: '24px',
        maxWidth: '750px', width: '95%', maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#2d3436' }}>📖 Spiel-Guide</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#7f8c8d'
          }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexShrink: 0, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold',
              fontFamily: 'monospace', cursor: 'pointer', border: 'none',
              backgroundColor: tab === t.key ? '#2d3436' : '#f0f0f0',
              color: tab === t.key ? '#fff' : '#636e72',
              transition: 'all 0.15s'
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {tab === 'basics' && <BasicsTab />}
          {tab === 'buildings' && <BuildingsTab />}
          {tab === 'modules' && <ModulesTab />}
          {tab === 'systems' && <SystemsTab />}
          {tab === 'controls' && <ControlsTab />}
        </div>

        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: '#b2bec3', flexShrink: 0 }}>
          Drücke <b>H</b> zum Öffnen/Schließen
        </div>
      </div>
    </div>
  );
};
