import DodoPayments from 'dodopayments';
import { config } from '../config/index';

let client: DodoPayments | null = null;

export function getDodoClient(): DodoPayments {
  if (!client) {
    if (!config.DODO_API_KEY) {
      throw new Error('DODO_API_KEY is not configured');
    }
    client = new DodoPayments({
      bearerToken: config.DODO_API_KEY,
      environment: config.NODE_ENV === 'production' ? 'live_mode' : 'test_mode',
    });
  }
  return client;
}

export const CREDIT_PACKS = {
  pack_10: { credits: 5, price: 500, label: '5 credits', productEnv: 'DODO_PRODUCT_10' as const },
  pack_30: { credits: 15, price: 1000, label: '15 credits', productEnv: 'DODO_PRODUCT_30' as const },
  pack_100: { credits: 50, price: 2500, label: '50 credits', productEnv: 'DODO_PRODUCT_100' as const },
} as const;

export type PackKey = keyof typeof CREDIT_PACKS;

export function getProductId(packKey: PackKey): string {
  const pack = CREDIT_PACKS[packKey];
  const productId = config[pack.productEnv];
  if (!productId) {
    throw new Error(`${pack.productEnv} is not configured`);
  }
  return productId;
}
