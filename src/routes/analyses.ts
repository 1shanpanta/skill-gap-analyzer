import { createHash, randomBytes } from 'crypto';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { Prisma } from '../generated/prisma/client';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import { AppError } from '../middleware/errorHandler';
import { findAnalysisByIdAndUser, listAnalysesByUser, deleteAnalysis } from '../db/queries/analyses';

const router = Router();

const createAnalysisSchema = z.object({
  resume_text: z.string().min(100, 'Resume must be at least 100 characters').max(50000).optional(),
  resume_id: z.string().uuid().optional(),
  save_resume: z.boolean().optional(),
  resume_name: z.string().min(1).max(255).optional(),
  job_description_text: z.string().min(100, 'Job description must be at least 100 characters').max(50000),
  github_url: z
    .string()
    .url()
    .regex(/^https:\/\/(www\.)?github\.com\/[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?$/, 'Must be a valid GitHub profile URL (https://github.com/username)')
    .optional()
    .nullable(),
});

// POST /api/analyses
router.post('/', authMiddleware, rateLimitMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const body = createAnalysisSchema.parse(req.body);
    const userId = req.userId!;

    // Must provide either resume_text or resume_id
    if (!body.resume_text && !body.resume_id) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Either resume_text or resume_id is required',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
      });
      return;
    }

    // Resolve resume text for hashing
    let resumeTextForHash = body.resume_text;
    if (body.resume_id && !resumeTextForHash) {
      const existing = await prisma.resume.findFirst({
        where: { id: body.resume_id, user_id: userId },
        select: { raw_text: true },
      });
      if (!existing) {
        throw new AppError(404, 'Resume not found', 'RESUME_NOT_FOUND');
      }
      resumeTextForHash = existing.raw_text;
    }

    // Compute content hash for cache lookup
    const hashInput = [resumeTextForHash, body.job_description_text, body.github_url ?? ''].join('|');
    const contentHash = createHash('sha256').update(hashInput).digest('hex');

    // Check for a cached completed analysis within 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const cached = await prisma.analysis.findFirst({
      where: {
        user_id: userId,
        content_hash: contentHash,
        status: 'completed',
        completed_at: { gte: twentyFourHoursAgo },
      },
      orderBy: { completed_at: 'desc' },
    });

    if (cached) {
      res.status(200).json({
        analysis_id: cached.id,
        status: 'completed',
        cached: true,
        message: 'Returning cached analysis from the last 24 hours.',
      });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      let resumeId: string;

      if (body.resume_id) {
        const existing = await tx.resume.findFirst({
          where: { id: body.resume_id, user_id: userId },
        });
        if (!existing) {
          throw new AppError(404, 'Resume not found', 'RESUME_NOT_FOUND');
        }
        resumeId = existing.id;
      } else {
        const resume = await tx.resume.create({
          data: {
            user_id: userId,
            raw_text: body.resume_text!,
            name: body.resume_name || 'Untitled Resume',
            is_saved: body.save_resume ?? false,
          },
        });
        resumeId = resume.id;
      }

      const jd = await tx.jobDescription.create({
        data: { user_id: userId, raw_text: body.job_description_text },
      });

      const analysis = await tx.analysis.create({
        data: {
          user_id: userId,
          resume_id: resumeId,
          job_description_id: jd.id,
          github_url: body.github_url ?? null,
          content_hash: contentHash,
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
          credits: { decrement: 1 },
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
        code: 'VALIDATION_ERROR',
        statusCode: 400,
      });
      return;
    }
    next(err);
  }
});

// GET /api/analyses/stats
router.get('/stats', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    const [totalCount, completedCount, avgScoreResult, scoreDistribution] = await Promise.all([
      prisma.analysis.count({ where: { user_id: userId } }),
      prisma.analysis.count({ where: { user_id: userId, status: 'completed' } }),
      prisma.analysis.aggregate({
        where: { user_id: userId, status: 'completed' },
        _avg: { overall_score: true },
      }),
      prisma.analysis.groupBy({
        by: ['status'],
        where: { user_id: userId },
        _count: { status: true },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const item of scoreDistribution) {
      statusCounts[item.status] = item._count.status;
    }

    res.json({
      total: totalCount,
      completed: completedCount,
      average_score: avgScoreResult._avg.overall_score
        ? Number(avgScoreResult._avg.overall_score)
        : null,
      status_counts: statusCounts,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analyses/:id
router.get('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const analysis = await findAnalysisByIdAndUser(req.params.id as string, req.userId!);
    if (!analysis) {
      throw new AppError(404, 'Analysis not found', 'ANALYSIS_NOT_FOUND');
    }
    if (analysis.status === 'completed') {
      res.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600');
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
      throw new AppError(404, 'Analysis not found', 'ANALYSIS_NOT_FOUND');
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

    const filters: { status?: string; minScore?: number; maxScore?: number; sort?: 'newest' | 'oldest' | 'score_asc' | 'score_desc' } = {};
    if (req.query.status && ['pending', 'processing', 'completed', 'failed'].includes(req.query.status as string)) {
      filters.status = req.query.status as string;
    }
    if (req.query.min_score) filters.minScore = parseFloat(req.query.min_score as string);
    if (req.query.max_score) filters.maxScore = parseFloat(req.query.max_score as string);
    if (req.query.sort && ['newest', 'oldest', 'score_asc', 'score_desc'].includes(req.query.sort as string)) {
      filters.sort = req.query.sort as 'newest' | 'oldest' | 'score_asc' | 'score_desc';
    }

    const { analyses, total } = await listAnalysesByUser(req.userId!, page, limit, filters);

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

// POST /api/analyses/:id/retry — retry a failed analysis
router.post('/:id/retry', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const analysis = await findAnalysisByIdAndUser(req.params.id as string, req.userId!);
    if (!analysis) {
      throw new AppError(404, 'Analysis not found', 'ANALYSIS_NOT_FOUND');
    }

    if (analysis.status !== 'failed') {
      throw new AppError(400, 'Only failed analyses can be retried', 'ANALYSIS_NOT_FAILED');
    }

    await prisma.$transaction(async (tx) => {
      await tx.analysis.update({
        where: { id: analysis.id },
        data: {
          status: 'pending',
          overall_score: null,
          score_breakdown: Prisma.JsonNull,
          skill_gaps: Prisma.JsonNull,
          github_signals: Prisma.JsonNull,
          roadmap: null,
          resume_suggestions: null,
          token_usage: Prisma.JsonNull,
          completed_at: null,
        },
      });

      await tx.job.create({
        data: {
          type: 'run_analysis',
          payload: { analysis_id: analysis.id, user_id: req.userId! },
        },
      });
    });

    res.json({ message: 'Analysis requeued', status: 'pending' });
  } catch (err) {
    next(err);
  }
});

// GET /api/analyses/:id/stream — SSE for real-time status updates
router.get('/:id/stream', authMiddleware, async (req: AuthRequest, res) => {
  const analysisId = req.params.id as string;
  const userId = req.userId!;

  // Verify ownership
  const analysis = await findAnalysisByIdAndUser(analysisId, userId);
  if (!analysis) {
    res.status(404).json({ error: 'Analysis not found', code: 'ANALYSIS_NOT_FOUND' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  let lastStatus = analysis.status;

  // Send initial status
  res.write(`data: ${JSON.stringify({ id: analysis.id, status: analysis.status, overall_score: analysis.overall_score, completed_at: analysis.completed_at })}\n\n`);

  // If already terminal, close
  if (lastStatus === 'completed' || lastStatus === 'failed') {
    res.end();
    return;
  }

  const interval = setInterval(async () => {
    try {
      const current = await findAnalysisByIdAndUser(analysisId, userId);
      if (!current) {
        clearInterval(interval);
        res.end();
        return;
      }

      if (current.status !== lastStatus) {
        lastStatus = current.status;
        res.write(`data: ${JSON.stringify({ id: current.id, status: current.status, overall_score: current.overall_score, completed_at: current.completed_at })}\n\n`);
      }

      if (current.status === 'completed' || current.status === 'failed') {
        clearInterval(interval);
        res.end();
      }
    } catch {
      clearInterval(interval);
      res.end();
    }
  }, 2000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// DELETE /api/analyses/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const deleted = await deleteAnalysis(req.params.id as string, req.userId!);
    if (!deleted) {
      throw new AppError(404, 'Analysis not found', 'ANALYSIS_NOT_FOUND');
    }
    res.json({ message: 'Analysis deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /api/analyses/:id/share — generate a share token
router.post('/:id/share', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const analysis = await findAnalysisByIdAndUser(req.params.id as string, req.userId!);
    if (!analysis) {
      throw new AppError(404, 'Analysis not found', 'ANALYSIS_NOT_FOUND');
    }

    if (analysis.status !== 'completed') {
      throw new AppError(400, 'Only completed analyses can be shared', 'ANALYSIS_NOT_COMPLETED');
    }

    // If already shared, return existing token
    if (analysis.share_token) {
      res.json({ share_token: analysis.share_token });
      return;
    }

    const token = randomBytes(32).toString('hex');
    await prisma.analysis.update({
      where: { id: analysis.id },
      data: { share_token: token },
    });

    res.json({ share_token: token });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/analyses/:id/share — revoke share
router.delete('/:id/share', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const analysis = await findAnalysisByIdAndUser(req.params.id as string, req.userId!);
    if (!analysis) {
      throw new AppError(404, 'Analysis not found', 'ANALYSIS_NOT_FOUND');
    }

    await prisma.analysis.update({
      where: { id: analysis.id },
      data: { share_token: null },
    });

    res.json({ message: 'Share link revoked' });
  } catch (err) {
    next(err);
  }
});

// --- Notes CRUD ---

const noteSchema = z.object({
  content: z.string().min(1, 'Note cannot be empty').max(5000),
});

// GET /api/analyses/:id/notes
router.get('/:id/notes', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const analysis = await findAnalysisByIdAndUser(req.params.id as string, req.userId!);
    if (!analysis) {
      throw new AppError(404, 'Analysis not found', 'ANALYSIS_NOT_FOUND');
    }

    const notes = await prisma.analysisNote.findMany({
      where: { analysis_id: analysis.id, user_id: req.userId! },
      orderBy: { created_at: 'desc' },
    });

    res.json({ notes });
  } catch (err) {
    next(err);
  }
});

// POST /api/analyses/:id/notes
router.post('/:id/notes', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const analysis = await findAnalysisByIdAndUser(req.params.id as string, req.userId!);
    if (!analysis) {
      throw new AppError(404, 'Analysis not found', 'ANALYSIS_NOT_FOUND');
    }

    const body = noteSchema.parse(req.body);

    const note = await prisma.analysisNote.create({
      data: {
        analysis_id: analysis.id,
        user_id: req.userId!,
        content: body.content,
      },
    });

    res.status(201).json(note);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        error: 'ValidationError',
        message: err.errors.map((e) => e.message).join(', '),
        code: 'VALIDATION_ERROR',
        statusCode: 400,
      });
      return;
    }
    next(err);
  }
});

// PATCH /api/analyses/:id/notes/:noteId
router.patch('/:id/notes/:noteId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const body = noteSchema.parse(req.body);

    const note = await prisma.analysisNote.findFirst({
      where: {
        id: req.params.noteId as string,
        analysis_id: req.params.id as string,
        user_id: req.userId!,
      },
    });

    if (!note) {
      throw new AppError(404, 'Note not found', 'NOTE_NOT_FOUND');
    }

    const updated = await prisma.analysisNote.update({
      where: { id: note.id },
      data: { content: body.content, updated_at: new Date() },
    });

    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        error: 'ValidationError',
        message: err.errors.map((e) => e.message).join(', '),
        code: 'VALIDATION_ERROR',
        statusCode: 400,
      });
      return;
    }
    next(err);
  }
});

// DELETE /api/analyses/:id/notes/:noteId
router.delete('/:id/notes/:noteId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const note = await prisma.analysisNote.findFirst({
      where: {
        id: req.params.noteId as string,
        analysis_id: req.params.id as string,
        user_id: req.userId!,
      },
    });

    if (!note) {
      throw new AppError(404, 'Note not found', 'NOTE_NOT_FOUND');
    }

    await prisma.analysisNote.delete({ where: { id: note.id } });
    res.json({ message: 'Note deleted' });
  } catch (err) {
    next(err);
  }
});

export { router as analysesRouter };
