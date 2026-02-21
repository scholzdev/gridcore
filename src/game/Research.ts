/**
 * Forschungsbaum 2.0 — Run-based research using Data as currency.
 * Resets on game over, unlike the permanent Tech Tree.
 *
 * Branching: At each tier you have 3 choices but can only pick 2.
 * Once 2 nodes in a tier are researched (level >= 1), the third is locked.
 */

export interface ResearchNode {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  costBase: number;   // data cost for level 1
  costScale: number;  // multiply per level
  tier: number;       // 1-4
  requires?: string;  // id of prerequisite
  color: string;
}

export interface ResearchState {
  levels: Record<string, number>;
}

/** How many nodes per tier a player may unlock */
export const TIER_PICK_LIMIT = 2;

export const RESEARCH_NODES: ResearchNode[] = [
  // Tier 1 — cheap, foundational (pick 2 of 3)
  { id: 'armor',       name: 'Panzerung',          description: 'Alle Gebäude +20% HP pro Stufe',           maxLevel: 3, costBase: 30,  costScale: 2.0, tier: 1, color: '#636e72' },
  { id: 'cheapBuild',  name: 'Schnellbau',         description: 'Baukosten -8% pro Stufe',                  maxLevel: 3, costBase: 25,  costScale: 2.0, tier: 1, color: '#00b894' },
  { id: 'fireRate',    name: 'Übertaktung',        description: 'Alle Türme +12% Feuerrate pro Stufe',      maxLevel: 3, costBase: 35,  costScale: 2.0, tier: 1, color: '#e74c3c' },

  // Tier 2 — mid (pick 2 of 3)
  { id: 'efficiency',  name: 'Effizienzprotokoll', description: 'Alle Verbraucher -15% Energiebedarf/Stufe', maxLevel: 3, costBase: 60,  costScale: 2.0, tier: 2, requires: 'cheapBuild', color: '#2ecc71' },
  { id: 'yield',       name: 'Ertragsforschung',   description: 'Produzenten +20% Output pro Stufe',        maxLevel: 3, costBase: 70,  costScale: 2.0, tier: 2, requires: 'cheapBuild', color: '#f39c12' },
  { id: 'shieldBoost', name: 'Schildverstärkung',  description: 'Schildgeneratoren +25% Stärke/Stufe',      maxLevel: 3, costBase: 55,  costScale: 2.0, tier: 2, requires: 'armor', color: '#74b9ff' },

  // Tier 3 — expensive (pick 2 of 3)
  { id: 'range',       name: 'Reichweitensensor',  description: 'Alle Türme +1 Reichweite pro Stufe',       maxLevel: 3, costBase: 100, costScale: 2.5, tier: 3, requires: 'fireRate', color: '#a29bfe' },
  { id: 'repairBoost', name: 'Notfallreparatur',   description: 'Reparaturbucht +40% Heilrate/Stufe',       maxLevel: 3, costBase: 90,  costScale: 2.5, tier: 3, requires: 'shieldBoost', color: '#e056a0' },
  { id: 'dataCompress',name: 'Datenkompression',   description: 'Labore +30% Daten-Output pro Stufe',       maxLevel: 3, costBase: 80,  costScale: 2.0, tier: 3, requires: 'yield', color: '#3498db' },

  // Tier 4 — ultimate (only 1 node, no branching restriction)
  { id: 'moduleSynergy', name: 'Modulsynergie',    description: 'Module-Effekte +20% pro Stufe',            maxLevel: 3, costBase: 150, costScale: 3.0, tier: 4, requires: 'range', color: '#fd79a8' },
];

export function createResearchState(): ResearchState {
  return { levels: {} };
}

export function getResearchLevel(state: ResearchState, id: string): number {
  return state.levels[id] || 0;
}

export function getResearchCost(node: ResearchNode, currentLevel: number): number {
  return Math.floor(node.costBase * Math.pow(node.costScale, currentLevel));
}

/** Check if a tier's pick limit has been reached and this node is NOT one of the picked */
export function isTierLocked(state: ResearchState, node: ResearchNode): boolean {
  const tierNodes = RESEARCH_NODES.filter(n => n.tier === node.tier);
  // If tier has <= TIER_PICK_LIMIT nodes, no locking needed
  if (tierNodes.length <= TIER_PICK_LIMIT) return false;
  const pickedInTier = tierNodes.filter(n => getResearchLevel(state, n.id) >= 1);
  if (pickedInTier.length >= TIER_PICK_LIMIT) {
    // This node is locked if it's not already picked
    return getResearchLevel(state, node.id) < 1;
  }
  return false;
}

export function canResearch(state: ResearchState, node: ResearchNode, dataAvailable: number, costMult: number = 1): boolean {
  const level = getResearchLevel(state, node.id);
  if (level >= node.maxLevel) return false;
  if (node.requires && getResearchLevel(state, node.requires) < 1) return false;
  // Tier branching lock
  if (isTierLocked(state, node)) return false;
  return dataAvailable >= Math.floor(getResearchCost(node, level) * costMult);
}

/**
 * Compute all active buffs from current research state.
 * Returns multipliers that the engine can apply.
 */
export interface ResearchBuffs {
  hpMult: number;          // 1 + 0.2*armor
  costMult: number;        // 1 - 0.08*cheapBuild (min 0.5)
  fireRateMult: number;    // 1 - 0.12*fireRate → lower = faster (used as tick multiplier)
  energyConsumeMult: number; // 1 - 0.15*efficiency (min 0.3)
  incomeMult: number;      // 1 + 0.2*yield
  shieldMult: number;      // 1 + 0.25*shieldBoost
  rangeBuff: number;       // 1*range (flat add)
  repairMult: number;      // 1 + 0.4*repairBoost
  dataOutputMult: number;  // 1 + 0.3*dataCompress
  moduleEffectMult: number;// 1 + 0.2*moduleSynergy
}

export function computeResearchBuffs(state: ResearchState): ResearchBuffs {
  const g = (id: string) => getResearchLevel(state, id);
  return {
    hpMult: 1 + g('armor') * 0.2,
    costMult: Math.max(0.5, 1 - g('cheapBuild') * 0.08),
    fireRateMult: Math.max(0.5, 1 - g('fireRate') * 0.12),
    energyConsumeMult: Math.max(0.3, 1 - g('efficiency') * 0.15),
    incomeMult: 1 + g('yield') * 0.2,
    shieldMult: 1 + g('shieldBoost') * 0.25,
    rangeBuff: g('range'),
    repairMult: 1 + g('repairBoost') * 0.4,
    dataOutputMult: 1 + g('dataCompress') * 0.3,
    moduleEffectMult: 1 + g('moduleSynergy') * 0.2,
  };
}
