// ══════════════════════════════════════════════════════════════
// Replay Types & Loader
// Shared between the headless simulator (sim/run.ts) and the
// in-browser replay viewer (App.tsx / Engine.ts).
// ══════════════════════════════════════════════════════════════

export interface ReplayAction {
  tick: number;
  action: 'place' | 'upgrade' | 'unlock' | 'module' | 'research' | 'remove';
  x?: number;
  y?: number;
  type?: number;
  techId?: string;
  moduleType?: number;
  researchId?: string;
}

export interface ReplayData {
  id: string;
  seed: string;
  mode: string;
  difficulty: string;
  coreX: number;
  coreY: number;
  actions: ReplayAction[];
  result: {
    wavesReached: number;
    enemiesKilled: number;
    gameTime: number;
    gameOver: boolean;
  };
}

/** Validate that an unknown JSON object is a valid ReplayData */
export function isValidReplay(obj: unknown): obj is ReplayData {
  if (!obj || typeof obj !== 'object') return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.seed === 'string' &&
    typeof r.mode === 'string' &&
    typeof r.difficulty === 'string' &&
    typeof r.coreX === 'number' &&
    typeof r.coreY === 'number' &&
    Array.isArray(r.actions)
  );
}
