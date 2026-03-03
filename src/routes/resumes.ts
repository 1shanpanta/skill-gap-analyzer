import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { listSavedResumes, findResumeByIdAndUser, saveResume, deleteResume } from '../db/queries/resumes';

const router = Router();

const updateResumeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  is_saved: z.boolean().optional(),
});

// GET /api/resumes — list saved resumes
router.get('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const resumes = await listSavedResumes(req.userId!);
    res.json({
      resumes: resumes.map((r) => ({
        id: r.id,
        name: r.name,
        analysis_count: r._count.analyses,
        created_at: r.created_at,
        updated_at: r.updated_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/resumes/:id — get a single resume
router.get('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const resume = await findResumeByIdAndUser(req.params.id as string, req.userId!);
    if (!resume) {
      throw new AppError(404, 'Resume not found', 'RESUME_NOT_FOUND');
    }
    res.json({
      id: resume.id,
      name: resume.name,
      is_saved: resume.is_saved,
      raw_text: resume.raw_text,
      created_at: resume.created_at,
      updated_at: resume.updated_at,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/resumes/:id — update name or saved status
router.patch('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const body = updateResumeSchema.parse(req.body);
    const resume = await findResumeByIdAndUser(req.params.id as string, req.userId!);
    if (!resume) {
      throw new AppError(404, 'Resume not found', 'RESUME_NOT_FOUND');
    }

    await saveResume(req.params.id as string, req.userId!, body);
    res.json({ message: 'Resume updated' });
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

// DELETE /api/resumes/:id — delete or unsave a resume
router.delete('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const deleted = await deleteResume(req.params.id as string, req.userId!);
    if (!deleted) {
      throw new AppError(404, 'Resume not found', 'RESUME_NOT_FOUND');
    }
    res.json({ message: 'Resume deleted' });
  } catch (err) {
    next(err);
  }
});

export { router as resumesRouter };
