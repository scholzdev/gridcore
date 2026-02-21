// ── Tutorial State Machine ───────────────────────────────────
// Drives the interactive tutorial through a sequence of steps.
// Each step declares: message, highlight target, and completion condition.

import type { GameEngine } from './Engine';
import { TileType } from '../config';

export type TutorialHighlight =
  | { kind: 'canvas' }                    // highlight the game canvas
  | { kind: 'sidebar'; selector: string } // highlight a sidebar element
  | { kind: 'topbar'; selector: string }  // highlight a topbar element
  | { kind: 'rect'; x: number; y: number; w: number; h: number } // arbitrary screen rect
  | { kind: 'none' };

export type TutorialArrow = 'left' | 'right' | 'up' | 'down' | 'none';

export interface TutorialStep {
  id: string;
  title: string;
  message: string;
  /** Where to place the tooltip */
  position: 'center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'left' | 'right';
  /** Arrow pointing direction */
  arrow: TutorialArrow;
  /** Highlight target */
  highlight: TutorialHighlight;
  /** Action to run when entering this step */
  onEnter?: (engine: GameEngine) => void;
  /** Check each frame — when true, advance to next step */
  condition: (engine: GameEngine) => boolean;
  /** Optional: force-select a building when this step activates */
  forceSelect?: TileType;
  /** If true, the user must click "Weiter" instead of auto-advancing */
  manualAdvance?: boolean;
}

// ── Step Definitions ─────────────────────────────────────────

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: '🎮 Willkommen bei Gridcore!',
    message: 'In diesem Tutorial lernst du die Grundlagen des Spiels.\nDein Ziel: Verteidige deinen Kern gegen Gegnerwellen!',
    position: 'center',
    arrow: 'none',
    highlight: { kind: 'none' },
    condition: () => false,
    manualAdvance: true,
  },
  {
    id: 'place_core',
    title: '🏠 Kern platzieren',
    message: 'Klicke auf ein Feld in der Mitte des Spielfelds, um deinen Kern zu platzieren.\nDer Kern ist das Herz deiner Basis — wenn er fällt, ist das Spiel vorbei!',
    position: 'right',
    arrow: 'left',
    highlight: { kind: 'canvas' },
    condition: (engine) => !engine.placingCore,
  },
  {
    id: 'explain_resources',
    title: '💰 Ressourcen',
    message: 'Oben siehst du deine 5 Ressourcen:\n⚡ Energie — Grundversorgung (Solarfelder)\n🟣 Schrott — Hauptwährung (Schrottbohrer)\n🟠 Stahl — für stärkere Gebäude (Stahlschmelze)\n🟢 Elektronik — für High-Tech (E-Fabrik)\n🔵 Daten — für Forschung (Labor)\n\nHover über eine Ressource zeigt die Aufschlüsselung!',
    position: 'top-center',
    arrow: 'up',
    highlight: { kind: 'topbar', selector: 'resources' },
    condition: () => false,
    manualAdvance: true,
  },
  {
    id: 'select_solar',
    title: '☀️ Solarfeld auswählen',
    message: 'Wähle links in der Sidebar das Solarfeld aus.\nSolarfelder produzieren Energie — deine wichtigste Ressource!',
    position: 'left',
    arrow: 'left',
    highlight: { kind: 'sidebar', selector: 'solar' },
    forceSelect: TileType.SOLAR_PANEL,
    condition: () => false,
    manualAdvance: true,
  },
  {
    id: 'place_solar',
    title: '☀️ Solarfeld platzieren',
    message: 'Klicke auf ein leeres Feld neben deinem Kern, um ein Solarfeld zu bauen.\nEs produziert jede Sekunde Energie für dich.',
    position: 'right',
    arrow: 'left',
    highlight: { kind: 'canvas' },
    condition: (engine) => countBuildings(engine, TileType.SOLAR_PANEL) >= 1,
  },
  {
    id: 'place_more_solar',
    title: '☀️ Noch mehr Energie!',
    message: 'Baue noch ein zweites Solarfeld.\nMehr Energie = mehr Möglichkeiten!',
    position: 'right',
    arrow: 'left',
    highlight: { kind: 'canvas' },
    condition: (engine) => countBuildings(engine, TileType.SOLAR_PANEL) >= 2,
  },
  {
    id: 'select_miner',
    title: '⛏️ Schrottbohrer auswählen',
    message: 'Wähle jetzt den Schrottbohrer in der Sidebar.\nEr muss auf einem grauen Erzvorkommen platziert werden und produziert Schrott.',
    position: 'left',
    arrow: 'left',
    highlight: { kind: 'sidebar', selector: 'miner' },
    forceSelect: TileType.MINER,
    condition: () => false,
    manualAdvance: true,
  },
  {
    id: 'place_miner',
    title: '⛏️ Schrottbohrer bauen',
    message: 'Platziere den Schrottbohrer auf einem grauen Erzvorkommen (markiertes Feld).\nSchrott ist die Hauptwährung zum Bauen.',
    position: 'right',
    arrow: 'left',
    highlight: { kind: 'canvas' },
    condition: (engine) => countBuildings(engine, TileType.MINER) >= 1,
  },
  {
    id: 'select_turret',
    title: '🔫 Wächtergeschütz auswählen',
    message: 'Jetzt wird es ernst! Wähle das Wächtergeschütz aus.\nTürme schießen automatisch auf Gegner in Reichweite.',
    position: 'left',
    arrow: 'left',
    highlight: { kind: 'sidebar', selector: 'turret' },
    forceSelect: TileType.TURRET,
    condition: () => false,
    manualAdvance: true,
  },
  {
    id: 'place_turret',
    title: '🔫 Turm platzieren',
    message: 'Platziere den Turm strategisch zwischen Kern und Spielfeldrand.\nGegner kommen von allen Seiten — positioniere klug!',
    position: 'right',
    arrow: 'left',
    highlight: { kind: 'canvas' },
    condition: (engine) => countBuildings(engine, TileType.TURRET) >= 1,
  },
  {
    id: 'place_more_turrets',
    title: '🔫 Mehr Verteidigung!',
    message: 'Baue noch 1-2 weitere Türme. Verteile sie um deinen Kern herum,\ndamit alle Seiten geschützt sind.',
    position: 'right',
    arrow: 'left',
    highlight: { kind: 'canvas' },
    condition: (engine) => countBuildings(engine, TileType.TURRET) >= 2,
  },
  {
    id: 'build_wall',
    title: '🧱 Mauern bauen',
    message: 'Wähle die Schwere Mauer und baue ein paar Mauern um deinen Kern.\nMauern blockieren Gegner und zwingen sie auf Umwege.',
    position: 'left',
    arrow: 'left',
    highlight: { kind: 'sidebar', selector: 'wall' },
    forceSelect: TileType.WALL,
    condition: () => false,
    manualAdvance: true,
  },
  {
    id: 'place_walls',
    title: '🧱 Mauern platzieren',
    message: 'Baue mindestens 3 Mauern. Lass Lücken für deine Türme!\nTipp: Halte die Maustaste gedrückt und ziehe, um schnell mehrere Mauern zu setzen!\nGegner müssen um Mauern herumlaufen.',
    position: 'right',
    arrow: 'left',
    highlight: { kind: 'canvas' },
    condition: (engine) => countBuildings(engine, TileType.WALL) >= 3,
  },
  {
    id: 'ready_for_wave',
    title: '⚔️ Bereit für die erste Welle!',
    message: 'Deine Basis ist bereit! Gleich startet die erste Gegnerwelle.\nBeobachte, wie deine Türme die Gegner automatisch angreifen!',
    position: 'center',
    arrow: 'none',
    highlight: { kind: 'none' },
    onEnter: (engine) => {
      // Give extra resources for comfortable start
      engine.resources.add({ energy: 30, scrap: 30 });
    },
    condition: () => false,
    manualAdvance: true,
  },
  {
    id: 'start_wave',
    title: '⚔️ Welle 1 läuft!',
    message: 'Die erste Welle hat begonnen! Deine Türme schießen automatisch.\nBeobachte die Gegner und deine Verteidigung.',
    position: 'top-center',
    arrow: 'none',
    highlight: { kind: 'canvas' },
    onEnter: (engine) => {
      engine.startNextWave();
    },
    condition: (engine) => engine.waveBuildPhase && engine.currentWave >= 1,
  },
  {
    id: 'wave_survived',
    title: '🎉 Welle überstanden!',
    message: 'Gut gemacht! Du hast die erste Welle überlebt.\nIn der Bauphase kannst du deine Basis ausbauen und upgraden!\n\n⬆️ Upgrade-Tipp: Wähle einen Gebäudetyp und klicke auf das gleiche Gebäude!',
    position: 'center',
    arrow: 'none',
    highlight: { kind: 'none' },
    condition: () => false,
    manualAdvance: true,
  },
  {
    id: 'explain_upgrade',
    title: '⬆️ Gebäude upgraden',
    message: 'So funktioniert Upgraden:\n1. Wähle den Gebäudetyp in der Sidebar (z.B. Solarfeld)\n2. Klicke auf ein BESTEHENDES Gebäude desselben Typs\n→ Level steigt, +25% Produktion/Schaden pro Level!\n\nUpgrade jetzt eines deiner Solarfelder!',
    position: 'right',
    arrow: 'left',
    highlight: { kind: 'canvas' },
    forceSelect: TileType.SOLAR_PANEL,
    condition: (engine) => hasUpgradedBuilding(engine),
  },
  {
    id: 'explain_rightclick',
    title: '🗑️ Gebäude entfernen',
    message: 'Rechtsklick auf ein Gebäude entfernt es (50% Rückerstattung).\nProbiere es ruhig aus — oder klicke "Weiter".',
    position: 'center',
    arrow: 'none',
    highlight: { kind: 'none' },
    condition: () => false,
    manualAdvance: true,
  },
  {
    id: 'explain_topbar',
    title: '📊 Menüleiste',
    message: 'In der oberen Leiste findest du: Pause ⏸️, Tech-Baum 🌳, Statistiken 📊,\nMarkt 💹, Forschung 🔬 und den Guide 📖.\nEntdecke diese Systeme im Laufe des Spiels!',
    position: 'top-center',
    arrow: 'up',
    highlight: { kind: 'topbar', selector: 'menu' },
    condition: () => false,
    manualAdvance: true,
  },
  {
    id: 'tutorial_done',
    title: '🏆 Tutorial abgeschlossen!',
    message: 'Du kennst jetzt die Grundlagen! Hier noch ein paar Tipps:\n\n• Gegner kommen von allen 4 Seiten\n• Mauern zwingen Gegner auf Umwege — nutze das!\n• Neue Gebäude schaltest du im Tech-Baum frei (T)\n• Forschung (F) verbessert deine Gebäude permanent\n\nViel Spaß beim Verteidigen! 🎮',
    position: 'center',
    arrow: 'none',
    highlight: { kind: 'none' },
    condition: () => false,
    manualAdvance: true,
  },
];

// ── Helper Functions ─────────────────────────────────────────

function countBuildings(engine: GameEngine, type: TileType): number {
  let count = 0;
  const tiles = engine.grid.tiles;
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      if (tiles[y][x] === type) count++;
    }
  }
  return count;
}

function hasUpgradedBuilding(engine: GameEngine): boolean {
  const levels = engine.grid.levels;
  for (let y = 0; y < levels.length; y++) {
    for (let x = 0; x < levels[y].length; x++) {
      if (levels[y][x] > 1) return true;
    }
  }
  return false;
}

// ── Tutorial State ───────────────────────────────────────────

export interface TutorialState {
  active: boolean;
  stepIndex: number;
  /** Set to true when user has completed the tutorial (stored in localStorage) */
  completed: boolean;
}

export function createTutorialState(): TutorialState {
  return { active: false, stepIndex: 0, completed: false };
}

export function getCurrentStep(state: TutorialState): TutorialStep | null {
  if (!state.active) return null;
  if (state.stepIndex >= TUTORIAL_STEPS.length) return null;
  return TUTORIAL_STEPS[state.stepIndex];
}

export function advanceTutorial(state: TutorialState): TutorialState {
  const next = state.stepIndex + 1;
  if (next >= TUTORIAL_STEPS.length) {
    localStorage.setItem('gridcore_tutorial_done', '1');
    return { active: false, stepIndex: next, completed: true };
  }
  return { ...state, stepIndex: next };
}

export function skipTutorial(): TutorialState {
  localStorage.setItem('gridcore_tutorial_done', '1');
  return { active: false, stepIndex: TUTORIAL_STEPS.length, completed: true };
}

export function hasTutorialBeenCompleted(): boolean {
  return localStorage.getItem('gridcore_tutorial_done') === '1';
}
