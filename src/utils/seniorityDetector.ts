export type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'principal';

export const SENIORITY_LEVEL_MAP: Record<SeniorityLevel, number> = {
  junior: 1,
  mid: 2,
  senior: 3,
  lead: 4,
  principal: 5,
};

const SENIORITY_PATTERNS: { level: SeniorityLevel; patterns: RegExp[] }[] = [
  {
    level: 'principal',
    patterns: [/principal/i, /staff\s+engineer/i, /distinguished/i, /fellow/i],
  },
  {
    level: 'lead',
    patterns: [/\blead\b/i, /\barchitect\b/i, /head\s+of/i, /\bdirector\b/i, /engineering\s+manager/i, /vp\s+of/i],
  },
  {
    level: 'senior',
    patterns: [/\bsenior\b/i, /\bsr\.\s/i, /\bsr\s/i, /level\s*[45]/i],
  },
  {
    level: 'mid',
    patterns: [/mid[\s-]?level/i, /level\s*[23]/i, /[3-5]\+?\s*years/i],
  },
  {
    level: 'junior',
    patterns: [/\bjunior\b/i, /\bjr\.\s/i, /entry[\s-]?level/i, /\bintern\b/i, /[0-2]\s*years/i, /new\s+grad/i, /graduate/i],
  },
];

function inferFromExperience(years: number): SeniorityLevel {
  if (years >= 12) return 'principal';
  if (years >= 8) return 'lead';
  if (years >= 5) return 'senior';
  if (years >= 2) return 'mid';
  return 'junior';
}

export function detectSeniority(text: string, experienceYears: number | null): SeniorityLevel {
  let detectedLevel: SeniorityLevel | null = null;

  // Check patterns in order (highest seniority first)
  for (const { level, patterns } of SENIORITY_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        detectedLevel = level;
        break;
      }
    }
    if (detectedLevel) break;
  }

  const experienceLevel = experienceYears !== null ? inferFromExperience(experienceYears) : null;

  // Return the higher of pattern-detected vs experience-inferred
  if (detectedLevel && experienceLevel) {
    const detectedNum = SENIORITY_LEVEL_MAP[detectedLevel];
    const experienceNum = SENIORITY_LEVEL_MAP[experienceLevel];
    return detectedNum >= experienceNum ? detectedLevel : experienceLevel;
  }

  return detectedLevel ?? experienceLevel ?? 'mid';
}
