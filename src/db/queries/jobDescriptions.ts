import { Pool } from 'pg';

export interface JobDescription {
  id: string;
  user_id: string;
  raw_text: string;
  extracted_data: Record<string, any> | null;
  created_at: string;
}

export async function createJobDescription(pool: Pool, userId: string, rawText: string): Promise<JobDescription> {
  const result = await pool.query(
    `INSERT INTO job_descriptions (user_id, raw_text)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, rawText]
  );
  return result.rows[0];
}

export async function updateJDExtractedData(
  pool: Pool,
  jdId: string,
  extractedData: Record<string, any>
): Promise<void> {
  await pool.query(
    `UPDATE job_descriptions SET extracted_data = $2 WHERE id = $1`,
    [jdId, JSON.stringify(extractedData)]
  );
}

export async function findJobDescriptionById(pool: Pool, id: string): Promise<JobDescription | null> {
  const result = await pool.query('SELECT * FROM job_descriptions WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}
