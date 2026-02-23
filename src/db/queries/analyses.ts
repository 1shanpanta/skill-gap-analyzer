import { prisma } from '../prisma';
import { Prisma } from '../../generated/prisma/client';

export interface AnalysisWithRelations {
  id: string;
  user_id: string;
  resume_id: string;
  job_description_id: string;
  status: string;
  overall_score: any;
  score_breakdown: any;
  skill_gaps: any;
  github_signals: any;
  roadmap: string | null;
  resume_suggestions: string | null;
  token_usage: any;
  github_url: string | null;
  created_at: Date;
  completed_at: Date | null;
  resume_raw_text: string;
  jd_raw_text: string;
  user_email: string;
}

export async function findAnalysisByIdAndUser(id: string, userId: string) {
  return prisma.analysis.findFirst({
    where: { id, user_id: userId },
  });
}

export async function getAnalysisWithRelations(analysisId: string): Promise<AnalysisWithRelations | null> {
  const result = await prisma.analysis.findUnique({
    where: { id: analysisId },
    include: {
      resume: { select: { raw_text: true } },
      job_description: { select: { raw_text: true } },
      user: { select: { email: true } },
    },
  });

  if (!result) return null;

  return {
    ...result,
    resume_raw_text: result.resume.raw_text,
    jd_raw_text: result.job_description.raw_text,
    user_email: result.user.email,
  } as AnalysisWithRelations;
}

export async function updateAnalysisStatus(id: string, status: string): Promise<void> {
  await prisma.analysis.update({
    where: { id },
    data: { status },
  });
}

export async function completeAnalysis(
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
  await prisma.analysis.update({
    where: { id },
    data: {
      status: 'completed',
      overall_score: data.overall_score,
      score_breakdown: data.score_breakdown,
      skill_gaps: data.skill_gaps,
      github_signals: data.github_signals ?? Prisma.JsonNull,
      roadmap: data.roadmap,
      resume_suggestions: data.resume_suggestions,
      token_usage: data.token_usage,
      completed_at: new Date(),
    },
  });
}

export async function listAnalysesByUser(
  userId: string,
  page: number,
  limit: number
) {
  const offset = (page - 1) * limit;

  const [analyses, total] = await Promise.all([
    prisma.analysis.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.analysis.count({ where: { user_id: userId } }),
  ]);

  return { analyses, total };
}
