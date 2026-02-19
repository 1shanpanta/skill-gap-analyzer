import { Pool } from 'pg';

export interface Analysis {
  id: string;
  user_id: string;
  resume_id: string;
  job_description_id: string;
  status: string;
  overall_score: number | null;
  score_breakdown: Record<string, any> | null;
  skill_gaps: Record<string, any> | null;
  github_signals: Record<string, any> | null;
  roadmap: string | null;
  resume_suggestions: string | null;
  token_usage: Record<string, any> | null;
  github_url: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface AnalysisWithRelations extends Analysis {
  resume_raw_text: string;
  jd_raw_text: string;
  user_email: string;
}

export async function createAnalysis(
  pool: Pool,
  userId: string,
  resumeId: string,
  jobDescriptionId: string,
  githubUrl: string | null
): Promise<Analysis> {
  const result = await pool.query(
    `INSERT INTO analyses (user_id, resume_id, job_description_id, github_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, resumeId, jobDescriptionId, githubUrl]
  );
  return result.rows[0];
}

export async function findAnalysisById(pool: Pool, id: string): Promise<Analysis | null> {
  const result = await pool.query('SELECT * FROM analyses WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function findAnalysisByIdAndUser(pool: Pool, id: string, userId: string): Promise<Analysis | null> {
  const result = await pool.query(
    'SELECT * FROM analyses WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return result.rows[0] ?? null;
}

export async function getAnalysisWithRelations(pool: Pool, analysisId: string): Promise<AnalysisWithRelations | null> {
  const result = await pool.query(
    `SELECT a.*,
            r.raw_text AS resume_raw_text,
            jd.raw_text AS jd_raw_text,
            u.email AS user_email
     FROM analyses a
     JOIN resumes r ON r.id = a.resume_id
     JOIN job_descriptions jd ON jd.id = a.job_description_id
     JOIN users u ON u.id = a.user_id
     WHERE a.id = $1`,
    [analysisId]
  );
  return result.rows[0] ?? null;
}

export async function updateAnalysisStatus(pool: Pool, id: string, status: string): Promise<void> {
  await pool.query('UPDATE analyses SET status = $2 WHERE id = $1', [id, status]);
}

export async function completeAnalysis(
  pool: Pool,
  id: string,
  data: {
    overall_score: number;
    score_breakdown: Record<string, any>;
    skill_gaps: Record<string, any>;
    github_signals: Record<string, any> | null;
    roadmap: string;
    resume_suggestions: string;
    token_usage: Record<string, any>;
  }
): Promise<void> {
  await pool.query(
    `UPDATE analyses
     SET status = 'completed',
         overall_score = $2,
         score_breakdown = $3,
         skill_gaps = $4,
         github_signals = $5,
         roadmap = $6,
         resume_suggestions = $7,
         token_usage = $8,
         completed_at = NOW()
     WHERE id = $1`,
    [
      id,
      data.overall_score,
      JSON.stringify(data.score_breakdown),
      JSON.stringify(data.skill_gaps),
      data.github_signals ? JSON.stringify(data.github_signals) : null,
      data.roadmap,
      data.resume_suggestions,
      JSON.stringify(data.token_usage),
    ]
  );
}

export async function listAnalysesByUser(
  pool: Pool,
  userId: string,
  page: number,
  limit: number
): Promise<{ analyses: Analysis[]; total: number }> {
  const offset = (page - 1) * limit;

  const countResult = await pool.query(
    'SELECT COUNT(*) FROM analyses WHERE user_id = $1',
    [userId]
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await pool.query(
    `SELECT * FROM analyses
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return { analyses: result.rows, total };
}
