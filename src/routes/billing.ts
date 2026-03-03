import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { config } from '../config/index';
import { getDodoClient, CREDIT_PACKS, getProductId, type PackKey } from '../services/dodo';
import { findById } from '../db/queries/users';
import { getPurchaseHistory } from '../db/queries/credits';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const checkoutSchema = z.object({
  pack: z.enum(['pack_10', 'pack_30', 'pack_100']),
});

router.post('/checkout', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { pack } = checkoutSchema.parse(req.body);

    const user = await findById(req.userId!);
    if (!user) throw new AppError(404, 'User not found');

    const client = getDodoClient();
    const productId = getProductId(pack);
    const frontendUrl = config.FRONTEND_URL || 'http://localhost:3001';

    const session = await client.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email: user.email, name: user.name },
      return_url: `${frontendUrl}/settings?billing=success`,
      metadata: { user_id: user.id, pack_key: pack },
    });

    res.json({ checkout_url: session.checkout_url });
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new AppError(400, 'Invalid credit pack', 'VALIDATION_ERROR'));
      return;
    }
    next(err);
  }
});

router.get('/status', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await findById(req.userId!);
    if (!user) throw new AppError(404, 'User not found');

    const purchases = await getPurchaseHistory(req.userId!);

    res.json({
      credits: user.credits,
      purchases: purchases.map((p) => ({
        pack_key: p.pack_key,
        credits: p.credits,
        amount_cents: p.amount_cents,
        currency: p.currency,
        created_at: p.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export { router as billingRouter };
