import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { rateLimitMiddleware } from '../middleware/rateLimit.js';
import { AppError } from '../middleware/errorHandler.js';
import { findAnalysisByIdAndUser, listAnalysesByUser } from '../db/queries/analyses.js';

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

    const result = await prisma.$transaction(async (tx) => {
      const resume = await tx.resume.create({
        data: { user_id: userId, raw_text: body.resume_text },
      });

      const jd = await tx.jobDescription.create({
        data: { user_id: userId, raw_text: body.job_description_text },
      });

      const analysis = await tx.analysis.create({
        data: {
          user_id: userId,
          resume_id: resume.id,
          job_description_id: jd.id,
          github_url: body.github_url ?? null,
        },
      });

      await tx.job.create({
        data: {
          type: 'run_analysis',
          payload: { analysis_id: analysis.id, user_id: userId },
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          daily_analysis_count: { increment: 1 },
          last_analysis_date: new Date(),
          updated_at: new Date(),
        },
      });

      return analysis;
    });

    res.status(201).json({
      analysis_id: result.id,
      status: 'pending',
      message: 'Analysis queued. Poll GET /api/analyses/:id/status for progress.',
    });
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
    const analysis = await findAnalysisByIdAndUser(req.params.id as string, req.userId!);
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
    const analysis = await findAnalysisByIdAndUser(req.params.id as string, req.userId!);
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

    const { analyses, total } = await listAnalysesByUser(req.userId!, page, limit);

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
