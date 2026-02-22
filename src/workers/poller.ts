import { randomUUID } from 'crypto';
import { config } from '../config/index.js';
import { claimJob, completeJob, failJob, recoverStaleJobs } from '../db/queries/jobs.js';
import { handleJob } from './handlers.js';

const WORKER_ID = `worker-${randomUUID().slice(0, 8)}`;

export function startWorker(): void {
  console.log(`[${WORKER_ID}] Worker started. Polling every ${config.WORKER_POLL_INTERVAL_MS}ms.`);

  // Main polling loop
  const pollTimer = setInterval(async () => {
    try {
      const job = await claimJob(WORKER_ID);
      if (!job) return;

      console.log(`[${WORKER_ID}] Claimed job ${job.id} (type: ${job.type}, attempt: ${job.attempts})`);

      try {
        const result = await handleJob(job);
        await completeJob(job.id, result);
        console.log(`[${WORKER_ID}] Completed job ${job.id}`);
      } catch (err: any) {
        console.error(`[${WORKER_ID}] Job ${job.id} failed:`, err.message);
        await failJob(job.id, err.message);
      }
    } catch (err) {
      console.error(`[${WORKER_ID}] Poll error:`, err);
    }
  }, config.WORKER_POLL_INTERVAL_MS);

  // Stale job recovery loop
  const staleTimer = setInterval(async () => {
    try {
      const recovered = await recoverStaleJobs(config.JOB_STALE_THRESHOLD_MINUTES);
      if (recovered > 0) {
        console.log(`[${WORKER_ID}] Recovered ${recovered} stale jobs`);
      }
    } catch (err) {
      console.error(`[${WORKER_ID}] Stale recovery error:`, err);
    }
  }, 60_000);

  // Graceful shutdown
  const shutdown = () => {
    console.log(`[${WORKER_ID}] Shutting down...`);
    clearInterval(pollTimer);
    clearInterval(staleTimer);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
