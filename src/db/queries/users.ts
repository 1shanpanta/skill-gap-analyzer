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

export async function findByGoogleId(googleId: string) {
  return prisma.user.findUnique({ where: { google_id: googleId } });
}

export async function createGoogleUser(
  email: string,
  name: string,
  googleId: string,
  avatarUrl?: string
) {
  return prisma.user.create({
    data: { email, name, google_id: googleId, avatar_url: avatarUrl },
  });
}

export async function linkGoogleAccount(
  userId: string,
  googleId: string,
  avatarUrl?: string
) {
  return prisma.user.update({
    where: { id: userId },
    data: { google_id: googleId, avatar_url: avatarUrl, updated_at: new Date() },
  });
}

export async function unlinkGoogleAccount(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { google_id: null, avatar_url: null, updated_at: new Date() },
  });
}

export async function updateUser(userId: string, data: { name?: string }) {
  return prisma.user.update({
    where: { id: userId },
    data: { ...data, updated_at: new Date() },
  });
}

export async function updatePassword(userId: string, passwordHash: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { password_hash: passwordHash, updated_at: new Date() },
  });
}

export async function setPasswordResetToken(
  userId: string,
  tokenHash: string,
  expires: Date
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      password_reset_token: tokenHash,
      password_reset_expires: expires,
      updated_at: new Date(),
    },
  });
}

export async function findByResetToken(tokenHash: string) {
  return prisma.user.findUnique({
    where: { password_reset_token: tokenHash },
  });
}

export async function clearResetToken(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      password_reset_token: null,
      password_reset_expires: null,
      updated_at: new Date(),
    },
  });
}

export async function getUserWithStats(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { _count: { select: { analyses: true } } },
  });
}
