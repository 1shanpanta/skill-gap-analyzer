const EXPERIENCE_PATTERNS: RegExp[] = [
  /(\d{1,2})\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)?/gi,
  /(?:experience|exp)\s*(?:of|:)?\s*(\d{1,2})\+?\s*(?:years?|yrs?)/gi,
  /(?:over|more than|at least|approximately|about)\s*(\d{1,2})\s*(?:years?|yrs?)/gi,
];

export function extractYearsOfExperience(text: string): number | null {
  const allYears: number[] = [];

  for (const pattern of EXPERIENCE_PATTERNS) {
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const years = parseInt(match[1], 10);
      if (years >= 0 && years <= 50) {
        allYears.push(years);
      }
    }
  }

  if (allYears.length === 0) return null;

  // Return the maximum years found (most likely the total experience)
  return Math.max(...allYears);
}
