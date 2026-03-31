import { prisma } from '../prisma';
import type { Job } from '../../generated/prisma/client';

export type { Job };

// Uses raw SQL because Prisma doesn't support FOR UPDATE SKIP LOCKED
export async function claimJob(workerId: string): Promise<Job | null> {
  const rows = await prisma.$queryRaw<Job[]>`
    UPDATE jobs
    SET status = 'processing',
        started_at = NOW(),
        attempts = attempts + 1,
        worker_id = ${workerId}
    WHERE id = (
      SELECT id FROM jobs
      WHERE status = 'pending'
        AND scheduled_at <= NOW()
        AND attempts < max_attempts
      ORDER BY priority DESC, scheduled_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *`;
  return rows[0] ?? null;
}

export async function completeJob(jobId: string, result: Record<string, any>): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'completed',
      completed_at: new Date(),
      result,
    },
  });
}

// Uses raw SQL for the complex CASE expression with exponential backoff
// Returns true if the job permanently failed (all retries exhausted)
export async function failJob(jobId: string, error: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ status: string }[]>`
    UPDATE jobs
    SET status = CASE
          WHEN attempts >= max_attempts THEN 'failed'
          ELSE 'pending'
        END,
        failed_at = CASE
          WHEN attempts >= max_attempts THEN NOW()
          ELSE failed_at
        END,
        error = ${error},
        scheduled_at = CASE
          WHEN attempts < max_attempts
          THEN NOW() + (POWER(2, attempts) || ' seconds')::INTERVAL
          ELSE scheduled_at
        END,
        worker_id = NULL,
        started_at = NULL
    WHERE id = ${jobId}::uuid
    RETURNING status`;
  return rows[0]?.status === 'failed';
}

// Uses raw SQL for interval arithmetic
export async function recoverStaleJobs(thresholdMinutes: number): Promise<number> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    UPDATE jobs
    SET status = 'pending',
        started_at = NULL,
        worker_id = NULL,
        error = 'Job processing timed out - worker may have crashed'
    WHERE status = 'processing'
      AND started_at < NOW() - (${thresholdMinutes.toString()} || ' minutes')::INTERVAL
    RETURNING id`;
  return rows.length;
}
