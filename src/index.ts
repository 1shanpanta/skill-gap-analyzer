import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { prisma } from './db/prisma';
import { config } from './config/index';
import { authRouter } from './routes/auth';
import { analysesRouter } from './routes/analyses';
import { resumesRouter } from './routes/resumes';
import { billingRouter } from './routes/billing';
import { webhooksRouter } from './routes/webhooks';
import { errorHandler } from './middleware/errorHandler';
import { startWorker } from './workers/poller';
import { logger } from './lib/logger';

const app = express();

// Validate critical env vars in production
if (config.NODE_ENV === 'production') {
  if (!config.FRONTEND_URL) throw new Error('FRONTEND_URL must be set in production');
  if (config.JWT_SECRET.includes('test') || config.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be a strong random value in production (min 32 chars, no "test")');
  }
}

app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

app.use(cors({
  origin: config.NODE_ENV === 'production'
    ? config.FRONTEND_URL
    : 'http://localhost:3001',
  credentials: true,
}));

// Webhook route must be mounted before express.json() -- needs raw body
app.use('/api/webhooks', webhooksRouter);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Global rate limit: 100 req/min per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later', code: 'RATE_LIMITED', statusCode: 429 },
});
app.use(globalLimiter);

// Health check (stricter rate limit)
const healthLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
app.get('/health', healthLimiter, async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'unhealthy' });
  }
});

// Swagger UI -- development only
if (config.NODE_ENV !== 'production') {
  import('swagger-ui-express').then((swaggerUi) =>
    import('./swagger').then(({ swaggerSpec }) => {
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    })
  );
}

// Routes
app.use('/api/auth', authRouter);
app.use('/api/analyses', analysesRouter);
app.use('/api/resumes', resumesRouter);
app.use('/api/billing', billingRouter);

// Public shared analysis endpoint (no auth, strict rate limit)
const sharedLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', code: 'RATE_LIMITED', statusCode: 429 },
});

app.get('/api/shared/:token', sharedLimiter, async (req, res, next) => {
  try {
    const token = req.params.token as string;

    // Validate token format (64-char hex only)
    if (!/^[a-f0-9]{64}$/.test(token)) {
      logger.warn({ ip: req.ip }, 'Shared link: invalid token format');
      res.status(400).json({ error: 'Invalid token format', code: 'INVALID_TOKEN', statusCode: 400 });
      return;
    }

    const analysis = await prisma.analysis.findUnique({
      where: { share_token: token },
    });

    if (!analysis || analysis.status !== 'completed') {
      logger.info({ ip: req.ip, tokenPrefix: token.slice(0, 8) }, 'Shared link: not found');
      res.status(404).json({ error: 'Shared analysis not found', code: 'SHARED_NOT_FOUND', statusCode: 404 });
      return;
    }

    logger.info({ analysisId: analysis.id, ip: req.ip }, 'Shared link accessed');

    res.json({
      id: analysis.id,
      overall_score: analysis.overall_score,
      score_breakdown: analysis.score_breakdown,
      skill_gaps: analysis.skill_gaps,
      github_signals: analysis.github_signals,
      roadmap: analysis.roadmap,
      resume_suggestions: analysis.resume_suggestions,
      completed_at: analysis.completed_at,
    });
  } catch (err) {
    next(err);
  }
});

// Global error handler
app.use(errorHandler);

const server = app.listen(config.PORT, () => {
  logger.info({ port: config.PORT }, 'Server running');
  startWorker();
});

// 2 minute server-level timeout
server.timeout = 120_000;

export default app;
