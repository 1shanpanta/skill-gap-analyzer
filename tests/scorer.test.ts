import { describe, expect, test } from 'bun:test';
import { calculateOverallScore, type GitHubSignals } from '../src/services/scorer';
import type { ExtractedResumeData, ExtractedJDData } from '../src/services/skillExtractor';

// ── Helper factories ──

function makeResumeData(overrides: Partial<ExtractedResumeData> = {}): ExtractedResumeData {
  return {
    skills: ['JavaScript', 'TypeScript', 'React', 'Node', 'PostgreSQL'],
    skillCategories: { language: ['JavaScript', 'TypeScript'], framework: ['React', 'Node'], database: ['PostgreSQL'] },
    experienceYears: 5,
    seniority: 'senior',
    softSkills: ['Communication', 'Teamwork'],
    certifications: [],
    educationText: 'BS in Computer Science',
    ...overrides,
  };
}

function makeJDData(overrides: Partial<ExtractedJDData> = {}): ExtractedJDData {
  return {
    title: 'Senior Frontend Engineer',
    requiredSkills: ['JavaScript', 'TypeScript', 'React'],
    preferredSkills: ['Node', 'Docker'],
    seniority: 'senior',
    softSkills: ['Communication'],
    educationKeywords: ['bachelor', 'computer science'],
    ...overrides,
  };
}

// ── Scoring Tests ──

describe('calculateOverallScore', () => {
  test('returns score between 0 and 100', () => {
    const result = calculateOverallScore(makeResumeData(), makeJDData(), null);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  test('perfect match yields high score', () => {
    const resume = makeResumeData({
      skills: ['JavaScript', 'TypeScript', 'React', 'Node', 'Docker'],
      seniority: 'senior',
    });
    const jd = makeJDData({
      requiredSkills: ['JavaScript', 'TypeScript', 'React'],
      preferredSkills: ['Node', 'Docker'],
      seniority: 'senior',
    });
    const result = calculateOverallScore(resume, jd, null);
    expect(result.overallScore).toBeGreaterThan(75);
  });

  test('no skill overlap yields low score', () => {
    const resume = makeResumeData({
      skills: ['Python', 'Django', 'Flask'],
      seniority: 'junior',
    });
    const jd = makeJDData({
      requiredSkills: ['JavaScript', 'React', 'TypeScript'],
      preferredSkills: ['Vue', 'Angular'],
      seniority: 'senior',
    });
    const result = calculateOverallScore(resume, jd, null);
    expect(result.overallScore).toBeLessThan(40);
  });

  test('score breakdown sums to weighted total', () => {
    const result = calculateOverallScore(makeResumeData(), makeJDData(), null);
    const bd = result.scoreBreakdown;
    const w = bd.weights_used;
    const expectedTotal =
      (w.skill ?? w['skill']) * bd.skill_match +
      (w.seniority ?? w['seniority']) * bd.seniority_alignment +
      (w.github ?? w['github']) * bd.github_signal +
      (w.bonus ?? w['bonus']) * bd.bonus_factors;
    // Allow small floating point difference
    expect(Math.abs(bd.weighted_total - Math.round(expectedTotal * 100) / 100)).toBeLessThan(1);
  });

  test('uses correct weights without GitHub', () => {
    const result = calculateOverallScore(makeResumeData(), makeJDData(), null);
    expect(result.scoreBreakdown.weights_used.skill).toBe(0.55);
    expect(result.scoreBreakdown.weights_used.seniority).toBe(0.30);
    expect(result.scoreBreakdown.weights_used.github).toBe(0.00);
    expect(result.scoreBreakdown.weights_used.bonus).toBe(0.15);
  });

  test('uses correct weights with GitHub', () => {
    const github: GitHubSignals = {
      username: 'testuser',
      publicRepoCount: 20,
      followers: 50,
      topLanguages: ['JavaScript', 'TypeScript'],
      lastPushDate: new Date().toISOString(),
      starredRepoCount: 3,
      hasDescriptiveRepos: true,
      hasForkedRepos: true,
      recentlyActive: true,
      profileBio: 'Full stack dev',
    };
    const result = calculateOverallScore(makeResumeData(), makeJDData(), github);
    expect(result.scoreBreakdown.weights_used.skill).toBe(0.45);
    expect(result.scoreBreakdown.weights_used.github).toBe(0.20);
  });

  test('skill_match is 100 when all required + preferred matched', () => {
    const resume = makeResumeData({
      skills: ['JavaScript', 'TypeScript', 'React', 'Node', 'Docker'],
    });
    const jd = makeJDData({
      requiredSkills: ['JavaScript', 'TypeScript', 'React'],
      preferredSkills: ['Node', 'Docker'],
    });
    const result = calculateOverallScore(resume, jd, null);
    expect(result.scoreBreakdown.skill_match).toBe(100);
  });

  test('skillGaps lists missing required skills', () => {
    const resume = makeResumeData({ skills: ['JavaScript'] });
    const jd = makeJDData({ requiredSkills: ['JavaScript', 'TypeScript', 'React'] });
    const result = calculateOverallScore(resume, jd, null);
    // TypeScript gets partial match (same js-ecosystem relatedGroup), only React is truly missing
    expect(result.skillGaps.missingRequired).toContain('React');
    expect(result.skillGaps.matchedSkills).toContain('JavaScript');
    expect(result.skillGaps.partialMatches.some((p) => p.skill === 'TypeScript')).toBe(true);
  });

  test('skillGaps lists extra skills', () => {
    const resume = makeResumeData({ skills: ['JavaScript', 'Python', 'Go'] });
    const jd = makeJDData({ requiredSkills: ['JavaScript'], preferredSkills: [] });
    const result = calculateOverallScore(resume, jd, null);
    expect(result.skillGaps.extraSkills).toContain('Python');
    expect(result.skillGaps.extraSkills).toContain('Go');
  });

  test('seniority alignment is 100 for exact match', () => {
    const resume = makeResumeData({ seniority: 'senior' });
    const jd = makeJDData({ seniority: 'senior' });
    const result = calculateOverallScore(resume, jd, null);
    expect(result.scoreBreakdown.seniority_alignment).toBe(100);
  });

  test('seniority mismatch reduces seniority score', () => {
    const resume = makeResumeData({ seniority: 'junior' });
    const jd = makeJDData({ seniority: 'senior' });
    const result = calculateOverallScore(resume, jd, null);
    expect(result.scoreBreakdown.seniority_alignment).toBeLessThan(100);
  });

  test('GitHub score is 0 when no GitHub provided', () => {
    const result = calculateOverallScore(makeResumeData(), makeJDData(), null);
    expect(result.scoreBreakdown.github_signal).toBe(0);
  });

  test('handles empty skills lists', () => {
    const resume = makeResumeData({ skills: [] });
    const jd = makeJDData({ requiredSkills: [], preferredSkills: [] });
    const result = calculateOverallScore(resume, jd, null);
    // Should return a valid score even with empty inputs
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });
});
