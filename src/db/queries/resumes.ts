import { Pool } from 'pg';

export interface Resume {
  id: string;
  user_id: string;
  raw_text: string;
  extracted_data: Record<string, any> | null;
  created_at: string;
}

export async function createResume(pool: Pool, userId: string, rawText: string): Promise<Resume> {
  const result = await pool.query(
    `INSERT INTO resumes (user_id, raw_text)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, rawText]
  );
  return result.rows[0];
}

export async function updateResumeExtractedData(
  pool: Pool,
  resumeId: string,
  extractedData: Record<string, any>
): Promise<void> {
  await pool.query(
    `UPDATE resumes SET extracted_data = $2 WHERE id = $1`,
    [resumeId, JSON.stringify(extractedData)]
  );
}

export async function findResumeById(pool: Pool, id: string): Promise<Resume | null> {
  const result = await pool.query('SELECT * FROM resumes WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}
