import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/Engine';
import type { Difficulty, GameMode, TileStats } from './game/types';
import { TileType, BUILDING_STATS, ModuleType, MODULE_DEFS, STARTER_BUILDINGS, BUILDING_NAMES } from './config';
import type { TechNode } from './config';
import { fireOnPlace, fireOnRemove, fireOnUpgrade } from './game/HookSystem';
import { loadPrestige, savePrestige, resetPrestige, getUpgradeCost, getAvailablePoints, PRESTIGE_UPGRADES } from './game/Prestige';
import type { PrestigeData, PrestigeBonuses } from './game/Prestige';
import { StartScreen } from './components/StartScreen';
import { TopBar } from './components/TopBar';
import { BuildSidebar } from './components/BuildSidebar';
import { ModuleSidebar } from './components/ModuleSidebar';
import { TechTreeOverlay } from './components/TechTreeOverlay';
import { Tooltip } from './components/Tooltip';
import { PrestigeOverlay } from './components/PrestigeOverlay';
import { StatsOverlay } from './components/StatsOverlay';
import { MarketOverlay } from './components/MarketOverlay';
import { ResearchOverlay } from './components/ResearchOverlay';
import { GuideOverlay } from './components/GuideOverlay';
import { MobileWarning } from './components/MobileWarning';
import type { MarketState } from './game/Market';
import type { ResearchState } from './game/Research';

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
  const [placingCore, setPlacingCore] = useState(true);
  const [netIncome, setNetIncome] = useState({ energy: 0, scrap: 0, steel: 0, electronics: 0, data: 0 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('leicht');
  const [gameMode, setGameMode] = useState<GameMode>('endlos');
  const [gameStarted, setGameStarted] = useState(false);
  const [showTechTree, setShowTechTree] = useState(false);
  const [killPoints, setKillPoints] = useState(0);
  const [unlockedBuildings, setUnlockedBuildings] = useState<Set<TileType>>(() => {
    try {
      const saved = localStorage.getItem('rectangular_unlocks');
      if (saved) {
        const arr = JSON.parse(saved) as number[];
        return new Set([...STARTER_BUILDINGS, ...arr as TileType[]]);
      }
    } catch {}
    return new Set(STARTER_BUILDINGS);
  });
  const [waveInfo, setWaveInfo] = useState({ wave: 0, buildPhase: true, buildTimer: 20, enemiesLeft: 0, enemiesTotal: 0 });
  const [showPrestige, setShowPrestige] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [prestigeData, setPrestigeData] = useState<PrestigeData>(() => loadPrestige());
  const [tileStats, setTileStats] = useState<Map<string, TileStats>>(new Map());
  const [globalStats, setGlobalStats] = useState({ totalDamage: 0 });
  const [hasSave, setHasSave] = useState(() => localStorage.getItem('rectangular_save') !== null);
  const [showMarket, setShowMarket] = useState(false);
  const [showResearch, setShowResearch] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [marketState, setMarketState] = useState<MarketState>({ prices: { scrap: 1, steel: 1, electronics: 1, data: 1 } });
  const [researchState, setResearchState] = useState<ResearchState>({ levels: {} });

  // ── Game Loop ──────────────────────────────────────────────

  useEffect(() => {
    if (!gameStarted || !canvasRef.current || engineRef.current) return;
    engineRef.current = new GameEngine(canvasRef.current);
    engineRef.current.setDifficulty(difficulty);
    engineRef.current.setGameMode(gameMode);
    setIsEngineReady(true);

    const loop = (t: number) => {
      if (!engineRef.current) return;
      engineRef.current.update(t);
      setResources({ ...engineRef.current.resources.state });

      const cx = engineRef.current.grid.coreX;
      const cy = engineRef.current.grid.coreY;
      if (cx >= 0 && cy >= 0 && engineRef.current.grid.healths[cy][cx]) {
        setCoreHealth({ current: engineRef.current.grid.healths[cy][cx], max: BUILDING_STATS[TileType.CORE].maxHealth! });
      }

      setGameStats({ time: engineRef.current.gameTime, killed: engineRef.current.enemiesKilled });
      setNetIncome({ ...engineRef.current.netIncome });
      setIsGameOver(engineRef.current.gameOver);
      setKillPoints(engineRef.current.killPoints);
      setUnlockedBuildings(new Set(engineRef.current.unlockedBuildings));
      setPrestigeData({ ...engineRef.current.prestige });
      setTileStats(new Map(engineRef.current.tileStats));
      setGlobalStats({ ...engineRef.current.globalStats });
      setMarketState({ ...engineRef.current.market, prices: { ...engineRef.current.market.prices } });
      setResearchState({ ...engineRef.current.research, levels: { ...engineRef.current.research.levels } });
      if (engineRef.current.gameMode === 'wellen') {
        setWaveInfo({
          wave: engineRef.current.currentWave,
          buildPhase: engineRef.current.waveBuildPhase,
          buildTimer: engineRef.current.waveBuildTimer,
          enemiesLeft: engineRef.current.waveEnemiesTotal - engineRef.current.waveEnemiesKilledThisWave,
          enemiesTotal: engineRef.current.waveEnemiesTotal,
        });
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, [gameStarted]);

  // Sync selected building to engine for range display
  useEffect(() => {
    if (engineRef.current) engineRef.current.selectedPlacement = selectedBuilding;
  }, [selectedBuilding]);

  // ── Keyboard ───────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') togglePause();
      if (e.key === 'r' || e.key === 'R') { if (engineRef.current?.gameOver) handleRestart(); }
      if (e.key === 't' || e.key === 'T') setShowTechTree(prev => !prev);
      if (e.key === 's' || e.key === 'S') setShowStats(prev => !prev);
      if (e.key === 'm' || e.key === 'M') setShowMarket(prev => !prev);
      if (e.key === 'f' || e.key === 'F') setShowResearch(prev => !prev);
      if (e.key === 'h' || e.key === 'H') setShowGuide(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Handlers ───────────────────────────────────────────────

  const togglePause = () => {
    if (engineRef.current && !engineRef.current.gameOver) {
      engineRef.current.paused = !engineRef.current.paused;
      if (!engineRef.current.paused) engineRef.current.lastTick = 0;
      setPaused(engineRef.current.paused);
    }
  };

  const handleRestart = () => {
    engineRef.current = null;
    setIsEngineReady(false);
    setResources({ energy: 50, scrap: 40, data: 0, steel: 0, electronics: 0 });
    setCoreHealth({ current: 5000, max: 5000 });
    setGameStats({ time: 0, killed: 0 });
    setNetIncome({ energy: 0, scrap: 0, steel: 0, electronics: 0, data: 0 });
    setPaused(false);
    setPlacingCore(true);
    setIsGameOver(false);
    setGameStarted(false);
    setShowTechTree(false);
    setKillPoints(0);
    setUnlockedBuildings(() => {
      try {
        const saved = localStorage.getItem('rectangular_unlocks');
        if (saved) {
          const arr = JSON.parse(saved) as number[];
          return new Set([...STARTER_BUILDINGS, ...arr as TileType[]]);
        }
      } catch {}
      return new Set(STARTER_BUILDINGS);
    });
    setWaveInfo({ wave: 0, buildPhase: true, buildTimer: 20, enemiesLeft: 0, enemiesTotal: 0 });
    setSelectedBuilding(TileType.SOLAR_PANEL);
    setSelectedModule(ModuleType.NONE);
    setShowMarket(false);
    setShowResearch(false);
    setMarketState({ prices: { scrap: 1, steel: 1, electronics: 1, data: 1 } });
    setResearchState({ levels: {} });
  };

  const handleUnlock = (node: TechNode) => {
    if (!engineRef.current) return;
    if (engineRef.current.unlockBuilding(node)) {
      setKillPoints(engineRef.current.killPoints);
      setUnlockedBuildings(new Set(engineRef.current.unlockedBuildings));
    }
  };

  const handleResetUnlocks = () => {
    if (engineRef.current) {
      engineRef.current.resetUnlocks();
      setKillPoints(0);
      setUnlockedBuildings(new Set(STARTER_BUILDINGS));
    }
  };

  const handlePrestigeBuy = (key: string) => {
    if (!engineRef.current) return;
    const bonusKey = key as keyof PrestigeBonuses;
    const data = engineRef.current.prestige;
    const available = getAvailablePoints(data);
    const upg = PRESTIGE_UPGRADES.find(u => u.key === bonusKey);
    if (!upg) return;
    const cost = getUpgradeCost(data.bonuses[bonusKey], upg.costBase);
    if (available < cost || data.bonuses[bonusKey] >= upg.maxLevel) return;
    data.bonuses[bonusKey]++;
    savePrestige(data);
    setPrestigeData({ ...data });
  };

  const handlePrestigeReset = () => {
    resetPrestige();
    if (engineRef.current) {
      engineRef.current.prestige = loadPrestige();
    }
    setPrestigeData(loadPrestige());
  };

  const handleSave = () => {
    if (engineRef.current) {
      engineRef.current.saveGame();
      setHasSave(true);
    }
  };

  const handleLoad = () => {
    if (!engineRef.current) return;
    if (engineRef.current.loadGame()) {
      setResources({ ...engineRef.current.resources.state });
      setGameStats({ time: engineRef.current.gameTime, killed: engineRef.current.enemiesKilled });
      setNetIncome({ ...engineRef.current.netIncome });
      setIsGameOver(false);
      setPaused(false);
      setPlacingCore(false);
      setKillPoints(engineRef.current.killPoints);
      setMarketState({ ...engineRef.current.market, prices: { ...engineRef.current.market.prices } });
      setResearchState({ ...engineRef.current.research, levels: { ...engineRef.current.research.levels } });
    }
  };

  const handleTrade = (routeIndex: number, amount: number): boolean => {
    if (!engineRef.current) return false;
    const ok = engineRef.current.executeTrade(routeIndex, amount);
    if (ok) {
      setResources({ ...engineRef.current.resources.state });
      setMarketState({ ...engineRef.current.market, prices: { ...engineRef.current.market.prices } });
    }
    return ok;
  };

  const handleResearch = (nodeId: string) => {
    if (!engineRef.current) return;
    if (engineRef.current.buyResearch(nodeId)) {
      setResources({ ...engineRef.current.resources.state });
      setResearchState({ ...engineRef.current.research, levels: { ...engineRef.current.research.levels } });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!engineRef.current || !isEngineReady) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const { zoom } = engineRef.current;
    const worldX = Math.floor((e.clientX - rect.left) / zoom);
    const worldY = Math.floor((e.clientY - rect.top) / zoom);

    if (worldX >= 0 && worldX < 30 && worldY >= 0 && worldY < 30) {
      // Set hover for range display
      engineRef.current.hoverGridX = worldX;
      engineRef.current.hoverGridY = worldY;

      const type = engineRef.current.grid.tiles[worldY][worldX];
      if (type !== TileType.EMPTY && type !== TileType.ORE_PATCH) {
        const level = engineRef.current.grid.levels[worldY][worldX] || 1;
        const stats = BUILDING_STATS[type] || {};
        const mult = 1 + (level - 1) * 0.5;
        const scaledIncome = stats.income ? {
          energy: stats.income.energy ? Math.floor(stats.income.energy * mult * 10) / 10 : undefined,
          scrap: stats.income.scrap ? Math.floor(stats.income.scrap * mult * 10) / 10 : undefined,
          steel: stats.income.steel ? Math.floor(stats.income.steel * mult * 10) / 10 : undefined,
          electronics: stats.income.electronics ? Math.floor(stats.income.electronics * mult * 10) / 10 : undefined,
          data: stats.income.data ? Math.floor(stats.income.data * mult * 10) / 10 : undefined,
        } : undefined;
        const scaledDamage = stats.damage ? Math.floor(stats.damage * mult * 10) / 10 : undefined;
        setHoveredData({
          name: BUILDING_NAMES[type] || TileType[type],
          stats: { ...stats, income: scaledIncome, damage: scaledDamage },
          hp: engineRef.current.grid.healths[worldY][worldX],
          shield: engineRef.current.grid.shields[worldY][worldX],
          level,
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
    if (engineRef.current) { engineRef.current.hoverGridX = -1; engineRef.current.hoverGridY = -1; }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !isEngineReady) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const { zoom } = engineRef.current;
    const worldX = Math.floor((e.clientX - rect.left) / zoom);
    const worldY = Math.floor((e.clientY - rect.top) / zoom);

    // Core placement phase
    if (engineRef.current.placingCore) {
      if (engineRef.current.placeCore(worldX, worldY)) {
        setPlacingCore(false);
      }
      return;
    }

    const currentTile = engineRef.current.grid.tiles[worldY][worldX];

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

    if (currentTile === selectedBuilding && currentTile !== TileType.CORE) {
      const currentLevel = engineRef.current.grid.levels[worldY][worldX];
      const upgradeCost = engineRef.current.getUpgradeCost(currentTile, currentLevel);
      if (upgradeCost && engineRef.current.resources.canAfford(upgradeCost)) {
        if (engineRef.current.grid.upgradeBuilding(worldX, worldY)) {
          engineRef.current.resources.spend(upgradeCost);
          fireOnUpgrade(engineRef.current, worldX, worldY, currentLevel, currentLevel + 1);
          setResources({ ...engineRef.current.resources.state });
        }
      }
    } else {
      const cost = engineRef.current.getCurrentCost(selectedBuilding);
      if (engineRef.current.resources.canAfford(cost)) {
        if (engineRef.current.grid.placeBuilding(worldX, worldY, selectedBuilding)) {
          engineRef.current.resources.spend(cost);
          engineRef.current.purchasedCounts[selectedBuilding] = (engineRef.current.purchasedCounts[selectedBuilding] || 0) + 1;
          engineRef.current.buildingsPlaced++;
          fireOnPlace(engineRef.current, worldX, worldY);
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
      fireOnRemove(engineRef.current, worldX, worldY, type, level, refund);
      engineRef.current.resources.add(refund);
      if (engineRef.current.purchasedCounts[type] > 0) engineRef.current.purchasedCounts[type]--;
      setResources({ ...engineRef.current.resources.state });
    }
  };

  // ── Cost helpers ───────────────────────────────────────────

  const canAffordBuilding = (type: TileType) => {
    if (!engineRef.current || !isEngineReady) return true;
    return engineRef.current.resources.canAfford(engineRef.current.getCurrentCost(type));
  };

  const canAffordModule = (modType: ModuleType) => {
    if (!engineRef.current || !isEngineReady) return true;
    const def = MODULE_DEFS[modType];
    return def ? engineRef.current.resources.canAfford(def.cost) : false;
  };

  const getCostString = (type: TileType) => {
    const stats = BUILDING_STATS[type];
    if (!stats) return '???';
    const cost = (isEngineReady && engineRef.current) ? engineRef.current.getCurrentCost(type) : stats.cost;
    if (!cost) return '0 Sc';
    const p = [];
    if (cost.scrap) p.push(`${cost.scrap} Schrott`);
    if (cost.energy) p.push(`${cost.energy} Energie`);
    if (cost.steel) p.push(`${cost.steel} Stahl`);
    if (cost.electronics) p.push(`${cost.electronics} Elektronik`);
    if (cost.data) p.push(`${cost.data} Daten`);
    return p.join(' / ');
  };

  // ── Render ─────────────────────────────────────────────────

  if (!gameStarted) {
    return (
      <StartScreen
        gameMode={gameMode}
        setGameMode={setGameMode}
        setDifficulty={setDifficulty}
        setGameStarted={setGameStarted}
      />
    );
  }

  return (
    <div style={{ backgroundColor: '#f1f2f6', color: '#2d3436', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'monospace', overflow: 'hidden' }}>
      <MobileWarning />

      {hoverPos.show && hoveredData && <Tooltip x={hoverPos.x} y={hoverPos.y} data={hoveredData} />}
      {showTechTree && (
        <TechTreeOverlay
          killPoints={killPoints}
          unlockedBuildings={unlockedBuildings}
          onUnlock={handleUnlock}
          onClose={() => setShowTechTree(false)}
          onReset={handleResetUnlocks}
        />
      )}
      {showPrestige && (
        <PrestigeOverlay
          prestige={prestigeData}
          onBuy={handlePrestigeBuy}
          onClose={() => setShowPrestige(false)}
          onReset={handlePrestigeReset}
        />
      )}
      {showStats && engineRef.current && (
        <StatsOverlay
          tileStats={tileStats}
          globalStats={globalStats}
          enemiesKilled={gameStats.killed}
          gameTime={gameStats.time}
          grid={{ tiles: engineRef.current.grid.tiles, levels: engineRef.current.grid.levels }}
          onClose={() => setShowStats(false)}
        />
      )}
      {showMarket && (
        <MarketOverlay
          market={marketState}
          resources={resources}
          onTrade={handleTrade}
          onClose={() => setShowMarket(false)}
        />
      )}
      {showResearch && (
        <ResearchOverlay
          research={researchState}
          dataAvailable={resources.data}
          onResearch={handleResearch}
          onClose={() => setShowResearch(false)}
        />
      )}
      {showGuide && (
        <GuideOverlay onClose={() => setShowGuide(false)} />
      )}

      <TopBar
        paused={paused}
        isGameOver={isGameOver}
        difficulty={difficulty}
        gameMode={gameMode}
        gameStats={gameStats}
        coreHealth={coreHealth}
        resources={resources}
        netIncome={netIncome}
        killPoints={killPoints}
        showTechTree={showTechTree}
        waveInfo={waveInfo}
        onTogglePause={togglePause}
        onRestart={handleRestart}
        onToggleTechTree={() => setShowTechTree(prev => !prev)}
        onTogglePrestige={() => setShowPrestige(prev => !prev)}
        onToggleStats={() => setShowStats(prev => !prev)}
        onToggleMarket={() => setShowMarket(prev => !prev)}
        onToggleResearch={() => setShowResearch(prev => !prev)}
        onToggleGuide={() => setShowGuide(prev => !prev)}
        onSave={handleSave}
        onLoad={handleLoad}
        hasSave={hasSave}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {!placingCore && <BuildSidebar
          selectedBuilding={selectedBuilding}
          selectedModule={selectedModule}
          unlockedBuildings={unlockedBuildings}
          setSelectedBuilding={setSelectedBuilding}
          setSelectedModule={setSelectedModule}
          canAffordBuilding={canAffordBuilding}
          getCostString={getCostString}
        />}

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { setHoverPos(h => ({ ...h, show: false })); if (engineRef.current) { engineRef.current.hoverGridX = -1; engineRef.current.hoverGridY = -1; } }}
            onClick={handleCanvasClick}
            onContextMenu={handleContextMenu}
            style={{ cursor: placingCore ? 'pointer' : 'crosshair', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', borderRadius: '8px' }}
          />
        </div>

        {!placingCore && <ModuleSidebar
          selectedModule={selectedModule}
          setSelectedModule={setSelectedModule}
          setSelectedBuilding={setSelectedBuilding}
          canAffordModule={canAffordModule}
          unlockedBuildings={unlockedBuildings}
        />}
      </div>
    </div>
  );
}

export default App;
