import { Pool } from 'pg';

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  daily_analysis_count: number;
  last_analysis_date: string | null;
  created_at: string;
  updated_at: string;
}

export async function createUser(
  pool: Pool,
  email: string,
  name: string,
  passwordHash: string
): Promise<User> {
  const result = await pool.query(
    `INSERT INTO users (email, name, password_hash)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [email, name, passwordHash]
  );
  return result.rows[0];
}

export async function findByEmail(pool: Pool, email: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] ?? null;
}

export async function findById(pool: Pool, id: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] ?? null;
}

export async function incrementAnalysisCount(pool: Pool, id: string): Promise<void> {
  await pool.query(
    `UPDATE users
     SET daily_analysis_count = daily_analysis_count + 1,
         last_analysis_date = CURRENT_DATE,
         updated_at = NOW()
     WHERE id = $1`,
    [id]
  );
}

export async function resetDailyCount(pool: Pool, id: string): Promise<void> {
  await pool.query(
    `UPDATE users
     SET daily_analysis_count = 0,
         last_analysis_date = CURRENT_DATE,
         updated_at = NOW()
     WHERE id = $1`,
    [id]
  );
}
