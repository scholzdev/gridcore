import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/Engine';
import type { Difficulty, GameMode } from './game/types';
import { STARTER_BUILDINGS } from './game/TechTree';
import type { TechNode } from './game/TechTree';
import { TileType, BUILDING_STATS, ModuleType, MODULE_DEFS } from './game/Grid';
import { StartScreen } from './components/StartScreen';
import { TopBar } from './components/TopBar';
import { BuildSidebar } from './components/BuildSidebar';
import { ModuleSidebar } from './components/ModuleSidebar';
import { TechTreeOverlay } from './components/TechTreeOverlay';
import { Tooltip } from './components/Tooltip';

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

      const mid = 15;
      if (engineRef.current.grid.healths[mid][mid]) {
        setCoreHealth({ current: engineRef.current.grid.healths[mid][mid], max: BUILDING_STATS[TileType.CORE].maxHealth! });
      }

      setGameStats({ time: engineRef.current.gameTime, killed: engineRef.current.enemiesKilled });
      setNetIncome({ ...engineRef.current.netIncome });
      setIsGameOver(engineRef.current.gameOver);
      setKillPoints(engineRef.current.killPoints);
      setUnlockedBuildings(new Set(engineRef.current.unlockedBuildings));
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

  // ── Keyboard ───────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') togglePause();
      if (e.key === 'r' || e.key === 'R') { if (engineRef.current?.gameOver) handleRestart(); }
      if (e.key === 't' || e.key === 'T') setShowTechTree(prev => !prev);
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
        const scaledIncome = stats.income ? {
          energy: stats.income.energy ? Math.floor(stats.income.energy * mult * 10) / 10 : undefined,
          scrap: stats.income.scrap ? Math.floor(stats.income.scrap * mult * 10) / 10 : undefined,
          steel: stats.income.steel ? Math.floor(stats.income.steel * mult * 10) / 10 : undefined,
          electronics: stats.income.electronics ? Math.floor(stats.income.electronics * mult * 10) / 10 : undefined,
          data: stats.income.data ? Math.floor(stats.income.data * mult * 10) / 10 : undefined,
        } : undefined;
        const scaledDamage = stats.damage ? Math.floor(stats.damage * mult * 10) / 10 : undefined;
        setHoveredData({
          name: TileType[type].replace('_', ' '),
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
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !isEngineReady) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const { zoom } = engineRef.current;
    const worldX = Math.floor((e.clientX - rect.left) / zoom);
    const worldY = Math.floor((e.clientY - rect.top) / zoom);
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
    if (cost.electronics) p.push(`${cost.electronics} E-Komp`);
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
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <BuildSidebar
          selectedBuilding={selectedBuilding}
          selectedModule={selectedModule}
          unlockedBuildings={unlockedBuildings}
          setSelectedBuilding={setSelectedBuilding}
          setSelectedModule={setSelectedModule}
          canAffordBuilding={canAffordBuilding}
          getCostString={getCostString}
        />

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

        <ModuleSidebar
          selectedModule={selectedModule}
          setSelectedModule={setSelectedModule}
          setSelectedBuilding={setSelectedBuilding}
          canAffordModule={canAffordModule}
        />
      </div>
    </div>
  );
}

export default App;
