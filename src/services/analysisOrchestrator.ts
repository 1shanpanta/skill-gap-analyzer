import { Pool } from 'pg';
import {
  getAnalysisWithRelations,
  updateAnalysisStatus,
  completeAnalysis,
} from '../db/queries/analyses.js';
import { updateResumeExtractedData } from '../db/queries/resumes.js';
import { updateJDExtractedData } from '../db/queries/jobDescriptions.js';
import { extractSkillsFromResume, extractSkillsFromJD } from './skillExtractor.js';
import { calculateOverallScore, type GitHubSignals } from './scorer.js';
import { simulateEmailNotification } from './emailSimulator.js';

export async function runAnalysisPipeline(
  analysisId: string,
  pool: Pool
): Promise<{ success: true }> {
  const analysis = await getAnalysisWithRelations(pool, analysisId);
  if (!analysis) throw new Error(`Analysis ${analysisId} not found`);

  await updateAnalysisStatus(pool, analysisId, 'processing');

  try {
    // 1. Extract skills from resume
    const resumeData = extractSkillsFromResume(analysis.resume_raw_text);
    await updateResumeExtractedData(pool, analysis.resume_id, resumeData);

    // 2. Extract skills from JD
    const jdData = extractSkillsFromJD(analysis.jd_raw_text);
    await updateJDExtractedData(pool, analysis.job_description_id, jdData);

    // 3. GitHub signals (placeholder — real implementation in Phase 7)
    let githubSignals: GitHubSignals | null = null;
    if (analysis.github_url) {
      try {
        const { fetchGitHubSignals } = await import('./githubAnalyzer.js');
        githubSignals = await fetchGitHubSignals(analysis.github_url);
      } catch {
        // GitHub analysis is optional — continue without it
        console.warn(`GitHub analysis failed for ${analysis.github_url}, continuing without it`);
      }
    }

    // 4. Deterministic scoring
    const { overallScore, scoreBreakdown, skillGaps } = calculateOverallScore(
      resumeData,
      jdData,
      githubSignals
    );

    // 5. LLM: Roadmap (placeholder — real implementation in Phase 8)
    let roadmap = 'Roadmap generation pending — LLM integration not yet configured.';
    let resumeSuggestions = 'Resume suggestions pending — LLM integration not yet configured.';
    let tokenUsage: Record<string, any> = { total_tokens: 0, estimated_cost_usd: 0 };

    try {
      const { generateRoadmap } = await import('./roadmapGenerator.js');
      const roadmapResult = await generateRoadmap({
        missingRequired: skillGaps.missingRequired,
        missingPreferred: skillGaps.missingPreferred,
        currentSkills: resumeData.skills,
        targetRole: jdData.title ?? 'Software Engineer',
        seniorityLevel: jdData.seniority,
        overallScore,
      });
      roadmap = roadmapResult.roadmap;

      const { generateResumeSuggestions } = await import('./resumeSuggestions.js');
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
      // LLM calls are optional for now — continue with placeholders
      console.warn('LLM integration not available, using placeholder text');
    }

    // 6. Save results
    await completeAnalysis(pool, analysisId, {
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
    await updateAnalysisStatus(pool, analysisId, 'failed');
    throw err;
  }
}
