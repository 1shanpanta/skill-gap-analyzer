import OpenAI from 'openai';
import { config } from '../config/index.js';
import { buildSkillExtractionPrompt } from '../prompts/skillExtraction.js';
import { getAllCanonicalNames, canonicalize } from '../taxonomy/skills.js';
import { trackTokens, type TokenUsage } from '../utils/tokenTracker.js';
import type { ExtractedResumeData, ExtractedJDData } from './skillExtractor.js';

const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

function parseSkillArray(raw: string): string[] {
  try {
    // Strip markdown code fences if the LLM wraps its response
    const cleaned = raw.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

function deduplicateInto(existingSkills: string[], newSkills: string[]): string[] {
  const existingLower = new Set(existingSkills.map((s) => s.toLowerCase()));
  const added: string[] = [];

  for (const skill of newSkills) {
    // Try to canonicalize the skill via the taxonomy
    const entry = canonicalize(skill);
    const resolved = entry ? entry.canonical : skill;

    if (!existingLower.has(resolved.toLowerCase())) {
      existingLower.add(resolved.toLowerCase());
      added.push(resolved);
    }
  }

  return added;
}

export async function enhanceWithLLM(
  resumeText: string,
  jdText: string,
  resumeData: ExtractedResumeData,
  jdData: ExtractedJDData
): Promise<{
  resumeData: ExtractedResumeData;
  jdData: ExtractedJDData;
  tokenUsage: TokenUsage;
}> {
  const canonicalNames = getAllCanonicalNames();

  const resumePrompt = buildSkillExtractionPrompt({
    rawText: resumeText,
    alreadyExtractedSkills: resumeData.skills,
    canonicalTaxonomyNames: canonicalNames,
    documentType: 'resume',
  });

  const jdPrompt = buildSkillExtractionPrompt({
    rawText: jdText,
    alreadyExtractedSkills: [...jdData.requiredSkills, ...jdData.preferredSkills],
    canonicalTaxonomyNames: canonicalNames,
    documentType: 'job_description',
  });

  // Call OpenAI in parallel for both documents
  const [resumeResponse, jdResponse] = await Promise.all([
    openai.chat.completions.create({
      model: config.OPENAI_MODEL,
      messages: [{ role: 'user', content: resumePrompt }],
      max_tokens: 500,
      temperature: 0.3,
    }),
    openai.chat.completions.create({
      model: config.OPENAI_MODEL,
      messages: [{ role: 'user', content: jdPrompt }],
      max_tokens: 500,
      temperature: 0.3,
    }),
  ]);

  // Track token usage for both calls
  const resumeTokens = trackTokens('llm_skill_extraction_resume', resumeResponse.usage, config.OPENAI_MODEL);
  const jdTokens = trackTokens('llm_skill_extraction_jd', jdResponse.usage, config.OPENAI_MODEL);

  // Parse LLM responses
  const resumeRaw = resumeResponse.choices[0]?.message?.content ?? '[]';
  const jdRaw = jdResponse.choices[0]?.message?.content ?? '[]';

  const newResumeSkills = parseSkillArray(resumeRaw);
  const newJDSkills = parseSkillArray(jdRaw);

  // Deduplicate and merge into resume skills
  const addedResumeSkills = deduplicateInto(resumeData.skills, newResumeSkills);
  const updatedResumeData: ExtractedResumeData = {
    ...resumeData,
    skills: [...resumeData.skills, ...addedResumeSkills],
  };

  // Deduplicate and merge into JD required skills
  const allJDSkills = [...jdData.requiredSkills, ...jdData.preferredSkills];
  const addedJDSkills = deduplicateInto(allJDSkills, newJDSkills);
  const updatedJDData: ExtractedJDData = {
    ...jdData,
    requiredSkills: [...jdData.requiredSkills, ...addedJDSkills],
  };

  // Aggregate token usage
  const aggregatedTokenUsage: TokenUsage = {
    step: 'llm_skill_extraction',
    prompt_tokens: resumeTokens.prompt_tokens + jdTokens.prompt_tokens,
    completion_tokens: resumeTokens.completion_tokens + jdTokens.completion_tokens,
    total_tokens: resumeTokens.total_tokens + jdTokens.total_tokens,
    model: config.OPENAI_MODEL,
    estimated_cost_usd:
      Math.round(
        (resumeTokens.estimated_cost_usd + jdTokens.estimated_cost_usd) * 1_000_000
      ) / 1_000_000,
  };

  return {
    resumeData: updatedResumeData,
    jdData: updatedJDData,
    tokenUsage: aggregatedTokenUsage,
  };
}
