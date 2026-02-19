import { normalizeText } from '../utils/textNormalizer.js';
import { extractYearsOfExperience } from '../utils/experienceParser.js';
import { detectSeniority, type SeniorityLevel } from '../utils/seniorityDetector.js';
import { SKILL_TAXONOMY, type SkillCategory, type TaxonomyEntry } from '../taxonomy/skills.js';

// ── Types ──

export interface ExtractedResumeData {
  skills: string[];
  skillCategories: Record<string, string[]>;
  experienceYears: number | null;
  seniority: SeniorityLevel;
  softSkills: string[];
  certifications: string[];
  educationText: string | null;
}

export interface ExtractedJDData {
  title: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  seniority: SeniorityLevel;
  softSkills: string[];
  educationKeywords: string[];
}

// ── Helpers ──

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractSkillsFromText(text: string): { skills: string[]; softSkills: string[]; categories: Record<string, string[]> } {
  const normalized = normalizeText(text);
  const skills = new Set<string>();
  const softSkills: string[] = [];
  const categories: Record<string, string[]> = {};

  for (const entry of SKILL_TAXONOMY) {
    let matched = false;
    for (const synonym of entry.synonyms) {
      const regex = new RegExp(`\\b${escapeRegex(synonym)}\\b`, 'i');
      if (regex.test(normalized)) {
        matched = true;
        break;
      }
    }

    if (matched) {
      if (entry.category === 'soft_skill') {
        if (!softSkills.includes(entry.canonical)) {
          softSkills.push(entry.canonical);
        }
      } else {
        skills.add(entry.canonical);
        const cat = entry.category;
        if (!categories[cat]) categories[cat] = [];
        if (!categories[cat].includes(entry.canonical)) {
          categories[cat].push(entry.canonical);
        }
      }
    }
  }

  return { skills: Array.from(skills), softSkills, categories };
}

// ── Certifications ──

const CERTIFICATION_PATTERNS = [
  /aws\s+certified/gi,
  /google\s+cloud\s+certified/gi,
  /azure\s+certified/gi,
  /certified\s+kubernetes/gi,
  /pmp/gi,
  /scrum\s+master/gi,
  /cissp/gi,
  /comptia/gi,
  /oracle\s+certified/gi,
  /cisco\s+certified/gi,
  /ccna/gi,
  /ccnp/gi,
  /cka/gi,
  /ckad/gi,
];

function extractCertifications(text: string): string[] {
  const certs: string[] = [];
  for (const pattern of CERTIFICATION_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      certs.push(pattern.source.replace(/\\s\+/g, ' ').replace(/\\/g, ''));
    }
  }
  return certs;
}

// ── Education ──

function extractEducationSection(text: string): string | null {
  const educationPattern = /(?:education|academic|degree|university|college|bachelor|master|phd|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?)[\s\S]{0,500}/i;
  const match = text.match(educationPattern);
  return match ? match[0].trim().slice(0, 500) : null;
}

const EDUCATION_KEYWORDS = [
  'bachelor', 'master', 'phd', 'doctorate', 'associate',
  'b.s.', 'bs', 'm.s.', 'ms', 'b.a.', 'ba', 'm.a.', 'ma', 'mba',
  'computer science', 'software engineering', 'information technology',
  'electrical engineering', 'mathematics', 'physics', 'data science',
];

function extractEducationKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return EDUCATION_KEYWORDS.filter((kw) => lower.includes(kw));
}

// ── JD Section Splitting ──

function splitJDSections(text: string): { requiredSection: string | null; preferredSection: string | null } {
  const requiredPattern = /(?:requirements?|required|must\s+have|qualifications?|what\s+you.+?need|minimum\s+qualifications?)[:\s]/i;
  const preferredPattern = /(?:nice\s+to\s+have|preferred|bonus|plus|desired|optional|additional|ideally)[:\s]/i;

  const reqIdx = text.search(requiredPattern);
  const prefIdx = text.search(preferredPattern);

  if (reqIdx === -1 && prefIdx === -1) {
    return { requiredSection: null, preferredSection: null };
  }

  if (reqIdx !== -1 && prefIdx !== -1 && reqIdx < prefIdx) {
    return {
      requiredSection: text.slice(reqIdx, prefIdx),
      preferredSection: text.slice(prefIdx),
    };
  }

  if (reqIdx !== -1 && (prefIdx === -1 || reqIdx < prefIdx)) {
    return {
      requiredSection: text.slice(reqIdx),
      preferredSection: prefIdx !== -1 ? text.slice(prefIdx) : null,
    };
  }

  return {
    requiredSection: null,
    preferredSection: text.slice(prefIdx),
  };
}

function extractJobTitle(text: string): string | null {
  // Try to get the first non-empty line as the job title
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length > 0 && lines[0].length < 100) {
    return lines[0];
  }
  return null;
}

// ── Exports ──

export function extractSkillsFromResume(rawText: string): ExtractedResumeData {
  const { skills, softSkills, categories } = extractSkillsFromText(rawText);
  const experienceYears = extractYearsOfExperience(rawText);
  const seniority = detectSeniority(rawText, experienceYears);

  return {
    skills,
    skillCategories: categories,
    experienceYears,
    seniority,
    softSkills,
    certifications: extractCertifications(rawText),
    educationText: extractEducationSection(rawText),
  };
}

export function extractSkillsFromJD(rawText: string): ExtractedJDData {
  const { requiredSection, preferredSection } = splitJDSections(rawText);

  let requiredSkills: string[];
  let preferredSkills: string[];

  if (requiredSection || preferredSection) {
    requiredSkills = requiredSection
      ? extractSkillsFromText(requiredSection).skills
      : [];
    preferredSkills = preferredSection
      ? extractSkillsFromText(preferredSection).skills
      : [];
  } else {
    // No sections detected — treat all skills as required
    requiredSkills = extractSkillsFromText(rawText).skills;
    preferredSkills = [];
  }

  const { softSkills } = extractSkillsFromText(rawText);
  const seniority = detectSeniority(rawText, null);

  return {
    title: extractJobTitle(rawText),
    requiredSkills,
    preferredSkills,
    seniority,
    softSkills,
    educationKeywords: extractEducationKeywords(rawText),
  };
}
