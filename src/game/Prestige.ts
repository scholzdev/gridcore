const PRESTIGE_KEY = 'rectangular_prestige';

export interface PrestigeBonuses {
  damageLvl: number;
  incomeLvl: number;
  startScrapLvl: number;
  startEnergyLvl: number;
  costReductionLvl: number;
}

export interface PrestigeData {
  totalPoints: number;
  bonuses: PrestigeBonuses;
}

export interface PrestigeUpgradeDef {
  key: keyof PrestigeBonuses;
  name: string;
  desc: string;
  costBase: number;
  maxLevel: number;
  effectLabel: string;
}

export const PRESTIGE_UPGRADES: PrestigeUpgradeDef[] = [
  { key: 'damageLvl', name: 'Waffenmeister', desc: '+10% Turm-Schaden pro Stufe', costBase: 10, maxLevel: 10, effectLabel: '+10%' },
  { key: 'incomeLvl', name: 'Effizienz', desc: '+10% Einkommen pro Stufe', costBase: 10, maxLevel: 10, effectLabel: '+10%' },
  { key: 'startScrapLvl', name: 'Schrottvorrat', desc: '+20 Start-Schrott pro Stufe', costBase: 5, maxLevel: 10, effectLabel: '+20' },
  { key: 'startEnergyLvl', name: 'Energievorrat', desc: '+20 Start-Energie pro Stufe', costBase: 5, maxLevel: 10, effectLabel: '+20' },
  { key: 'costReductionLvl', name: 'Ingenieur', desc: '-5% Baukosten pro Stufe', costBase: 15, maxLevel: 10, effectLabel: '-5%' },
];

export function getUpgradeCost(currentLevel: number, costBase: number): number {
  return costBase * (currentLevel + 1);
}

export function loadPrestige(): PrestigeData {
  try {
    const saved = localStorage.getItem(PRESTIGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return defaultPrestige();
}

export function defaultPrestige(): PrestigeData {
  return { totalPoints: 0, bonuses: { damageLvl: 0, incomeLvl: 0, startScrapLvl: 0, startEnergyLvl: 0, costReductionLvl: 0 } };
}

export function savePrestige(data: PrestigeData) {
  localStorage.setItem(PRESTIGE_KEY, JSON.stringify(data));
}

export function calcPrestigeEarned(kills: number, gameTimeSec: number): number {
  return Math.floor(kills * 0.5 + gameTimeSec / 30);
}

export function getSpentPoints(bonuses: PrestigeBonuses): number {
  let spent = 0;
  for (const upg of PRESTIGE_UPGRADES) {
    const lvl = bonuses[upg.key];
    for (let i = 0; i < lvl; i++) {
      spent += getUpgradeCost(i, upg.costBase);
    }
  }
  return spent;
}

export function getAvailablePoints(data: PrestigeData): number {
  return data.totalPoints - getSpentPoints(data.bonuses);
}

export function resetPrestige() {
  localStorage.removeItem(PRESTIGE_KEY);
}
