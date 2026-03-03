import { randomUUID } from 'crypto';
import { config } from '../config/index';
import { claimJob, completeJob, failJob, recoverStaleJobs } from '../db/queries/jobs';
import { handleJob } from './handlers';
import { logger } from '../lib/logger';

const WORKER_ID = `worker-${randomUUID().slice(0, 8)}`;

export function startWorker(): void {
  logger.info({ workerId: WORKER_ID, pollIntervalMs: config.WORKER_POLL_INTERVAL_MS }, 'Worker started');

  // Main polling loop
  const pollTimer = setInterval(async () => {
    try {
      const job = await claimJob(WORKER_ID);
      if (!job) return;

      logger.info({ workerId: WORKER_ID, jobId: job.id, type: job.type, attempt: job.attempts }, 'Claimed job');

      try {
        const result = await handleJob(job);
        await completeJob(job.id, result);
        logger.info({ workerId: WORKER_ID, jobId: job.id }, 'Completed job');
      } catch (err: any) {
        logger.error({ workerId: WORKER_ID, jobId: job.id, err: err.message }, 'Job failed');
        await failJob(job.id, err.message);
      }
    } catch (err) {
      logger.error({ workerId: WORKER_ID, err }, 'Poll error');
    }
  }, config.WORKER_POLL_INTERVAL_MS);

  // Stale job recovery loop
  const staleTimer = setInterval(async () => {
    try {
      const recovered = await recoverStaleJobs(config.JOB_STALE_THRESHOLD_MINUTES);
      if (recovered > 0) {
        logger.info({ workerId: WORKER_ID, recovered }, 'Recovered stale jobs');
      }
    } catch (err) {
      logger.error({ workerId: WORKER_ID, err }, 'Stale recovery error');
    }
  }, 60_000);

  // Graceful shutdown
  const shutdown = () => {
    logger.info({ workerId: WORKER_ID }, 'Shutting down');
    clearInterval(pollTimer);
    clearInterval(staleTimer);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
