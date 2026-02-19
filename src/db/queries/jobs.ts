import { Pool } from 'pg';

export interface Job {
  id: string;
  type: string;
  status: string;
  payload: Record<string, any>;
  result: Record<string, any> | null;
  attempts: number;
  max_attempts: number;
  priority: number;
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  error: string | null;
  worker_id: string | null;
  created_at: string;
}

export async function createJob(
  pool: Pool,
  type: string,
  payload: Record<string, any>,
  priority: number = 0,
  maxAttempts: number = 3
): Promise<Job> {
  const result = await pool.query(
    `INSERT INTO jobs (type, payload, priority, max_attempts)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [type, JSON.stringify(payload), priority, maxAttempts]
  );
  return result.rows[0];
}

export async function claimJob(pool: Pool, workerId: string): Promise<Job | null> {
  const result = await pool.query(
    `UPDATE jobs
     SET status = 'processing',
         started_at = NOW(),
         attempts = attempts + 1,
         worker_id = $1
     WHERE id = (
       SELECT id FROM jobs
       WHERE status = 'pending'
         AND scheduled_at <= NOW()
         AND attempts < max_attempts
       ORDER BY priority DESC, scheduled_at ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING *`,
    [workerId]
  );
  return result.rows[0] ?? null;
}

export async function completeJob(pool: Pool, jobId: string, result: Record<string, any>): Promise<void> {
  await pool.query(
    `UPDATE jobs
     SET status = 'completed',
         completed_at = NOW(),
         result = $2
     WHERE id = $1`,
    [jobId, JSON.stringify(result)]
  );
}

export async function failJob(pool: Pool, jobId: string, error: string): Promise<void> {
  await pool.query(
    `UPDATE jobs
     SET status = CASE
           WHEN attempts >= max_attempts THEN 'failed'
           ELSE 'pending'
         END,
         failed_at = CASE
           WHEN attempts >= max_attempts THEN NOW()
           ELSE failed_at
         END,
         error = $2,
         scheduled_at = CASE
           WHEN attempts < max_attempts
           THEN NOW() + (POWER(2, attempts) || ' seconds')::INTERVAL
           ELSE scheduled_at
         END,
         worker_id = NULL,
         started_at = NULL
     WHERE id = $1`,
    [jobId, error]
  );
}

export async function recoverStaleJobs(pool: Pool, thresholdMinutes: number): Promise<number> {
  const result = await pool.query(
    `UPDATE jobs
     SET status = 'pending',
         started_at = NULL,
         worker_id = NULL,
         error = 'Job processing timed out - worker may have crashed'
     WHERE status = 'processing'
       AND started_at < NOW() - ($1 || ' minutes')::INTERVAL
     RETURNING id`,
    [thresholdMinutes.toString()]
  );
  return result.rowCount ?? 0;
}
