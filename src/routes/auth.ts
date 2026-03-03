import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { config } from '../config/index';
import {
  createUser,
  findByEmail,
  findById,
  findByGoogleId,
  createGoogleUser,
  linkGoogleAccount,
  unlinkGoogleAccount,
  updateUser,
  updatePassword,
  setPasswordResetToken,
  findByResetToken,
  clearResetToken,
  getUserWithStats,
} from '../db/queries/users';
import { AppError } from '../middleware/errorHandler';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { sendPasswordResetEmail } from '../services/email';
import { getGoogleAuthUrl, getGoogleUser } from '../services/google-auth';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many attempts, please try again later', code: 'RATE_LIMIT', statusCode: 429 },
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many attempts, please try again later', code: 'RATE_LIMIT', statusCode: 429 },
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

function generateToken(userId: string): string {
  return jwt.sign({ userId }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as string,
  } as jwt.SignOptions);
}

function setAuthCookie(res: import('express').Response, token: string) {
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

function userResponse(user: { id: string; email: string; name: string; created_at: Date; avatar_url?: string | null }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url ?? null,
    created_at: user.created_at,
  };
}

// POST /api/auth/dev-login — dev-only auto login, creates user if needed
router.post('/dev-login', async (req, res, next) => {
  try {
    if (config.NODE_ENV !== 'development') {
      throw new AppError(404, 'Not found');
    }

    const devEmail = 'dev@localhost';
    let user = await findByEmail(devEmail);

    if (!user) {
      const hash = await bcrypt.hash('devpassword1', config.BCRYPT_SALT_ROUNDS);
      user = await createUser(devEmail, 'Dev User', hash);
    }

    const token = generateToken(user.id);
    setAuthCookie(res, token);
    res.json({ user: userResponse(user), token });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);

    const existing = await findByEmail(body.email);
    if (existing) {
      throw new AppError(409, 'Email already registered', 'EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(body.password, config.BCRYPT_SALT_ROUNDS);
    const user = await createUser(body.email, body.name, passwordHash);
    const token = generateToken(user.id);

    setAuthCookie(res, token);
    res.status(201).json({ user: userResponse(user), token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        error: 'ValidationError',
        message: err.errors.map((e) => e.message).join(', '),
        code: 'VALIDATION_ERROR',
        statusCode: 400,
      });
      return;
    }
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await findByEmail(body.email);
    if (!user) {
      throw new AppError(401, 'Invalid email or password', 'AUTH_INVALID_CREDENTIALS');
    }

    if (!user.password_hash) {
      throw new AppError(401, 'This account uses Google sign-in. Please sign in with Google.', 'AUTH_GOOGLE_ONLY');
    }

    const valid = await bcrypt.compare(body.password, user.password_hash);
    if (!valid) {
      throw new AppError(401, 'Invalid email or password', 'AUTH_INVALID_CREDENTIALS');
    }

    const token = generateToken(user.id);
    setAuthCookie(res, token);
    res.json({ user: userResponse(user), token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        error: 'ValidationError',
        message: err.errors.map((e) => e.message).join(', '),
        code: 'VALIDATION_ERROR',
        statusCode: 400,
      });
      return;
    }
    next(err);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', strictLimiter, async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const user = await findByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({ message: 'If an account exists, a reset email has been sent.' });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await setPasswordResetToken(user.id, tokenHash, expires);

    const frontendUrl = config.FRONTEND_URL || 'http://localhost:3001';
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(user.email, resetUrl, user.name);

    res.json({ message: 'If an account exists, a reset email has been sent.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'ValidationError', message: 'Valid email required', code: 'VALIDATION_ERROR', statusCode: 400 });
      return;
    }
    next(err);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', strictLimiter, async (req, res, next) => {
  try {
    const body = z.object({
      token: z.string().min(1),
      password: z.string().min(8).regex(/[a-zA-Z]/).regex(/[0-9]/),
    }).parse(req.body);

    const tokenHash = crypto.createHash('sha256').update(body.token).digest('hex');
    const user = await findByResetToken(tokenHash);

    if (!user || !user.password_reset_expires || user.password_reset_expires < new Date()) {
      throw new AppError(400, 'Invalid or expired reset token', 'RESET_TOKEN_INVALID');
    }

    const passwordHash = await bcrypt.hash(body.password, config.BCRYPT_SALT_ROUNDS);
    await updatePassword(user.id, passwordHash);
    await clearResetToken(user.id);

    res.json({ message: 'Password has been reset. You can now sign in.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'ValidationError', message: 'Password must be 8+ chars with a letter and number', code: 'VALIDATION_ERROR', statusCode: 400 });
      return;
    }
    next(err);
  }
});

// GET /api/auth/google — redirect to Google consent screen
router.get('/google', (_req, res) => {
  if (!config.GOOGLE_CLIENT_ID) {
    res.status(501).json({ error: 'Google OAuth not configured' });
    return;
  }
  const state = crypto.randomBytes(32).toString('hex');
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000, // 10 minutes
  });
  const url = getGoogleAuthUrl(state);
  res.redirect(url);
});

// GET /api/auth/google/callback — handle Google OAuth callback
router.get('/google/callback', async (req, res) => {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const storedState = req.cookies?.oauth_state;

    if (!code) throw new AppError(400, 'Missing authorization code');
    if (!state || !storedState || state !== storedState) {
      throw new AppError(400, 'Invalid OAuth state');
    }

    // Clear the state cookie
    res.clearCookie('oauth_state');

    const googleUser = await getGoogleUser(code);

    // 1. Check by google_id
    let user = await findByGoogleId(googleUser.googleId);

    if (!user) {
      // 2. Check by email (auto-link existing account)
      user = await findByEmail(googleUser.email);

      if (user) {
        await linkGoogleAccount(user.id, googleUser.googleId, googleUser.avatarUrl);
        user = await findById(user.id);
      } else {
        // 3. Create new Google user
        user = await createGoogleUser(
          googleUser.email,
          googleUser.name,
          googleUser.googleId,
          googleUser.avatarUrl
        );
      }
    }

    const token = generateToken(user!.id);
    setAuthCookie(res, token);
    const frontendUrl = config.FRONTEND_URL || 'http://localhost:3001';

    res.redirect(`${frontendUrl}/auth/google/callback`);
  } catch (err) {
    const frontendUrl = config.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('auth_token', { path: '/' });
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me — get current user profile
router.get('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await getUserWithStats(req.userId!);
    if (!user) throw new AppError(404, 'User not found');

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      has_password: !!user.password_hash,
      has_google: !!user.google_id,
      credits: user.credits,
      total_analyses: user._count.analyses,
      created_at: user.created_at,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/auth/me — update profile
router.patch('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({
      name: z.string().min(2).max(100).optional(),
    }).parse(req.body);

    const user = await updateUser(req.userId!, body);
    res.json(userResponse(user));
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'ValidationError', message: err.errors.map((e) => e.message).join(', '), statusCode: 400 });
      return;
    }
    next(err);
  }
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({
      current_password: z.string().min(1),
      new_password: z.string().min(8).regex(/[a-zA-Z]/).regex(/[0-9]/),
    }).parse(req.body);

    const user = await findById(req.userId!);
    if (!user) throw new AppError(404, 'User not found');

    if (!user.password_hash) {
      throw new AppError(400, 'Account uses Google sign-in. Set a password via forgot password first.', 'AUTH_GOOGLE_ONLY');
    }

    const valid = await bcrypt.compare(body.current_password, user.password_hash);
    if (!valid) throw new AppError(401, 'Current password is incorrect', 'AUTH_INVALID_CREDENTIALS');

    const hash = await bcrypt.hash(body.new_password, config.BCRYPT_SALT_ROUNDS);
    await updatePassword(user.id, hash);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'ValidationError', message: 'New password must be 8+ chars with a letter and number', statusCode: 400 });
      return;
    }
    next(err);
  }
});

// DELETE /api/auth/unlink-google
router.delete('/unlink-google', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await findById(req.userId!);
    if (!user) throw new AppError(404, 'User not found');

    if (!user.password_hash) {
      throw new AppError(400, 'Cannot unlink Google — set a password first to keep access to your account.', 'AUTH_NO_PASSWORD');
    }

    await unlinkGoogleAccount(user.id);
    res.json({ message: 'Google account unlinked' });
  } catch (err) {
    next(err);
  }
});

export { router as authRouter };
