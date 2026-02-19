import express from 'express';
import { pool } from './db/connection.js';
import { config } from './config/index.js';
import { authRouter } from './routes/auth.js';
import { analysesRouter } from './routes/analyses.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startWorker } from './workers/poller.js';

const app = express();

app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'unhealthy' });
  }
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/analyses', analysesRouter);

// Global error handler
app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
  startWorker(pool);
});

export default app;
