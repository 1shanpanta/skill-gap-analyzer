export interface RoadmapPromptData {
  missingRequired: string[];
  missingPreferred: string[];
  currentSkills: string[];
  targetRole: string;
  seniorityLevel: string;
  overallScore: number;
}

export function buildRoadmapPrompt(data: RoadmapPromptData): string {
  return `You are a career development advisor specializing in technology roles.

## Context
A candidate is applying for a **${data.targetRole}** position (${data.seniorityLevel} level).
Their current alignment score is **${data.overallScore}/100**.

## Candidate's Current Skills
${data.currentSkills.map((s) => `- ${s}`).join('\n')}

## Missing Required Skills (High Priority)
${data.missingRequired.length > 0 ? data.missingRequired.map((s) => `- ${s}`).join('\n') : '- None (all required skills present)'}

## Missing Preferred Skills (Medium Priority)
${data.missingPreferred.length > 0 ? data.missingPreferred.map((s) => `- ${s}`).join('\n') : '- None'}

## Instructions
Generate a structured 30-60-90 day learning roadmap to close the skill gaps above.
For each skill gap:
1. Recommend ONE specific free or affordable learning resource (course, tutorial, documentation).
2. Suggest a small project or exercise to demonstrate the skill.
3. Estimate hours needed to reach a competent level.

Format the response as:

### Week 1-4 (Days 1-30): Foundation
[Focus on the most critical missing required skills]

### Week 5-8 (Days 31-60): Deepening
[Build on foundations + start preferred skills]

### Week 9-12 (Days 61-90): Portfolio & Practice
[Build portfolio projects + interview preparation]

Keep recommendations practical and actionable. Prefer free resources. Total response under 1500 words.`;
}
