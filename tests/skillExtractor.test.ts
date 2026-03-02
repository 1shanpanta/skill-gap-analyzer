import { describe, expect, test } from 'bun:test';
import { extractSkillsFromResume, extractSkillsFromJD } from '../src/services/skillExtractor';

// ── Resume Skill Extraction ──

describe('extractSkillsFromResume', () => {
  const sampleResume = `
    Senior Full Stack Developer
    8 years of experience building web applications.

    Skills: JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, MongoDB, Docker, AWS, Git
    Experience with CI/CD pipelines, REST APIs, GraphQL, and microservices architecture.
    Familiar with Agile methodologies and Scrum.

    Education: BS in Computer Science from MIT

    Certifications: AWS Certified Solutions Architect
  `;

  test('extracts known skills from taxonomy', () => {
    const result = extractSkillsFromResume(sampleResume);
    expect(result.skills).toContain('JavaScript');
    expect(result.skills).toContain('TypeScript');
    expect(result.skills).toContain('React');
    expect(result.skills).toContain('PostgreSQL');
    expect(result.skills).toContain('Docker');
    expect(result.skills).toContain('AWS');
  });

  test('extracts experience years', () => {
    const result = extractSkillsFromResume(sampleResume);
    expect(result.experienceYears).toBe(8);
  });

  test('detects seniority level', () => {
    const result = extractSkillsFromResume(sampleResume);
    // "Senior" keyword = senior, but 8 years experience = lead; code returns higher
    expect(result.seniority).toBe('lead');
  });

  test('extracts certifications', () => {
    const result = extractSkillsFromResume(sampleResume);
    expect(result.certifications.length).toBeGreaterThan(0);
  });

  test('extracts education text', () => {
    const result = extractSkillsFromResume(sampleResume);
    expect(result.educationText).not.toBeNull();
    expect(result.educationText!.toLowerCase()).toContain('computer science');
  });

  test('extracts soft skills', () => {
    const resumeWithSoftSkills = `
      Software Engineer with strong communication, teamwork, and leadership skills.
      JavaScript, Python, React.
    `;
    const result = extractSkillsFromResume(resumeWithSoftSkills);
    expect(result.softSkills.length).toBeGreaterThan(0);
  });

  test('handles empty resume', () => {
    const result = extractSkillsFromResume('');
    expect(result.skills).toEqual([]);
    expect(result.experienceYears).toBeNull();
  });

  test('deduplicates skills', () => {
    const resume = 'JavaScript js JavaScript ecmascript React reactjs React';
    const result = extractSkillsFromResume(resume);
    const jsCount = result.skills.filter((s) => s === 'JavaScript').length;
    const reactCount = result.skills.filter((s) => s === 'React').length;
    expect(jsCount).toBe(1);
    expect(reactCount).toBe(1);
  });

  test('categorizes skills correctly', () => {
    const result = extractSkillsFromResume(sampleResume);
    expect(result.skillCategories).toBeDefined();
    // JavaScript should be in language category
    const languages = result.skillCategories['language'] ?? [];
    expect(languages).toContain('JavaScript');
  });
});

// ── JD Skill Extraction ──

describe('extractSkillsFromJD', () => {
  const sampleJD = `
    Senior Frontend Engineer

    Requirements:
    - 5+ years of experience with JavaScript and TypeScript
    - Strong experience with React and Next.js
    - Experience with RESTful APIs and GraphQL
    - Proficiency in HTML, CSS, and responsive design
    - Familiarity with Git and CI/CD

    Nice to have:
    - Experience with Node.js and Express
    - Familiarity with AWS or GCP
    - Contributions to open-source projects
    - Experience with testing frameworks like Jest
  `;

  test('splits required vs preferred skills', () => {
    const result = extractSkillsFromJD(sampleJD);
    expect(result.requiredSkills.length).toBeGreaterThan(0);
    expect(result.preferredSkills.length).toBeGreaterThan(0);
  });

  test('required section has core skills', () => {
    const result = extractSkillsFromJD(sampleJD);
    expect(result.requiredSkills).toContain('JavaScript');
    expect(result.requiredSkills).toContain('TypeScript');
    expect(result.requiredSkills).toContain('React');
  });

  test('preferred section has nice-to-have skills', () => {
    const result = extractSkillsFromJD(sampleJD);
    // Node/Express mentioned in nice-to-have
    const hasNodeOrExpress = result.preferredSkills.some(
      (s) => s === 'Node' || s === 'Express'
    );
    expect(hasNodeOrExpress).toBe(true);
  });

  test('extracts job title', () => {
    const result = extractSkillsFromJD(sampleJD);
    expect(result.title).not.toBeNull();
  });

  test('detects seniority from JD', () => {
    const result = extractSkillsFromJD(sampleJD);
    expect(result.seniority).toBe('senior');
  });

  test('treats all skills as required when no sections detected', () => {
    const flatJD = 'We need someone who knows JavaScript, React, Python, and Docker';
    const result = extractSkillsFromJD(flatJD);
    expect(result.requiredSkills.length).toBeGreaterThan(0);
    expect(result.preferredSkills).toEqual([]);
  });

  test('extracts education keywords', () => {
    const result = extractSkillsFromJD(sampleJD);
    // The JD itself might not have education keywords, but let's test with one that does
    const jdWithEdu = 'Requirements: Bachelor in Computer Science, 3+ years experience with Python';
    const eduResult = extractSkillsFromJD(jdWithEdu);
    expect(eduResult.educationKeywords).toContain('bachelor');
    expect(eduResult.educationKeywords).toContain('computer science');
  });
});
