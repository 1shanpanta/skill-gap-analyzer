import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
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

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: config.NODE_ENV === 'production'
    ? config.FRONTEND_URL
    : 'http://localhost:3001',
  credentials: true,
}));

// Webhook route must be mounted before express.json() — it needs the raw body
app.use('/api/webhooks', webhooksRouter);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Health check
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'unhealthy' });
  }
});

// Swagger UI — development only
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

// Public shared analysis endpoint (no auth)
app.get('/api/shared/:token', async (req, res, next) => {
  try {
    const analysis = await prisma.analysis.findUnique({
      where: { share_token: req.params.token as string },
    });

    if (!analysis || analysis.status !== 'completed') {
      res.status(404).json({ error: 'Shared analysis not found', code: 'SHARED_NOT_FOUND', statusCode: 404 });
      return;
    }

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
