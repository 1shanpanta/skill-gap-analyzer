import { randomUUID } from 'crypto';
import { config } from '../config/index';
import { claimJob, completeJob, failJob, recoverStaleJobs } from '../db/queries/jobs';
import { handleJob } from './handlers';
import { logger } from '../lib/logger';
import { prisma } from '../db/prisma';

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
        const permanentlyFailed = await failJob(job.id, err.message);

        if (permanentlyFailed) {
          // Refund the credit since analysis permanently failed
          const payload = job.payload as Record<string, any>;
          if (payload.user_id) {
            await prisma.user.update({
              where: { id: payload.user_id },
              data: { credits: { increment: 1 } },
            });
            logger.info({ workerId: WORKER_ID, jobId: job.id, userId: payload.user_id }, 'Refunded 1 credit for permanently failed analysis');
          }
        }
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
