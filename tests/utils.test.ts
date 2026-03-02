import { describe, expect, test } from 'bun:test';
import { normalizeText } from '../src/utils/textNormalizer';
import { extractYearsOfExperience } from '../src/utils/experienceParser';
import { detectSeniority } from '../src/utils/seniorityDetector';

// ── Text Normalizer ──

describe('normalizeText', () => {
  test('lowercases text', () => {
    expect(normalizeText('Hello WORLD')).toBe('hello world');
  });

  test('collapses newlines to spaces', () => {
    expect(normalizeText('line1\nline2\r\nline3')).toBe('line1 line2 line3');
  });

  test('preserves hyphens, dots, slashes, plus, hash', () => {
    const result = normalizeText('C++ C# .NET node.js TCP/IP');
    expect(result).toContain('c++');
    expect(result).toContain('c#');
    expect(result).toContain('.net');
    expect(result).toContain('node.js');
    expect(result).toContain('tcp/ip');
  });

  test('strips special characters', () => {
    const result = normalizeText('skills: React, Vue & Angular!');
    // Commas, colons, ampersands, exclamation marks should be replaced with spaces
    expect(result).not.toContain(',');
    expect(result).not.toContain('&');
    expect(result).not.toContain('!');
  });

  test('collapses multiple spaces', () => {
    expect(normalizeText('too   many    spaces')).toBe('too many spaces');
  });

  test('trims leading/trailing whitespace', () => {
    expect(normalizeText('  padded  ')).toBe('padded');
  });

  test('handles empty string', () => {
    expect(normalizeText('')).toBe('');
  });
});

// ── Experience Parser ──

describe('extractYearsOfExperience', () => {
  test('extracts "X years of experience"', () => {
    expect(extractYearsOfExperience('I have 5 years of experience in web development')).toBe(5);
  });

  test('extracts "X+ years"', () => {
    expect(extractYearsOfExperience('Looking for 7+ years of backend experience')).toBe(7);
  });

  test('extracts "over X years"', () => {
    expect(extractYearsOfExperience('Over 10 years building distributed systems')).toBe(10);
  });

  test('returns max when multiple matches', () => {
    expect(extractYearsOfExperience('3 years React, 5 years JavaScript, 2 years Node')).toBe(5);
  });

  test('returns null when no experience found', () => {
    expect(extractYearsOfExperience('I like coding and building things')).toBeNull();
  });

  test('rejects unreasonable years (>50)', () => {
    expect(extractYearsOfExperience('Founded in 1975 with 60 years of history')).toBeNull();
  });

  test('handles "experience: X years"', () => {
    expect(extractYearsOfExperience('Experience: 8 years')).toBe(8);
  });
});

// ── Seniority Detector ──

describe('detectSeniority', () => {
  test('detects "senior" keyword', () => {
    expect(detectSeniority('Senior Software Engineer at Google', null)).toBe('senior');
  });

  test('detects "junior" keyword', () => {
    expect(detectSeniority('Junior Developer looking for first role', null)).toBe('junior');
  });

  test('detects "lead" keyword', () => {
    expect(detectSeniority('Lead Engineer, Platform Team', null)).toBe('lead');
  });

  test('detects "principal" keyword', () => {
    expect(detectSeniority('Principal Engineer at Amazon', null)).toBe('principal');
  });

  test('detects "staff engineer"', () => {
    expect(detectSeniority('Staff Engineer', null)).toBe('principal');
  });

  test('infers from experience years when no keyword', () => {
    expect(detectSeniority('Software Engineer', 1)).toBe('junior');
    expect(detectSeniority('Software Engineer', 3)).toBe('mid');
    expect(detectSeniority('Software Engineer', 6)).toBe('senior');
    expect(detectSeniority('Software Engineer', 9)).toBe('lead');
    expect(detectSeniority('Software Engineer', 15)).toBe('principal');
  });

  test('returns higher of keyword vs experience', () => {
    // "junior" keyword but 10 years experience → should be "lead"
    expect(detectSeniority('Junior Developer with 10 years experience', 10)).toBe('lead');
  });

  test('defaults to mid when nothing detected', () => {
    expect(detectSeniority('Software Engineer', null)).toBe('mid');
  });

  test('detects entry-level', () => {
    expect(detectSeniority('Entry-level position for new graduates', null)).toBe('junior');
  });
});
