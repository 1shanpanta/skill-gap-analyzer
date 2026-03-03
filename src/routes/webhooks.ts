import { Router, raw } from 'express';
import { Webhook } from 'standardwebhooks';
import { config } from '../config/index';
import { findByEmail } from '../db/queries/users';
import { addCredits, getPurchaseByPaymentId } from '../db/queries/credits';
import { CREDIT_PACKS, type PackKey } from '../services/dodo';
import { logger } from '../lib/logger';

const router = Router();

router.post('/dodo', raw({ type: 'application/json' }), async (req, res) => {
  if (!config.DODO_WEBHOOK_SECRET) {
    logger.error('DODO_WEBHOOK_SECRET not configured');
    res.status(500).json({ error: 'Webhook secret not configured' });
    return;
  }

  const rawBody = req.body.toString();
  const headers = {
    'webhook-id': req.headers['webhook-id'] as string,
    'webhook-timestamp': req.headers['webhook-timestamp'] as string,
    'webhook-signature': req.headers['webhook-signature'] as string,
  };

  try {
    const wh = new Webhook(config.DODO_WEBHOOK_SECRET);
    wh.verify(rawBody, headers);
  } catch {
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }

  const event = JSON.parse(rawBody);
  const { type, data } = event;

  try {
    if (type === 'payment.succeeded') {
      await handlePaymentSucceeded(data);
    }
    // Other event types can be added here as needed

    res.json({ received: true });
  } catch (err) {
    logger.error({ err }, 'Webhook processing error');
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handlePaymentSucceeded(data: {
  payment_id: string;
  product_cart: { product_id: string; quantity: number }[];
  customer: { customer_id: string; email: string; name: string };
  total_amount: number;
  currency: string;
  metadata?: Record<string, string>;
}) {
  // Idempotency: skip if we already processed this payment
  const existing = await getPurchaseByPaymentId(data.payment_id);
  if (existing) return;

  // Determine which pack was purchased by matching product_id
  const packEntry = Object.entries(CREDIT_PACKS).find(([, pack]) => {
    const productId = config[pack.productEnv];
    return data.product_cart?.some((item) => item.product_id === productId);
  });

  if (!packEntry) {
    logger.error({ productCart: data.product_cart }, 'Unknown product in payment');
    return;
  }

  const [packKey, pack] = packEntry;

  // Find user — first try metadata, then email
  const userId = data.metadata?.user_id;
  let resolvedUserId = userId;

  if (!resolvedUserId) {
    const user = await findByEmail(data.customer.email);
    if (!user) {
      logger.error({ email: data.customer.email }, 'No user found for webhook email');
      return;
    }
    resolvedUserId = user.id;
  }

  await addCredits({
    user_id: resolvedUserId,
    dodo_payment_id: data.payment_id,
    dodo_customer_id: data.customer.customer_id,
    pack_key: packKey,
    credits: pack.credits,
    amount_cents: data.total_amount,
    currency: data.currency,
  });
}

export { router as webhooksRouter };
