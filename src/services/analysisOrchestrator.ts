import {
  getAnalysisWithRelations,
  updateAnalysisStatus,
  completeAnalysis,
} from '../db/queries/analyses';
import { updateResumeExtractedData } from '../db/queries/resumes';
import { updateJDExtractedData } from '../db/queries/jobDescriptions';
import { extractSkillsFromResume, extractSkillsFromJD } from './skillExtractor';
import { calculateOverallScore, type GitHubSignals } from './scorer';
import { simulateEmailNotification } from './emailSimulator';
import { config } from '../config/index';
import { logger } from '../lib/logger';

export async function runAnalysisPipeline(
  analysisId: string
): Promise<{ success: true }> {
  const analysis = await getAnalysisWithRelations(analysisId);
  if (!analysis) throw new Error(`Analysis ${analysisId} not found`);

  await updateAnalysisStatus(analysisId, 'processing');

  try {
    // 1. Extract skills from resume
    let resumeData = extractSkillsFromResume(analysis.resume_raw_text);
    await updateResumeExtractedData(analysis.resume_id, resumeData);

    // 2. Extract skills from JD
    let jdData = extractSkillsFromJD(analysis.jd_raw_text);
    await updateJDExtractedData(analysis.job_description_id, jdData);

    // 2.5. LLM-enhanced skill extraction (if enabled)
    if (config.ENABLE_LLM_SKILL_EXTRACTION) {
      try {
        const { enhanceWithLLM } = await import('./llmSkillExtractor');
        const enhanced = await enhanceWithLLM(
          analysis.resume_raw_text,
          analysis.jd_raw_text,
          resumeData,
          jdData
        );
        resumeData = enhanced.resumeData;
        jdData = enhanced.jdData;
      } catch {
        logger.warn({ analysisId }, 'LLM skill extraction failed, continuing with deterministic only');
      }
    }

    // 3. GitHub signals
    let githubSignals: GitHubSignals | null = null;
    if (analysis.github_url) {
      try {
        const { fetchGitHubSignals } = await import('./githubAnalyzer');
        githubSignals = await fetchGitHubSignals(analysis.github_url);
      } catch {
        logger.warn({ analysisId, githubUrl: analysis.github_url }, 'GitHub analysis failed, continuing without it');
      }
    }

    // 4. Deterministic scoring
    const { overallScore, scoreBreakdown, skillGaps } = calculateOverallScore(
      resumeData,
      jdData,
      githubSignals
    );

    // 5. LLM: Roadmap & resume suggestions
    let roadmap = 'Roadmap generation pending — LLM integration not yet configured.';
    let resumeSuggestions = 'Resume suggestions pending — LLM integration not yet configured.';
    let tokenUsage: Record<string, any> = { total_tokens: 0, estimated_cost_usd: 0 };

    try {
      const { generateRoadmap } = await import('./roadmapGenerator');
      const roadmapResult = await generateRoadmap({
        missingRequired: skillGaps.missingRequired,
        missingPreferred: skillGaps.missingPreferred,
        currentSkills: resumeData.skills,
        targetRole: jdData.title ?? 'Software Engineer',
        seniorityLevel: jdData.seniority,
        overallScore,
      });
      roadmap = roadmapResult.roadmap;

      const { generateResumeSuggestions } = await import('./resumeSuggestions');
      const suggestionsResult = await generateResumeSuggestions({
        resumeText: analysis.resume_raw_text,
        jobDescriptionText: analysis.jd_raw_text,
        missingSkills: [...skillGaps.missingRequired, ...skillGaps.missingPreferred],
        matchedSkills: skillGaps.matchedSkills,
        overallScore,
      });
      resumeSuggestions = suggestionsResult.suggestions;

      tokenUsage = {
        roadmap: roadmapResult.tokenUsage,
        resume_suggestions: suggestionsResult.tokenUsage,
        total_tokens: roadmapResult.tokenUsage.total_tokens + suggestionsResult.tokenUsage.total_tokens,
        estimated_cost_usd: roadmapResult.tokenUsage.estimated_cost_usd + suggestionsResult.tokenUsage.estimated_cost_usd,
      };
    } catch {
      logger.warn({ analysisId }, 'LLM integration not available, using placeholder text');
    }

    // 6. Save results
    await completeAnalysis(analysisId, {
      overall_score: overallScore,
      score_breakdown: scoreBreakdown,
      skill_gaps: skillGaps,
      github_signals: githubSignals,
      roadmap,
      resume_suggestions: resumeSuggestions,
      token_usage: tokenUsage,
    });

    // 7. Simulate email
    simulateEmailNotification(analysis.user_email, analysisId, overallScore);

    return { success: true };
  } catch (err) {
    await updateAnalysisStatus(analysisId, 'failed');
    throw err;
  }
}
