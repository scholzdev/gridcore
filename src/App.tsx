
import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, DIFFICULTY_PRESETS, TECH_TREE, STARTER_BUILDINGS } from './game/Engine';
import type { Difficulty, TechNode } from './game/Engine';
import { TileType, BUILDING_STATS, ModuleType, MODULE_DEFS } from './game/Grid';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [isEngineReady, setIsEngineReady] = useState(false);
  
  const [resources, setResources] = useState({ energy: 50, scrap: 40, data: 0, steel: 0, electronics: 0 });
  const [coreHealth, setCoreHealth] = useState({ current: 5000, max: 5000 });
  const [gameStats, setGameStats] = useState({ time: 0, killed: 0 });
  const [selectedBuilding, setSelectedBuilding] = useState<TileType>(TileType.SOLAR_PANEL);
  const [selectedModule, setSelectedModule] = useState<ModuleType>(ModuleType.NONE);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0, show: false });
  const [hoveredData, setHoveredData] = useState<any>(null);
  const [paused, setPaused] = useState(false);
  const [netIncome, setNetIncome] = useState({ energy: 0, scrap: 0, steel: 0, electronics: 0, data: 0 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('leicht');
  const [gameStarted, setGameStarted] = useState(false);
  const [showTechTree, setShowTechTree] = useState(false);
  const [killPoints, setKillPoints] = useState(0);
  const [unlockedBuildings, setUnlockedBuildings] = useState<Set<TileType>>(new Set(STARTER_BUILDINGS));

  useEffect(() => {
    if (!gameStarted || !canvasRef.current || engineRef.current) return;
    engineRef.current = new GameEngine(canvasRef.current);
    engineRef.current.setDifficulty(difficulty);
    setIsEngineReady(true);

    const loop = (t: number) => {
      if (!engineRef.current) return;
      engineRef.current.update(t);
      setResources({ ...engineRef.current.resources.state });
      
      const mid = 15;
      if (engineRef.current.grid.healths[mid][mid]) {
          setCoreHealth({ current: engineRef.current.grid.healths[mid][mid], max: BUILDING_STATS[TileType.CORE].maxHealth! });
      }
      
      setGameStats({
          time: engineRef.current.gameTime,
          killed: engineRef.current.enemiesKilled
      });
      setNetIncome({ ...engineRef.current.netIncome });
      setIsGameOver(engineRef.current.gameOver);
      setKillPoints(engineRef.current.killPoints);
      setUnlockedBuildings(new Set(engineRef.current.unlockedBuildings));
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, [gameStarted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        if (engineRef.current && !engineRef.current.gameOver) {
          engineRef.current.paused = !engineRef.current.paused;
          if (!engineRef.current.paused) engineRef.current.lastTick = 0;
          setPaused(engineRef.current.paused);
        }
      }
      if (e.key === 'r' || e.key === 'R') {
        if (engineRef.current && engineRef.current.gameOver) {
          handleRestart();
        }
      }
      if (e.key === 't' || e.key === 'T') {
        setShowTechTree(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRestart = () => {
    engineRef.current = null;
    setIsEngineReady(false);
    setResources({ energy: 50, scrap: 40, data: 0, steel: 0, electronics: 0 });
    setCoreHealth({ current: 5000, max: 5000 });
    setGameStats({ time: 0, killed: 0 });
    setNetIncome({ energy: 0, scrap: 0, steel: 0, electronics: 0, data: 0 });
    setPaused(false);
    setIsGameOver(false);
    setGameStarted(false);
    setShowTechTree(false);
    setKillPoints(0);
    setUnlockedBuildings(new Set(STARTER_BUILDINGS));
    setSelectedBuilding(TileType.SOLAR_PANEL);
    setSelectedModule(ModuleType.NONE);
  };

  const handleUnlock = (node: TechNode) => {
    if (!engineRef.current) return;
    if (engineRef.current.unlockBuilding(node)) {
      setKillPoints(engineRef.current.killPoints);
      setUnlockedBuildings(new Set(engineRef.current.unlockedBuildings));
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!engineRef.current || !isEngineReady) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const { zoom } = engineRef.current;
    const worldX = Math.floor((e.clientX - rect.left) / zoom);
    const worldY = Math.floor((e.clientY - rect.top) / zoom);

    if (worldX >= 0 && worldX < 30 && worldY >= 0 && worldY < 30) {
      const type = engineRef.current.grid.tiles[worldY][worldX];
      if (type !== TileType.EMPTY && type !== TileType.ORE_PATCH) {
        const level = engineRef.current.grid.levels[worldY][worldX] || 1;
        const stats = BUILDING_STATS[type] || {};
        const mult = 1 + (level - 1) * 0.5;
        // Level-skalierte Income-Werte berechnen
        const scaledIncome = stats.income ? {
          energy: stats.income.energy ? Math.floor(stats.income.energy * mult * 10) / 10 : undefined,
          scrap: stats.income.scrap ? Math.floor(stats.income.scrap * mult * 10) / 10 : undefined,
          steel: stats.income.steel ? Math.floor(stats.income.steel * mult * 10) / 10 : undefined,
          electronics: stats.income.electronics ? Math.floor(stats.income.electronics * mult * 10) / 10 : undefined,
          data: stats.income.data ? Math.floor(stats.income.data * mult * 10) / 10 : undefined,
        } : undefined;
        // Level-skalierter Damage für Turrets
        const scaledDamage = stats.damage ? Math.floor(stats.damage * mult * 10) / 10 : undefined;
        setHoveredData({
          name: TileType[type].replace('_', ' '),
          stats: { ...stats, income: scaledIncome, damage: scaledDamage },
          hp: engineRef.current.grid.healths[worldY][worldX],
          shield: engineRef.current.grid.shields[worldY][worldX],
          level: level,
          upgradeCost: engineRef.current.getUpgradeCost(type, level),
          refund: engineRef.current.getRefund(type, level),
          canRemove: type !== TileType.CORE,
          module: engineRef.current.grid.modules[worldY][worldX],
          tileType: type
        });
        setHoverPos({ x: e.clientX + 15, y: e.clientY + 15, show: true });
        return;
      }
    }
    setHoverPos(h => ({ ...h, show: false }));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !isEngineReady) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const { zoom } = engineRef.current;
    const worldX = Math.floor((e.clientX - rect.left) / zoom);
    const worldY = Math.floor((e.clientY - rect.top) / zoom);
    
    const currentTile = engineRef.current.grid.tiles[worldY][worldX];

    // CASE 0: MODULE INSTALL (wenn ein Modul ausgewählt ist)
    if (selectedModule !== ModuleType.NONE) {
        const modDef = MODULE_DEFS[selectedModule];
        if (modDef && engineRef.current.resources.canAfford(modDef.cost)) {
            if (engineRef.current.grid.installModule(worldX, worldY, selectedModule)) {
                engineRef.current.resources.spend(modDef.cost);
                setResources({ ...engineRef.current.resources.state });
            }
        }
        return;
    }

    // CASE 1: UPGRADE (Wenn gleiches Gebäude und nicht Core)
    if (currentTile === selectedBuilding && currentTile !== TileType.CORE) {
        const currentLevel = engineRef.current.grid.levels[worldY][worldX];
        const upgradeCost = engineRef.current.getUpgradeCost(currentTile, currentLevel);
        
        if (upgradeCost && engineRef.current.resources.canAfford(upgradeCost)) {
            if (engineRef.current.grid.upgradeBuilding(worldX, worldY)) {
                engineRef.current.resources.spend(upgradeCost);
                setResources({ ...engineRef.current.resources.state });
            }
        }
    } 
    // CASE 2: NEUBAU
    else {
        const cost = engineRef.current.getCurrentCost(selectedBuilding);
        if (engineRef.current.resources.canAfford(cost)) {
            if (engineRef.current.grid.placeBuilding(worldX, worldY, selectedBuilding)) {
                engineRef.current.resources.spend(cost);
                engineRef.current.purchasedCounts[selectedBuilding] = (engineRef.current.purchasedCounts[selectedBuilding] || 0) + 1;
                engineRef.current.buildingsPlaced++;
                setResources({ ...engineRef.current.resources.state });
            }
        }
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!engineRef.current || !isEngineReady) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const { zoom } = engineRef.current;
    const worldX = Math.floor((e.clientX - rect.left) / zoom);
    const worldY = Math.floor((e.clientY - rect.top) / zoom);
    if (worldX < 0 || worldY < 0 || worldX >= 30 || worldY >= 30) return;

    const type = engineRef.current.grid.tiles[worldY][worldX];
    const level = engineRef.current.grid.levels[worldY][worldX] || 1;
    const refund = engineRef.current.getRefund(type, level);
    const removedLevel = engineRef.current.grid.removeBuilding(worldX, worldY);
    if (removedLevel > 0) {
        engineRef.current.resources.add(refund);
        if (engineRef.current.purchasedCounts[type] > 0) engineRef.current.purchasedCounts[type]--;
        setResources({ ...engineRef.current.resources.state });
    }
  };

  const canAffordBuilding = (type: TileType) => {
    if (!engineRef.current || !isEngineReady) return true;
    const cost = engineRef.current.getCurrentCost(type);
    return engineRef.current.resources.canAfford(cost);
  };

  const canAffordModule = (modType: ModuleType) => {
    if (!engineRef.current || !isEngineReady) return true;
    const def = MODULE_DEFS[modType];
    if (!def) return false;
    return engineRef.current.resources.canAfford(def.cost);
  };

  const getCostString = (type: TileType) => {
    const stats = BUILDING_STATS[type];
    if (!stats) return "???";
    const cost = (isEngineReady && engineRef.current) 
        ? engineRef.current.getCurrentCost(type) 
        : stats.cost;
        
    if (!cost) return "0 Sc";
    let p = [];
    if (cost.scrap) p.push(`${cost.scrap} Schrott`);
    if (cost.energy) p.push(`${cost.energy} Energie`);
    if (cost.steel) p.push(`${cost.steel} Stahl`);
    if (cost.electronics) p.push(`${cost.electronics} E-Komp`);
    if (cost.data) p.push(`${cost.data} Daten`);
    return p.join(" / ");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!gameStarted) {
    return (
      <div style={{
        backgroundColor: '#f1f2f6', color: '#2d3436', height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', gap: '40px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#00d2d3', marginBottom: '8px' }}>Rectangular</div>
          <div style={{ fontSize: '16px', color: '#7f8c8d' }}>Verteidige deinen Kern gegen endlose Wellen</div>
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
  }

  return (
    <div style={{ backgroundColor: '#f1f2f6', color: '#2d3436', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* TOOLTIP MIT UPGRADE INFO */}
      {hoverPos.show && hoveredData && (
        <div style={{
          position: 'fixed', left: hoverPos.x, top: hoverPos.y,
          backgroundColor: 'rgba(255, 255, 255, 0.98)', border: '2px solid #2d3436',
          padding: '12px', borderRadius: '8px', pointerEvents: 'none', zIndex: 1000,
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)', minWidth: '180px'
        }}>
          <div style={{ fontWeight: 'bold', borderBottom: '1px solid #dfe4ea', marginBottom: '8px', color: '#00d2d3', display: 'flex', justifyContent: 'space-between' }}>
            <span>{hoveredData.name}</span>
            <span style={{color: '#2d3436'}}>Lv.{hoveredData.level}</span>
          </div>
          <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {hoveredData.stats.income?.scrap && <div>Schrott: <span style={{ color: '#9b59b6', fontWeight: 'bold' }}>+{hoveredData.stats.income.scrap}/s</span></div>}
            {hoveredData.stats.income?.energy && <div>Energie: <span style={{ color: '#f1c40f', fontWeight: 'bold' }}>+{hoveredData.stats.income.energy}/s</span></div>}
            {hoveredData.stats.income?.steel && <div>Stahl: <span style={{ color: '#e67e22', fontWeight: 'bold' }}>+{hoveredData.stats.income.steel}/s</span></div>}
            {hoveredData.stats.income?.electronics && <div>E-Komp: <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>+{hoveredData.stats.income.electronics}/s</span></div>}
            {hoveredData.stats.income?.data && <div>Daten: <span style={{ color: '#3498db', fontWeight: 'bold' }}>+{hoveredData.stats.income.data}/s</span></div>}
            {hoveredData.stats.damage && <div>Schaden: <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>{hoveredData.stats.damage}</span>{hoveredData.stats.splash ? ' (Fläche)' : ''}</div>}
            {hoveredData.stats.range && <div style={{ opacity: 0.7 }}>Reichweite: {hoveredData.stats.range}</div>}
            {hoveredData.stats.consumes && <div style={{ marginTop: '4px', color: '#e74c3c', fontSize: '11px' }}>Verbraucht: {hoveredData.stats.consumes.energy ? `${hoveredData.stats.consumes.energy} En ` : ''}{hoveredData.stats.consumes.scrap ? `${hoveredData.stats.consumes.scrap} Sc ` : ''}{hoveredData.stats.consumes.electronics ? `${hoveredData.stats.consumes.electronics} Ek ` : ''}{hoveredData.stats.consumes.data ? `${hoveredData.stats.consumes.data} Da` : ''}</div>}
            
            <div style={{ marginTop: '5px', opacity: 0.7, fontSize: '11px' }}>Zustand: {Math.floor(hoveredData.hp)} HP{hoveredData.shield > 0 ? ` | Schild: ${Math.floor(hoveredData.shield)}` : ''}</div>
            
            {hoveredData.upgradeCost && hoveredData.level < 5 && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #ccc' }}>
                    <div style={{fontWeight: 'bold', fontSize: '11px', color: '#27ae60'}}>UPGRADE-KOSTEN (Klick):</div>
                    <div style={{fontSize: '11px'}}>
                        {hoveredData.upgradeCost.scrap > 0 && <span>{hoveredData.upgradeCost.scrap} Sc </span>}
                        {hoveredData.upgradeCost.energy > 0 && <span>{hoveredData.upgradeCost.energy} En </span>}
                        {hoveredData.upgradeCost.steel > 0 && <span>{hoveredData.upgradeCost.steel} St </span>}
                        {hoveredData.upgradeCost.electronics > 0 && <span>{hoveredData.upgradeCost.electronics} Ec </span>}
                        {hoveredData.upgradeCost.data > 0 && <span>{hoveredData.upgradeCost.data} Da</span>}
                    </div>
                </div>
            )}
            {hoveredData.level >= 5 && <div style={{ marginTop: '5px', color: '#e74c3c', fontSize: '11px', fontWeight: 'bold' }}>MAX STUFE</div>}
            
            {hoveredData.canRemove && hoveredData.refund && (
                <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #ccc' }}>
                    <div style={{fontWeight: 'bold', fontSize: '11px', color: '#e74c3c'}}>ENTFERNEN (Rechtsklick):</div>
                    <div style={{fontSize: '11px', color: '#7f8c8d'}}>
                        Erstattung: {[hoveredData.refund.scrap > 0 && `${hoveredData.refund.scrap} Sc`, hoveredData.refund.energy > 0 && `${hoveredData.refund.energy} En`, hoveredData.refund.steel > 0 && `${hoveredData.refund.steel} St`, hoveredData.refund.electronics > 0 && `${hoveredData.refund.electronics} Ec`, hoveredData.refund.data > 0 && `${hoveredData.refund.data} Da`].filter(Boolean).join(' ')}
                    </div>
                </div>
            )}
            
            {hoveredData.module !== 0 && MODULE_DEFS[hoveredData.module] && (
                <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #ccc' }}>
                    <div style={{fontWeight: 'bold', fontSize: '11px', color: MODULE_DEFS[hoveredData.module].color}}>MODUL: {MODULE_DEFS[hoveredData.module].name}</div>
                    <div style={{fontSize: '11px', color: '#7f8c8d'}}>{MODULE_DEFS[hoveredData.module].description}</div>
                </div>
            )}
          </div>
        </div>
      )}

      {/* TECH TREE OVERLAY */}
      {showTechTree && (
        <div onClick={() => setShowTechTree(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            backgroundColor: '#fff', borderRadius: '16px', padding: '30px',
            maxWidth: '800px', width: '90%', maxHeight: '85vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: '#2d3436' }}>🔬 Techbaum</h2>
              <button onClick={() => setShowTechTree(false)} style={{
                background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#7f8c8d'
              }}>✕</button>
            </div>
            {[1, 2, 3, 4].map(tier => {
              const tierNodes = TECH_TREE.filter(n => n.tier === tier);
              const tierLabels = ['', 'Basis', 'Erweitert', 'Fortgeschritten', 'Elite'];
              const tierColors = ['', '#27ae60', '#f39c12', '#e74c3c', '#8e44ad'];
              return (
                <div key={tier} style={{ marginBottom: '16px' }}>
                  <div style={{
                    fontSize: '11px', fontWeight: 'bold', color: tierColors[tier],
                    textTransform: 'uppercase', marginBottom: '8px',
                    borderBottom: `2px solid ${tierColors[tier]}30`, paddingBottom: '4px'
                  }}>
                    Tier {tier} — {tierLabels[tier]} · {tierNodes[0]?.killCost} KP pro Gebäude
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tierNodes.length}, 1fr)`, gap: '8px', alignItems: 'stretch' }}>
                    {tierNodes.map(node => {
                      const isUnlocked = unlockedBuildings.has(node.unlocks);
                      const canAfford = killPoints >= node.killCost;
                      const bColor = BUILDING_COLORS[node.unlocks] || '#7f8c8d';
                      const bStats = BUILDING_STATS[node.unlocks];
                      const costStr = (() => {
                        const c = bStats?.cost;
                        if (!c) return '';
                        const p: string[] = [];
                        if (c.scrap) p.push(`${c.scrap} Schrott`);
                        if (c.energy) p.push(`${c.energy} Energie`);
                        if (c.steel) p.push(`${c.steel} Stahl`);
                        if (c.electronics) p.push(`${c.electronics} E-Komp`);
                        if (c.data) p.push(`${c.data} Daten`);
                        return p.join(' / ');
                      })();
                      return (
                        <TechNodeCard key={node.id} node={node} isUnlocked={isUnlocked} canAfford={canAfford}
                          bColor={bColor} bStats={bStats} costStr={costStr}
                          onUnlock={() => handleUnlock(node)} />
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {/* KP centered at bottom */}
            <div style={{
              textAlign: 'center', marginTop: '12px', paddingTop: '12px',
              borderTop: '1px solid #dfe4ea'
            }}>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#8e44ad' }}>{killPoints} KP</span>
              <div style={{ fontSize: '11px', color: '#b2bec3', marginTop: '4px' }}>
                Drücke T zum Schließen · Besiege Gegner für KP
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOP BAR - Resources & Status */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '10px 25px', backgroundColor: '#ffffff', borderBottom: '1px solid #dfe4ea',
        flexShrink: 0, gap: '30px'
      }}>
        <button onClick={() => { if (engineRef.current) { engineRef.current.paused = !engineRef.current.paused; if (!engineRef.current.paused) engineRef.current.lastTick = 0; setPaused(engineRef.current.paused); }}} style={{
          padding: '4px 12px', cursor: 'pointer', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', fontFamily: 'monospace',
          backgroundColor: paused ? '#e74c3c' : '#27ae60', color: '#fff', border: 'none'
        }}>{paused ? '▶ WEITER' : '⏸ PAUSE'}</button>
        {isGameOver && <button onClick={handleRestart} style={{
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
        <button onClick={() => setShowTechTree(prev => !prev)} style={{
          padding: '4px 12px', cursor: 'pointer', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace',
          backgroundColor: showTechTree ? '#8e44ad' : '#9b59b6', color: '#fff', border: 'none'
        }}>🔬 TECHBAUM ({killPoints} KP)</button>
        <div style={{ fontSize: '14px' }}>KERN: <span style={{ color: coreHealth.current < coreHealth.max * 0.3 ? '#e74c3c' : '#2d3436', fontWeight: 'bold' }}>{Math.max(0, Math.floor(coreHealth.current))}</span></div>
        <div style={{ width: '1px', height: '20px', backgroundColor: '#dfe4ea' }} />
        <div style={{ fontSize: '14px' }}>Energie: <span style={{ color: '#f1c40f', fontWeight: 'bold' }}>{Math.floor(resources.energy)}</span> <span style={{ fontSize: '11px', color: netIncome.energy >= 0 ? '#27ae60' : '#e74c3c' }}>{netIncome.energy >= 0 ? '+' : ''}{netIncome.energy}/s</span></div>
        <div style={{ fontSize: '14px' }}>Schrott: <span style={{ color: '#9b59b6', fontWeight: 'bold' }}>{Math.floor(resources.scrap)}</span> <span style={{ fontSize: '11px', color: netIncome.scrap >= 0 ? '#27ae60' : '#e74c3c' }}>{netIncome.scrap >= 0 ? '+' : ''}{netIncome.scrap}/s</span></div>
        <div style={{ fontSize: '14px' }}>Stahl: <span style={{ color: '#e67e22', fontWeight: 'bold' }}>{Math.floor(resources.steel)}</span> <span style={{ fontSize: '11px', color: netIncome.steel >= 0 ? '#27ae60' : '#e74c3c' }}>{netIncome.steel >= 0 ? '+' : ''}{netIncome.steel}/s</span></div>
        <div style={{ fontSize: '14px' }}>E-Komp: <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>{Math.floor(resources.electronics)}</span> <span style={{ fontSize: '11px', color: netIncome.electronics >= 0 ? '#27ae60' : '#e74c3c' }}>{netIncome.electronics >= 0 ? '+' : ''}{netIncome.electronics}/s</span></div>
        <div style={{ fontSize: '14px' }}>Daten: <span style={{ color: '#3498db', fontWeight: 'bold' }}>{Math.floor(resources.data)}</span> <span style={{ fontSize: '11px', color: netIncome.data >= 0 ? '#27ae60' : '#e74c3c' }}>{netIncome.data >= 0 ? '+' : ''}{netIncome.data}/s</span></div>
      </div>

      {/* MAIN AREA: Left Sidebar + Canvas + Right Sidebar */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT SIDEBAR - Buildings */}
        <div style={{ width: '260px', padding: '15px', borderRight: '1px solid #dfe4ea', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', backgroundColor: '#ffffff' }}>
          <h3 style={{ margin: '0', fontSize: '14px', color: '#7f8c8d' }}>KONSTRUKTION</h3>
          <BuildGroup label="Infrastruktur">
            <BuildBtn type={TileType.SOLAR_PANEL} selected={selectedModule === ModuleType.NONE ? selectedBuilding : -1} set={(t: TileType) => { setSelectedBuilding(t); setSelectedModule(ModuleType.NONE); }} label="Solarfeld" cost={getCostString(TileType.SOLAR_PANEL)} color="#f1c40f" affordable={canAffordBuilding(TileType.SOLAR_PANEL)} />
            <BuildBtn type={TileType.MINER} selected={selectedModule === ModuleType.NONE ? selectedBuilding : -1} set={(t: TileType) => { setSelectedBuilding(t); setSelectedModule(ModuleType.NONE); }} label="Minenbohrer" cost={getCostString(TileType.MINER)} color="#9b59b6" affordable={canAffordBuilding(TileType.MINER)} />
            <BuildBtn type={TileType.WALL} selected={selectedModule === ModuleType.NONE ? selectedBuilding : -1} set={(t: TileType) => { setSelectedBuilding(t); setSelectedModule(ModuleType.NONE); }} label="Schwere Mauer" cost={getCostString(TileType.WALL)} color="#576574" affordable={canAffordBuilding(TileType.WALL)} />
            <BuildBtn type={TileType.REPAIR_BAY} selected={selectedModule === ModuleType.NONE ? selectedBuilding : -1} set={(t: TileType) => { setSelectedBuilding(t); setSelectedModule(ModuleType.NONE); }} label="Reparaturbucht" cost={getCostString(TileType.REPAIR_BAY)} color="#e056a0" affordable={canAffordBuilding(TileType.REPAIR_BAY)} locked={!unlockedBuildings.has(TileType.REPAIR_BAY)} />
          </BuildGroup>
          <BuildGroup label="Verteidigung">
            <BuildBtn type={TileType.TURRET} selected={selectedModule === ModuleType.NONE ? selectedBuilding : -1} set={(t: TileType) => { setSelectedBuilding(t); setSelectedModule(ModuleType.NONE); }} label="Wächtergeschütz" cost={getCostString(TileType.TURRET)} color="#e67e22" affordable={canAffordBuilding(TileType.TURRET)} />
            <BuildBtn type={TileType.HEAVY_TURRET} selected={selectedModule === ModuleType.NONE ? selectedBuilding : -1} set={(t: TileType) => { setSelectedBuilding(t); setSelectedModule(ModuleType.NONE); }} label="Sturmgeschütz" cost={getCostString(TileType.HEAVY_TURRET)} color="#c0392b" affordable={canAffordBuilding(TileType.HEAVY_TURRET)} locked={!unlockedBuildings.has(TileType.HEAVY_TURRET)} />
            <BuildBtn type={TileType.TESLA_COIL} selected={selectedModule === ModuleType.NONE ? selectedBuilding : -1} set={(t: TileType) => { setSelectedBuilding(t); setSelectedModule(ModuleType.NONE); }} label="Teslaspule" cost={getCostString(TileType.TESLA_COIL)} color="#6c5ce7" affordable={canAffordBuilding(TileType.TESLA_COIL)} locked={!unlockedBuildings.has(TileType.TESLA_COIL)} />
            <BuildBtn type={TileType.PLASMA_CANNON} selected={selectedModule === ModuleType.NONE ? selectedBuilding : -1} set={(t: TileType) => { setSelectedBuilding(t); setSelectedModule(ModuleType.NONE); }} label="Plasmakanone" cost={getCostString(TileType.PLASMA_CANNON)} color="#fd79a8" affordable={canAffordBuilding(TileType.PLASMA_CANNON)} locked={!unlockedBuildings.has(TileType.PLASMA_CANNON)} />
          </BuildGroup>
          <BuildGroup label="Unterstützung">
            <BuildBtn type={TileType.SLOW_FIELD} selected={selectedModule === ModuleType.NONE ? selectedBuilding : -1} set={(t: TileType) => { setSelectedBuilding(t); setSelectedModule(ModuleType.NONE); }} label="EMP-Feld" cost={getCostString(TileType.SLOW_FIELD)} color="#a29bfe" affordable={canAffordBuilding(TileType.SLOW_FIELD)} locked={!unlockedBuildings.has(TileType.SLOW_FIELD)} />
            <BuildBtn type={TileType.SHIELD_GENERATOR} selected={selectedModule === ModuleType.NONE ? selectedBuilding : -1} set={(t: TileType) => { setSelectedBuilding(t); setSelectedModule(ModuleType.NONE); }} label="Schildgenerator" cost={getCostString(TileType.SHIELD_GENERATOR)} color="#74b9ff" affordable={canAffordBuilding(TileType.SHIELD_GENERATOR)} locked={!unlockedBuildings.has(TileType.SHIELD_GENERATOR)} />
            <BuildBtn type={TileType.RADAR_STATION} selected={selectedModule === ModuleType.NONE ? selectedBuilding : -1} set={(t: TileType) => { setSelectedBuilding(t); setSelectedModule(ModuleType.NONE); }} label="Radarstation" cost={getCostString(TileType.RADAR_STATION)} color="#fdcb6e" affordable={canAffordBuilding(TileType.RADAR_STATION)} locked={!unlockedBuildings.has(TileType.RADAR_STATION)} />
          </BuildGroup>
          <BuildGroup label="Verarbeitung">
            <BuildBtn type={TileType.FOUNDRY} selected={selectedModule === ModuleType.NONE ? selectedBuilding : -1} set={(t: TileType) => { setSelectedBuilding(t); setSelectedModule(ModuleType.NONE); }} label="Gießerei" cost={getCostString(TileType.FOUNDRY)} color="#ff9f43" affordable={canAffordBuilding(TileType.FOUNDRY)} locked={!unlockedBuildings.has(TileType.FOUNDRY)} />
            <BuildBtn type={TileType.FABRICATOR} selected={selectedModule === ModuleType.NONE ? selectedBuilding : -1} set={(t: TileType) => { setSelectedBuilding(t); setSelectedModule(ModuleType.NONE); }} label="E-Fabrik" cost={getCostString(TileType.FABRICATOR)} color="#1dd1a1" affordable={canAffordBuilding(TileType.FABRICATOR)} locked={!unlockedBuildings.has(TileType.FABRICATOR)} />
            <BuildBtn type={TileType.RECYCLER} selected={selectedModule === ModuleType.NONE ? selectedBuilding : -1} set={(t: TileType) => { setSelectedBuilding(t); setSelectedModule(ModuleType.NONE); }} label="Recycler" cost={getCostString(TileType.RECYCLER)} color="#55efc4" affordable={canAffordBuilding(TileType.RECYCLER)} locked={!unlockedBuildings.has(TileType.RECYCLER)} />
          </BuildGroup>
          <BuildGroup label="Forschung">
            <BuildBtn type={TileType.LAB} selected={selectedBuilding} set={(t: TileType) => { setSelectedBuilding(t); setSelectedModule(ModuleType.NONE); }} label="Forschungslabor" cost={getCostString(TileType.LAB)} color="#54a0ff" affordable={canAffordBuilding(TileType.LAB)} locked={!unlockedBuildings.has(TileType.LAB)} />
            <BuildBtn type={TileType.DATA_VAULT} selected={selectedBuilding} set={(t: TileType) => { setSelectedBuilding(t); setSelectedModule(ModuleType.NONE); }} label="Datentresor" cost={getCostString(TileType.DATA_VAULT)} color="#00cec9" affordable={canAffordBuilding(TileType.DATA_VAULT)} locked={!unlockedBuildings.has(TileType.DATA_VAULT)} />
          </BuildGroup>
        </div>

        {/* CENTER - Game Canvas */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <canvas 
            ref={canvasRef} 
            onMouseMove={handleMouseMove} 
            onMouseLeave={() => setHoverPos(h => ({ ...h, show: false }))}
            onClick={handleCanvasClick}
            onContextMenu={handleContextMenu}
            style={{ cursor: 'crosshair', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', borderRadius: '8px' }} 
          />
        </div>

        {/* RIGHT SIDEBAR - Modules */}
        <div style={{ width: '260px', padding: '15px', borderLeft: '1px solid #dfe4ea', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', backgroundColor: '#ffffff' }}>
          <h3 style={{ margin: '0', fontSize: '14px', color: '#7f8c8d' }}>MODULE</h3>
          <div style={{ fontSize: '11px', opacity: 0.5, marginBottom: '4px' }}>Wähle ein Modul, dann klicke auf ein Gebäude zum Installieren.</div>
          {Object.entries(MODULE_DEFS).map(([key, def]) => {
            const modType = Number(key) as ModuleType;
            const costParts: string[] = [];
            if (def.cost.steel) costParts.push(`${def.cost.steel} Stahl`);
            if (def.cost.electronics) costParts.push(`${def.cost.electronics} E-Komp`);
            if (def.cost.data) costParts.push(`${def.cost.data} Daten`);
            return (
              <button key={key} onClick={() => { setSelectedModule(modType === selectedModule ? ModuleType.NONE : modType); setSelectedBuilding(TileType.SOLAR_PANEL); }} style={{
                padding: '10px', textAlign: 'left', cursor: 'pointer', borderRadius: '8px',
                backgroundColor: selectedModule === modType ? '#f1f2f6' : 'transparent',
                border: selectedModule === modType ? `2px solid ${def.color}` : '1px solid #dfe4ea',
                color: '#2d3436', display: 'flex', alignItems: 'center', gap: '10px',
                opacity: canAffordModule(modType) ? 1 : 0.35
              }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: def.color, flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{def.name}</span>
                  <span style={{ fontSize: '11px', opacity: 0.6 }}>{def.description}</span>
                  <span style={{ fontSize: '11px', opacity: 0.5, marginTop: '2px' }}>{costParts.join(' / ')}</span>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}

const BuildGroup = ({ label, children }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <div style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase', fontWeight: 'bold' }}>{label}</div>
    {children}
  </div>
);

const TechNodeCard = ({ node, isUnlocked, canAfford, bColor, bStats, costStr, onUnlock }: any) => {
  const [hover, setHover] = React.useState(false);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [shift, setShift] = React.useState(false);
  const desc = BUILDING_DESC[node.unlocks] || node.description;

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'Shift') setShift(true); };
    const up = (e: KeyboardEvent) => { if (e.key === 'Shift') setShift(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const incParts: string[] = [];
  if (bStats?.income?.energy) incParts.push(`+${bStats.income.energy} Energie`);
  if (bStats?.income?.scrap) incParts.push(`+${bStats.income.scrap} Schrott`);
  if (bStats?.income?.steel) incParts.push(`+${bStats.income.steel} Stahl`);
  if (bStats?.income?.electronics) incParts.push(`+${bStats.income.electronics} E-Komp`);
  if (bStats?.income?.data) incParts.push(`+${bStats.income.data} Daten`);
  const conParts: string[] = [];
  if (bStats?.consumes?.energy) conParts.push(`${bStats.consumes.energy} Energie`);
  if (bStats?.consumes?.scrap) conParts.push(`${bStats.consumes.scrap} Schrott`);
  if (bStats?.consumes?.electronics) conParts.push(`${bStats.consumes.electronics} E-Komp`);
  if (bStats?.consumes?.data) conParts.push(`${bStats.consumes.data} Daten`);

  const showDetails = hover && shift;

  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      style={{
        padding: '10px', borderRadius: '8px',
        border: isUnlocked ? `2px solid ${bColor}` : canAfford ? '2px solid #8e44ad' : '1px solid #dfe4ea',
        backgroundColor: isUnlocked ? `${bColor}10` : canAfford ? '#fff' : '#f8f9fa',
        display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'default'
      }}
    >
      {/* Name + cost — like sidebar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: bColor, flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#2d3436' }}>{node.name}</span>
          <span style={{ fontSize: '10px', opacity: 0.6 }}>{costStr}</span>
        </div>
        {isUnlocked && <span style={{ fontSize: '12px', flexShrink: 0 }}>✅</span>}
        {!isUnlocked && <span style={{ fontSize: '12px', flexShrink: 0 }}>🔒</span>}
      </div>
      {/* Unlock button */}
      {!isUnlocked && (
        <button onClick={onUnlock} disabled={!canAfford} style={{
          marginTop: 'auto', padding: '5px 10px', borderRadius: '6px', fontSize: '11px',
          fontWeight: 'bold', fontFamily: 'monospace', cursor: canAfford ? 'pointer' : 'default',
          backgroundColor: canAfford ? '#8e44ad' : '#dfe4ea',
          color: canAfford ? '#fff' : '#7f8c8d',
          border: 'none', transition: 'all 0.15s', width: '100%'
        }}>
          {canAfford ? `Freischalten (${node.killCost} KP)` : `${node.killCost} KP benötigt`}
        </button>
      )}
      {/* Shift-hover tooltip — like sidebar */}
      {hover && (
        <div style={{
          position: 'fixed', left: mousePos.x + 15, top: mousePos.y - 10, zIndex: 1100,
          backgroundColor: '#ffffff', border: '2px solid #2d3436',
          padding: '10px 12px', borderRadius: '8px', width: showDetails ? 260 : 200,
          boxShadow: '0 4px 15px rgba(0,0,0,0.25)', pointerEvents: 'none'
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', color: bColor, marginBottom: '6px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
            {node.name} {showDetails && <span style={{ fontSize: '10px', color: '#7f8c8d' }}>Lv 1-5</span>}
          </div>
          <div style={{ fontSize: '11px', color: '#555', marginBottom: '6px' }}>{desc}</div>
          {!showDetails ? (
            <>
              {incParts.length > 0 && <div style={{ fontSize: '11px', color: '#27ae60', fontWeight: 'bold' }}>{incParts.join(', ')}/s</div>}
              {conParts.length > 0 && <div style={{ fontSize: '11px', color: '#e74c3c', marginTop: '2px' }}>Verbraucht: {conParts.join(', ')}/s</div>}
              {bStats?.damage && <div style={{ fontSize: '11px', color: '#e67e22', marginTop: '2px' }}>Schaden: {bStats.damage}{bStats.range ? ` · Reichweite: ${bStats.range}` : ''}</div>}
              {bStats?.range && !bStats?.damage && <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '2px' }}>Reichweite: {bStats.range}</div>}
              <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '4px' }}>HP: {bStats?.maxHealth}</div>
              <div style={{ fontSize: '10px', color: '#b2bec3', marginTop: '6px', fontStyle: 'italic' }}>Shift halten für Skalierung</div>
            </>
          ) : (
            <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px', borderTop: '1px solid #eee', paddingTop: '4px' }}>
              <div style={{ fontSize: '10px', color: '#7f8c8d', fontWeight: 'bold', marginBottom: '1px' }}>Stufe 1 / 2 / 3 / 4 / 5</div>
              {bStats?.damage && <div><span style={{ color: '#e67e22', fontWeight: 'bold' }}>Schaden:</span> {scaleVals(bStats.damage)}</div>}
              {bStats?.range && <div><span style={{ color: '#7f8c8d' }}>Reichweite:</span> {bStats.range} (fest)</div>}
              {bStats?.income?.energy && <div><span style={{ color: '#27ae60', fontWeight: 'bold' }}>Energie:</span> {scaleVals(bStats.income.energy)}/s</div>}
              {bStats?.income?.scrap && <div><span style={{ color: '#27ae60', fontWeight: 'bold' }}>Schrott:</span> {scaleVals(bStats.income.scrap)}/s</div>}
              {bStats?.income?.steel && <div><span style={{ color: '#27ae60', fontWeight: 'bold' }}>Stahl:</span> {scaleVals(bStats.income.steel)}/s</div>}
              {bStats?.income?.electronics && <div><span style={{ color: '#27ae60', fontWeight: 'bold' }}>E-Komp:</span> {scaleVals(bStats.income.electronics)}/s</div>}
              {bStats?.income?.data && <div><span style={{ color: '#27ae60', fontWeight: 'bold' }}>Daten:</span> {scaleVals(bStats.income.data)}/s</div>}
              <div><span style={{ color: '#7f8c8d' }}>HP:</span> {scaleVals(bStats?.maxHealth || 0)}</div>
              {conParts.length > 0 && <div style={{ color: '#e74c3c', marginTop: '2px' }}>Verbraucht: {conParts.join(', ')}/s (fest)</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const BUILDING_DESC: Record<number, string> = {
  [TileType.SOLAR_PANEL]: 'Erzeugt Energie. Überall platzierbar.',
  [TileType.MINER]: 'Baut Schrott ab. Auf Erzvorkommen platzieren.',
  [TileType.WALL]: 'Hohe HP-Barriere. Blockiert Gegner.',
  [TileType.TURRET]: 'Schießt auf nahe Gegner. Reichweite 6.',
  [TileType.HEAVY_TURRET]: 'Hoher Schaden, große Reichweite. Reichweite 12.',
  [TileType.TESLA_COIL]: 'Trifft 3+ Ziele gleichzeitig. Reichweite 5. Verbraucht Energie.',
  [TileType.PLASMA_CANNON]: 'Flächenschaden-Kanone. Reichweite 10. Verbraucht Energie.',
  [TileType.SLOW_FIELD]: 'Verlangsamt Gegner im Bereich. Reichweite 5. Verbraucht Energie.',
  [TileType.SHIELD_GENERATOR]: 'Schirmt Gebäude im Bereich ab. Reichweite 4. Verbraucht Energie.',
  [TileType.RADAR_STATION]: 'Erhöht Geschützreichweite. Reichweite 5. Verbraucht Energie.',
  [TileType.REPAIR_BAY]: 'Repariert Gebäude im Bereich. Reichweite 3. Verbraucht Energie.',
  [TileType.FOUNDRY]: 'Wandelt Schrott+Energie → Stahl um.',
  [TileType.FABRICATOR]: 'Wandelt Schrott+Energie → E-Komp um.',
  [TileType.RECYCLER]: 'Wandelt Schrott+Energie → Stahl+E-Komp um.',
  [TileType.LAB]: 'Wandelt Energie+E-Komp → Daten um.',
  [TileType.DATA_VAULT]: 'Verstärkt Geschützschaden +15%. Verbraucht Energie+Daten.',
};

const BUILDING_COLORS: Record<number, string> = {
  [TileType.SOLAR_PANEL]: '#f1c40f', [TileType.MINER]: '#9b59b6', [TileType.WALL]: '#576574',
  [TileType.TURRET]: '#e67e22', [TileType.HEAVY_TURRET]: '#c0392b', [TileType.TESLA_COIL]: '#6c5ce7',
  [TileType.PLASMA_CANNON]: '#fd79a8', [TileType.SLOW_FIELD]: '#a29bfe', [TileType.SHIELD_GENERATOR]: '#74b9ff',
  [TileType.RADAR_STATION]: '#fdcb6e', [TileType.REPAIR_BAY]: '#e056a0', [TileType.FOUNDRY]: '#ff9f43',
  [TileType.FABRICATOR]: '#1dd1a1', [TileType.RECYCLER]: '#55efc4', [TileType.LAB]: '#54a0ff',
  [TileType.DATA_VAULT]: '#00cec9',
};

const scaleVals = (base: number) => [1, 1.5, 2, 2.5, 3].map(m => Math.round(base * m * 10) / 10).join(' / ');

const BuildBtn = ({ type, selected, set, label, cost, color, affordable = true, locked = false }: any) => {
  const [hover, setHover] = React.useState(false);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [shift, setShift] = React.useState(false);
  const stats = BUILDING_STATS[type];
  const desc = BUILDING_DESC[type] || '';

  if (locked) {
    const techNode = TECH_TREE.find(n => n.unlocks === type);
    return (
      <button disabled style={{
        padding: '12px', backgroundColor: '#f8f9fa',
        border: '1px solid #dfe4ea', color: '#b2bec3',
        textAlign: 'left', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '10px',
        borderRadius: '8px', opacity: 0.4, width: '100%'
      }}>
        <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: '#dfe4ea', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>🔒</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{label}</span>
          <span style={{ fontSize: '11px' }}>{techNode ? `${techNode.killCost} KP im Techbaum` : 'Gesperrt'}</span>
        </div>
      </button>
    );
  }

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'Shift') setShift(true); };
    const up = (e: KeyboardEvent) => { if (e.key === 'Shift') setShift(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const incParts: string[] = [];
  if (stats?.income?.energy) incParts.push(`+${stats.income.energy} Energie`);
  if (stats?.income?.scrap) incParts.push(`+${stats.income.scrap} Schrott`);
  if (stats?.income?.steel) incParts.push(`+${stats.income.steel} Stahl`);
  if (stats?.income?.electronics) incParts.push(`+${stats.income.electronics} E-Komp`);
  if (stats?.income?.data) incParts.push(`+${stats.income.data} Daten`);
  const conParts: string[] = [];
  if (stats?.consumes?.energy) conParts.push(`${stats.consumes.energy} Energie`);
  if (stats?.consumes?.scrap) conParts.push(`${stats.consumes.scrap} Schrott`);
  if (stats?.consumes?.electronics) conParts.push(`${stats.consumes.electronics} E-Komp`);
  if (stats?.consumes?.data) conParts.push(`${stats.consumes.data} Daten`);

  const showScaling = hover && shift;

  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}>
      <button onClick={() => set(type)} style={{
        padding: '12px', backgroundColor: selected === type ? '#f1f2f6' : 'transparent',
        border: selected === type ? `2px solid ${color}` : '1px solid #dfe4ea',
        color: '#2d3436', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '8px',
        opacity: affordable ? 1 : 0.35, width: '100%'
      }}>
        <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: color, flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{label}</span>
          <span style={{ fontSize: '11px', opacity: 0.6 }}>{cost}</span>
        </div>
      </button>
      {hover && (
        <div style={{
          position: 'fixed', left: mousePos.x + 15, top: mousePos.y - 10, zIndex: 1000,
          backgroundColor: 'rgba(255,255,255,0.98)', border: '2px solid #2d3436',
          padding: '10px 12px', borderRadius: '8px', width: showScaling ? 260 : 200,
          boxShadow: '0 4px 15px rgba(0,0,0,0.15)', pointerEvents: 'none'
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', color, marginBottom: '6px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
            {label} {showScaling && <span style={{ fontSize: '10px', color: '#7f8c8d' }}>Lv 1-5</span>}
          </div>
          <div style={{ fontSize: '11px', color: '#555', marginBottom: '6px' }}>{desc}</div>
          {!showScaling ? (
            <>
              {incParts.length > 0 && <div style={{ fontSize: '11px', color: '#27ae60', fontWeight: 'bold' }}>{incParts.join(', ')}/s</div>}
              {conParts.length > 0 && <div style={{ fontSize: '11px', color: '#e74c3c', marginTop: '2px' }}>Verbraucht: {conParts.join(', ')}/s</div>}
              {stats?.damage && <div style={{ fontSize: '11px', color: '#e67e22', marginTop: '2px' }}>Schaden: {stats.damage}{stats.range ? ` • Reichweite: ${stats.range}` : ''}</div>}
              {stats?.range && !stats?.damage && <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '2px' }}>Reichweite: {stats.range}</div>}
              <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '4px' }}>HP: {stats?.maxHealth}</div>
              <div style={{ fontSize: '10px', color: '#b2bec3', marginTop: '6px', fontStyle: 'italic' }}>Shift halten für Skalierung</div>
            </>
          ) : (
            <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px', borderTop: '1px solid #eee', paddingTop: '4px' }}>
              <div style={{ fontSize: '10px', color: '#7f8c8d', fontWeight: 'bold', marginBottom: '1px' }}>Stufe 1 / 2 / 3 / 4 / 5</div>
              {stats?.damage && <div><span style={{ color: '#e67e22', fontWeight: 'bold' }}>Schaden:</span> {scaleVals(stats.damage)}</div>}
              {stats?.range && <div><span style={{ color: '#7f8c8d' }}>Reichweite:</span> {stats.range} (fest)</div>}
              {stats?.income?.energy && <div><span style={{ color: '#27ae60', fontWeight: 'bold' }}>Energie:</span> {scaleVals(stats.income.energy)}/s</div>}
              {stats?.income?.scrap && <div><span style={{ color: '#27ae60', fontWeight: 'bold' }}>Schrott:</span> {scaleVals(stats.income.scrap)}/s</div>}
              {stats?.income?.steel && <div><span style={{ color: '#27ae60', fontWeight: 'bold' }}>Stahl:</span> {scaleVals(stats.income.steel)}/s</div>}
              {stats?.income?.electronics && <div><span style={{ color: '#27ae60', fontWeight: 'bold' }}>E-Komp:</span> {scaleVals(stats.income.electronics)}/s</div>}
              {stats?.income?.data && <div><span style={{ color: '#27ae60', fontWeight: 'bold' }}>Daten:</span> {scaleVals(stats.income.data)}/s</div>}
              <div><span style={{ color: '#7f8c8d' }}>HP:</span> {scaleVals(stats?.maxHealth || 0)}</div>
              {conParts.length > 0 && <div style={{ color: '#e74c3c', marginTop: '2px' }}>Verbraucht: {conParts.join(', ')}/s (fest)</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
