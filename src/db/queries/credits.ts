import { prisma } from '../prisma';

export async function addCredits(data: {
  user_id: string;
  dodo_payment_id: string;
  dodo_customer_id?: string;
  pack_key: string;
  credits: number;
  amount_cents: number;
  currency?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.creditPurchase.create({
      data: {
        user_id: data.user_id,
        dodo_payment_id: data.dodo_payment_id,
        dodo_customer_id: data.dodo_customer_id ?? null,
        pack_key: data.pack_key,
        credits: data.credits,
        amount_cents: data.amount_cents,
        currency: data.currency ?? 'USD',
      },
    });

    await tx.user.update({
      where: { id: data.user_id },
      data: { credits: { increment: data.credits } },
    });

    return purchase;
  });
}

export async function deductCredit(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { credits: { decrement: 1 } },
  });
}

export async function getPurchaseByPaymentId(dodoPaymentId: string) {
  return prisma.creditPurchase.findUnique({
    where: { dodo_payment_id: dodoPaymentId },
  });
}

export async function getPurchaseHistory(userId: string) {
  return prisma.creditPurchase.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: 20,
  });
}
