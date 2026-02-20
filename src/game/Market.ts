import type { ResourceState } from './Resources';
import {
  MARKET_SELL_PRESSURE, MARKET_BUY_PRESSURE, MARKET_PRICE_MIN,
  MARKET_PRICE_MAX, MARKET_PRICE_RECOVERY_RATE,
  TRADE_AMOUNTS as TRADE_AMOUNTS_CONST,
} from '../constants';

export type TradableResource = 'scrap' | 'steel' | 'electronics' | 'data' | 'energy';

export interface TradeRoute {
  from: TradableResource;
  to: TradableResource;
  baseRate: number; // how many "to" you get per "from" at base price
  label: string;
}

export interface MarketState {
  prices: Record<TradableResource, number>; // multiplier (1 = base price)
}

export const RESOURCE_LABELS: Record<TradableResource, string> = {
  scrap: 'Schrott',
  steel: 'Stahl',
  electronics: 'Elektronik',
  data: 'Daten',
  energy: 'Energie',
};

export const RESOURCE_COLORS: Record<TradableResource, string> = {
  scrap: '#9b59b6',
  steel: '#e67e22',
  electronics: '#2ecc71',
  data: '#3498db',
  energy: '#f1c40f',
};

export const TRADE_ROUTES: TradeRoute[] = [
  { from: 'scrap', to: 'steel', baseRate: 0.4, label: 'Schrott → Stahl' },
  { from: 'scrap', to: 'electronics', baseRate: 0.25, label: 'Schrott → Elektronik' },
  { from: 'scrap', to: 'energy', baseRate: 2.0, label: 'Schrott → Energie' },
  { from: 'steel', to: 'electronics', baseRate: 0.5, label: 'Stahl → Elektronik' },
  { from: 'steel', to: 'scrap', baseRate: 2.0, label: 'Stahl → Schrott' },
  { from: 'electronics', to: 'steel', baseRate: 1.5, label: 'Elektronik → Stahl' },
  { from: 'electronics', to: 'data', baseRate: 0.3, label: 'Elektronik → Daten' },
  { from: 'data', to: 'electronics', baseRate: 2.5, label: 'Daten → Elektronik' },
  { from: 'energy', to: 'scrap', baseRate: 0.4, label: 'Energie → Schrott' },
];

export const TRADE_AMOUNTS = TRADE_AMOUNTS_CONST;

export function createMarketState(): MarketState {
  return {
    prices: { scrap: 1, steel: 1, electronics: 1, data: 1, energy: 1 },
  };
}

/** Returns how much "to" you get for selling `amount` of "from" */
export function getTradeOutput(route: TradeRoute, amount: number, market: MarketState): number {
  // Selling "from" → price of "from" drops. Buying "to" → price of "to" rises.
  // Effective rate = baseRate * (price_from / price_to)
  const effectiveRate = route.baseRate * (market.prices[route.from] / market.prices[route.to]);
  return Math.floor(amount * effectiveRate);
}

/** Execute a trade. Returns true if successful. */
export function executeTrade(
  route: TradeRoute,
  amount: number,
  market: MarketState,
  resources: ResourceState
): boolean {
  if (resources[route.from] < amount) return false;
  const output = getTradeOutput(route, amount, market);
  if (output <= 0) return false;

  resources[route.from] -= amount;
  resources[route.to] += output;

  // Adjust prices: selling drives price down, buying drives price up
  const sellPressure = amount * MARKET_SELL_PRESSURE;
  const buyPressure = output * MARKET_BUY_PRESSURE;
  market.prices[route.from] = Math.max(MARKET_PRICE_MIN, market.prices[route.from] - sellPressure);
  market.prices[route.to] = Math.min(MARKET_PRICE_MAX, market.prices[route.to] + buyPressure);

  return true;
}

/** Call once per tick to slowly recover prices toward 1.0 */
export function tickMarketPrices(market: MarketState) {
  for (const key of Object.keys(market.prices) as TradableResource[]) {
    const diff = 1 - market.prices[key];
    market.prices[key] += diff * MARKET_PRICE_RECOVERY_RATE; // slow recovery
  }
}
