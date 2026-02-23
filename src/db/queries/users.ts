import { prisma } from '../prisma';

export async function createUser(
  email: string,
  name: string,
  passwordHash: string
) {
  return prisma.user.create({
    data: { email, name, password_hash: passwordHash },
  });
}

export async function findByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function resetDailyCount(id: string): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: {
      daily_analysis_count: 0,
      last_analysis_date: new Date(),
      updated_at: new Date(),
    },
  });
}
