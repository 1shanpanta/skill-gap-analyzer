import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { prisma } from './db/prisma';
import { config } from './config/index';
import { authRouter } from './routes/auth';
import { analysesRouter } from './routes/analyses';
import { errorHandler } from './middleware/errorHandler';
import { startWorker } from './workers/poller';

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.NODE_ENV === 'production'
    ? config.FRONTEND_URL
    : 'http://localhost:3001',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

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

// Global error handler
app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
  startWorker();
});

export default app;
