import type { ResourceState } from './Resources';

export type TradableResource = 'scrap' | 'steel' | 'electronics' | 'data';

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
};

export const RESOURCE_COLORS: Record<TradableResource, string> = {
  scrap: '#9b59b6',
  steel: '#e67e22',
  electronics: '#2ecc71',
  data: '#3498db',
};

export const TRADE_ROUTES: TradeRoute[] = [
  { from: 'scrap', to: 'steel', baseRate: 0.4, label: 'Schrott → Stahl' },
  { from: 'scrap', to: 'electronics', baseRate: 0.25, label: 'Schrott → Elektronik' },
  { from: 'steel', to: 'electronics', baseRate: 0.5, label: 'Stahl → Elektronik' },
  { from: 'steel', to: 'scrap', baseRate: 2.0, label: 'Stahl → Schrott' },
  { from: 'electronics', to: 'steel', baseRate: 1.5, label: 'Elektronik → Stahl' },
  { from: 'electronics', to: 'data', baseRate: 0.3, label: 'Elektronik → Daten' },
  { from: 'data', to: 'electronics', baseRate: 2.5, label: 'Daten → Elektronik' },
];

export const TRADE_AMOUNTS = [10, 50, 100];

export function createMarketState(): MarketState {
  return {
    prices: { scrap: 1, steel: 1, electronics: 1, data: 1 },
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
  const sellPressure = amount * 0.002;
  const buyPressure = output * 0.003;
  market.prices[route.from] = Math.max(0.3, market.prices[route.from] - sellPressure);
  market.prices[route.to] = Math.min(3.0, market.prices[route.to] + buyPressure);

  return true;
}

/** Call once per tick to slowly recover prices toward 1.0 */
export function tickMarketPrices(market: MarketState) {
  for (const key of Object.keys(market.prices) as TradableResource[]) {
    const diff = 1 - market.prices[key];
    market.prices[key] += diff * 0.005; // slow recovery
  }
}
