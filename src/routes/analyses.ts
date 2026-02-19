import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/connection.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { rateLimitMiddleware } from '../middleware/rateLimit.js';
import { AppError } from '../middleware/errorHandler.js';
import { createResume } from '../db/queries/resumes.js';
import { createJobDescription } from '../db/queries/jobDescriptions.js';
import {
  createAnalysis,
  findAnalysisByIdAndUser,
  listAnalysesByUser,
} from '../db/queries/analyses.js';
import { createJob } from '../db/queries/jobs.js';
import { incrementAnalysisCount } from '../db/queries/users.js';

const router = Router();

const createAnalysisSchema = z.object({
  resume_text: z.string().min(100, 'Resume must be at least 100 characters').max(50000),
  job_description_text: z.string().min(100, 'Job description must be at least 100 characters').max(50000),
  github_url: z
    .string()
    .url()
    .regex(/github\.com\/[a-zA-Z0-9\-]+/, 'Must be a valid GitHub profile URL')
    .optional()
    .nullable(),
});

// POST /api/analyses
router.post('/', authMiddleware, rateLimitMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const body = createAnalysisSchema.parse(req.body);
    const userId = req.userId!;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert resume
      const resumeResult = await client.query(
        'INSERT INTO resumes (user_id, raw_text) VALUES ($1, $2) RETURNING id',
        [userId, body.resume_text]
      );
      const resumeId = resumeResult.rows[0].id;

      // Insert job description
      const jdResult = await client.query(
        'INSERT INTO job_descriptions (user_id, raw_text) VALUES ($1, $2) RETURNING id',
        [userId, body.job_description_text]
      );
      const jdId = jdResult.rows[0].id;

      // Insert analysis
      const analysisResult = await client.query(
        `INSERT INTO analyses (user_id, resume_id, job_description_id, github_url)
         VALUES ($1, $2, $3, $4) RETURNING id, status`,
        [userId, resumeId, jdId, body.github_url ?? null]
      );
      const analysisId = analysisResult.rows[0].id;

      // Insert job
      await client.query(
        `INSERT INTO jobs (type, payload)
         VALUES ($1, $2)`,
        ['run_analysis', JSON.stringify({ analysis_id: analysisId, user_id: userId })]
      );

      // Increment daily count
      await client.query(
        `UPDATE users
         SET daily_analysis_count = daily_analysis_count + 1,
             last_analysis_date = CURRENT_DATE,
             updated_at = NOW()
         WHERE id = $1`,
        [userId]
      );

      await client.query('COMMIT');

      res.status(201).json({
        analysis_id: analysisId,
        status: 'pending',
        message: 'Analysis queued. Poll GET /api/analyses/:id/status for progress.',
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        error: 'ValidationError',
        message: err.errors.map((e) => e.message).join(', '),
        statusCode: 400,
      });
      return;
    }
    next(err);
  }
});

// GET /api/analyses/:id
router.get('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const analysis = await findAnalysisByIdAndUser(pool, req.params.id as string, req.userId!);
    if (!analysis) {
      throw new AppError(404, 'Analysis not found');
    }
    res.json(analysis);
  } catch (err) {
    next(err);
  }
});

// GET /api/analyses/:id/status
router.get('/:id/status', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const analysis = await findAnalysisByIdAndUser(pool, req.params.id as string, req.userId!);
    if (!analysis) {
      throw new AppError(404, 'Analysis not found');
    }
    res.json({
      id: analysis.id,
      status: analysis.status,
      overall_score: analysis.overall_score,
      completed_at: analysis.completed_at,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analyses
router.get('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

    const { analyses, total } = await listAnalysesByUser(pool, req.userId!, page, limit);

    res.json({
      analyses: analyses.map((a) => ({
        id: a.id,
        status: a.status,
        overall_score: a.overall_score,
        created_at: a.created_at,
        completed_at: a.completed_at,
      })),
      total,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

export { router as analysesRouter };
