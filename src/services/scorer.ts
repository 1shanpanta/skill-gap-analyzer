import { canonicalize, hasExactMatch, hasPartialMatch } from '../taxonomy/skills.js';
import { SENIORITY_LEVEL_MAP, type SeniorityLevel } from '../utils/seniorityDetector.js';
import type { ExtractedResumeData, ExtractedJDData } from './skillExtractor.js';

// ── Types ──

export interface SkillMatchDetails {
  matchedSkills: string[];
  missingRequired: string[];
  missingPreferred: string[];
  partialMatches: { skill: string; candidateHas: string; matchStrength: 'partial' }[];
  extraSkills: string[];
}

export interface ScoreBreakdown {
  skill_match: number;
  seniority_alignment: number;
  github_signal: number;
  bonus_factors: number;
  weights_used: Record<string, number>;
  weighted_total: number;
}

export interface ScoringResult {
  overallScore: number;
  scoreBreakdown: ScoreBreakdown;
  skillGaps: SkillMatchDetails;
}

// ── Weights ──

const WEIGHTS_WITH_GITHUB = { skill: 0.45, seniority: 0.25, github: 0.20, bonus: 0.10 };
const WEIGHTS_WITHOUT_GITHUB = { skill: 0.55, seniority: 0.30, github: 0.00, bonus: 0.15 };

// ── Skill Match Score (0-100) ──

const REQUIRED_WEIGHT = 2.0;
const PREFERRED_WEIGHT = 1.0;

function calculateSkillMatchScore(
  resumeSkills: string[],
  requiredSkills: string[],
  preferredSkills: string[]
): { score: number; details: SkillMatchDetails } {
  let earnedPoints = 0;
  let maxPoints = 0;

  const matchedSkills: string[] = [];
  const missingRequired: string[] = [];
  const missingPreferred: string[] = [];
  const partialMatches: SkillMatchDetails['partialMatches'] = [];

  // Required skills
  for (const skill of requiredSkills) {
    maxPoints += REQUIRED_WEIGHT;
    if (hasExactMatch(resumeSkills, skill)) {
      earnedPoints += REQUIRED_WEIGHT;
      matchedSkills.push(skill);
    } else if (hasPartialMatch(resumeSkills, skill)) {
      earnedPoints += REQUIRED_WEIGHT * 0.5;
      const partialCandidate = findPartialCandidate(resumeSkills, skill);
      partialMatches.push({ skill, candidateHas: partialCandidate, matchStrength: 'partial' });
    } else {
      missingRequired.push(skill);
    }
  }

  // Preferred skills
  for (const skill of preferredSkills) {
    maxPoints += PREFERRED_WEIGHT;
    if (hasExactMatch(resumeSkills, skill)) {
      earnedPoints += PREFERRED_WEIGHT;
      matchedSkills.push(skill);
    } else if (hasPartialMatch(resumeSkills, skill)) {
      earnedPoints += PREFERRED_WEIGHT * 0.5;
      const partialCandidate = findPartialCandidate(resumeSkills, skill);
      partialMatches.push({ skill, candidateHas: partialCandidate, matchStrength: 'partial' });
    } else {
      missingPreferred.push(skill);
    }
  }

  // Extra skills the candidate has beyond JD requirements
  const allJDSkills = [...requiredSkills, ...preferredSkills];
  const extraSkills = resumeSkills.filter(
    (s) => !hasExactMatch(allJDSkills, s) && !allJDSkills.some((jd) => hasPartialMatch([s], jd))
  );

  const score = maxPoints === 0 ? 50 : Math.min(Math.round((earnedPoints / maxPoints) * 100 * 100) / 100, 100);

  return {
    score,
    details: { matchedSkills, missingRequired, missingPreferred, partialMatches, extraSkills },
  };
}

function findPartialCandidate(candidateSkills: string[], targetSkill: string): string {
  const targetEntry = canonicalize(targetSkill);
  if (!targetEntry?.relatedGroup) return '';
  for (const s of candidateSkills) {
    const entry = canonicalize(s);
    if (entry?.relatedGroup === targetEntry.relatedGroup && entry?.canonical !== targetEntry.canonical) {
      return entry.canonical;
    }
  }
  return '';
}

// ── Seniority Alignment Score (0-100) ──

const SENIORITY_SCORE_MAP: Record<number, number> = {
  0: 100,
  1: 75,
  2: 40,
  3: 10,
  4: 5,
};

function calculateSeniorityScore(resumeSeniority: SeniorityLevel, jdSeniority: SeniorityLevel): number {
  const resumeLevel = SENIORITY_LEVEL_MAP[resumeSeniority] ?? 2;
  const jdLevel = SENIORITY_LEVEL_MAP[jdSeniority] ?? 2;
  const diff = Math.abs(resumeLevel - jdLevel);
  return SENIORITY_SCORE_MAP[diff] ?? 5;
}

// ── GitHub Signal Score (0-100) ──

export interface GitHubSignals {
  username: string;
  publicRepoCount: number;
  followers: number;
  topLanguages: string[];
  lastPushDate: string | null;
  starredRepoCount: number;
  hasDescriptiveRepos: boolean;
  hasForkedRepos: boolean;
  recentlyActive: boolean;
  profileBio: string | null;
}

function calculateGitHubScore(signals: GitHubSignals, jdSkills: string[]): number {
  let score = 0;

  // 1. Activity recency (0-25)
  if (signals.lastPushDate) {
    const daysSinceLastPush = Math.floor(
      (Date.now() - new Date(signals.lastPushDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastPush <= 30) score += 25;
    else if (daysSinceLastPush <= 90) score += 20;
    else if (daysSinceLastPush <= 180) score += 10;
  }

  // 2. Language relevance (0-35)
  const langOverlap = signals.topLanguages.filter((lang) =>
    jdSkills.some((skill) => {
      const entry = canonicalize(skill);
      const langEntry = canonicalize(lang);
      return entry && langEntry && (entry.canonical === langEntry.canonical || entry.relatedGroup === langEntry.relatedGroup);
    })
  ).length;
  const langScore = Math.round((langOverlap / Math.max(signals.topLanguages.length, 1)) * 35);
  score += langScore;

  // 3. Repo quality signals (0-25)
  score += Math.min(signals.starredRepoCount * 5, 15);
  score += signals.hasDescriptiveRepos ? 5 : 0;
  score += signals.hasForkedRepos ? 5 : 0;

  // 4. Contribution volume (0-15)
  if (signals.publicRepoCount >= 16) score += 15;
  else if (signals.publicRepoCount >= 6) score += 10;
  else if (signals.publicRepoCount >= 1) score += 5;

  return Math.min(score, 100);
}

// ── Bonus Factors (0-100) ──

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) ?? [];
  return [...new Set(words)];
}

function calculateBonusScore(resumeData: ExtractedResumeData, jdData: ExtractedJDData): number {
  let score = 0;

  // 1. Education match (0-20)
  if (jdData.educationKeywords.length > 0) {
    const eduMatch = jdData.educationKeywords.some((kw) =>
      resumeData.educationText?.toLowerCase().includes(kw.toLowerCase())
    );
    score += eduMatch ? 20 : 0;
  } else {
    score += 10; // neutral bonus when no education req
  }

  // 2. Certification overlap (0-20)
  const certOverlap = resumeData.certifications.filter((cert) =>
    jdData.requiredSkills.concat(jdData.preferredSkills).some((s) =>
      cert.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(cert.toLowerCase())
    )
  ).length;
  score += Math.min(certOverlap * 10, 20);

  // 3. Soft skills match (0-20)
  const softSkillOverlap = resumeData.softSkills.filter((skill) =>
    jdData.softSkills.includes(skill)
  ).length;
  score += Math.min(softSkillOverlap * 5, 20);

  // 4. Keyword density (0-20)
  const jdKeywords = extractKeywords(jdData.requiredSkills.join(' ') + ' ' + jdData.preferredSkills.join(' '));
  const resumeText = resumeData.skills.join(' ').toLowerCase();
  const matchCount = jdKeywords.filter((kw) => resumeText.includes(kw)).length;
  const density = matchCount / Math.max(jdKeywords.length, 1);
  score += Math.round(density * 20);

  // 5. Extra skills breadth (0-20)
  // Calculated later in overall score since we need skill gap data
  score += 0; // placeholder — filled in calculateOverallScore

  return Math.min(score, 100);
}

// ── Main Scoring Function ──

export function calculateOverallScore(
  resumeData: ExtractedResumeData,
  jdData: ExtractedJDData,
  githubSignals: GitHubSignals | null
): ScoringResult {
  const hasGithub = githubSignals !== null;
  const weights = hasGithub ? WEIGHTS_WITH_GITHUB : WEIGHTS_WITHOUT_GITHUB;

  // Skill match
  const skillResult = calculateSkillMatchScore(resumeData.skills, jdData.requiredSkills, jdData.preferredSkills);

  // Seniority alignment
  const seniorityScore = calculateSeniorityScore(resumeData.seniority, jdData.seniority);

  // GitHub signal
  const githubScore = hasGithub
    ? calculateGitHubScore(githubSignals!, [...jdData.requiredSkills, ...jdData.preferredSkills])
    : 0;

  // Bonus factors
  let bonusScore = calculateBonusScore(resumeData, jdData);
  // Add extra skills breadth bonus (0-20)
  bonusScore += Math.min(skillResult.details.extraSkills.length * 2, 20);
  bonusScore = Math.min(bonusScore, 100);

  // Weighted total
  const overallScore = Math.round(
    ((weights.skill * skillResult.score) +
    (weights.seniority * seniorityScore) +
    (weights.github * githubScore) +
    (weights.bonus * bonusScore)) * 100
  ) / 100;

  return {
    overallScore: Math.min(overallScore, 100),
    scoreBreakdown: {
      skill_match: skillResult.score,
      seniority_alignment: seniorityScore,
      github_signal: githubScore,
      bonus_factors: bonusScore,
      weights_used: weights,
      weighted_total: Math.min(overallScore, 100),
    },
    skillGaps: skillResult.details,
  };
}
