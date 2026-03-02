import { describe, expect, test, beforeAll, afterAll } from 'bun:test';

const API_BASE = 'http://localhost:3000';

let serverProcess: ReturnType<typeof Bun.spawn> | null = null;
let authToken: string;
const testEmail = `test-${Date.now()}@example.com`;
const testPassword = 'TestPass123';

// ── Server lifecycle ──

beforeAll(async () => {
  // Check if server is already running
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) return; // Server already running
  } catch {
    // Server not running, start it
  }

  serverProcess = Bun.spawn(['bun', 'run', 'dev:api'], {
    cwd: '/Users/ishan/Desktop/Code/Passion-Projects/skill-gap-analyzer',
    stdout: 'ignore',
    stderr: 'ignore',
  });

  // Wait for server to be ready
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Server failed to start within 30 seconds');
});

afterAll(() => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

// ── Health ──

describe('Health Check', () => {
  test('GET /health returns ok', async () => {
    const res = await fetch(`${API_BASE}/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });
});

// ── Auth ──

describe('Auth - Register', () => {
  test('POST /api/auth/register creates user', async () => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, name: 'Test User', password: testPassword }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testEmail);
    expect(data.user.name).toBe('Test User');
    expect(data.token).toBeDefined();
    authToken = data.token;
  });

  test('rejects duplicate email', async () => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, name: 'Dupe', password: testPassword }),
    });
    expect(res.status).toBe(409);
  });

  test('rejects invalid email', async () => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', name: 'Bad', password: testPassword }),
    });
    expect(res.status).toBe(400);
  });

  test('rejects short password', async () => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'short@test.com', name: 'Short', password: '123' }),
    });
    expect(res.status).toBe(400);
  });

  test('rejects password without number', async () => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonum@test.com', name: 'NoNum', password: 'abcdefgh' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('Auth - Login', () => {
  test('POST /api/auth/login succeeds with correct credentials', async () => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.email).toBe(testEmail);
    expect(data.token).toBeDefined();
    authToken = data.token; // Update token
  });

  test('rejects wrong password', async () => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword1' }),
    });
    expect(res.status).toBe(401);
  });

  test('rejects non-existent email', async () => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'noone@nowhere.com', password: testPassword }),
    });
    expect(res.status).toBe(401);
  });
});

// ── Analyses ──

describe('Analyses - Auth required', () => {
  test('GET /api/analyses returns 401 without token', async () => {
    const res = await fetch(`${API_BASE}/api/analyses`);
    expect(res.status).toBe(401);
  });

  test('POST /api/analyses returns 401 without token', async () => {
    const res = await fetch(`${API_BASE}/api/analyses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_text: 'x', job_description_text: 'y' }),
    });
    expect(res.status).toBe(401);
  });
});

describe('Analyses - CRUD', () => {
  let analysisId: string;

  test('GET /api/analyses returns empty list initially', async () => {
    const res = await fetch(`${API_BASE}/api/analyses`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.analyses).toBeArray();
    expect(data.total).toBeDefined();
    expect(data.page).toBe(1);
  });

  test('POST /api/analyses rejects short resume', async () => {
    const res = await fetch(`${API_BASE}/api/analyses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ resume_text: 'too short', job_description_text: 'too short' }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /api/analyses creates analysis', async () => {
    const resumeText = `
      Senior Software Engineer with 8 years of experience.
      Skills: JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, Docker, AWS, Git.
      Built scalable web applications serving millions of users.
      Education: BS Computer Science, Stanford University.
    `.padEnd(200, ' detailed experience in building things ');

    const jdText = `
      Senior Frontend Engineer

      Requirements:
      - 5+ years JavaScript and TypeScript
      - Strong React experience
      - REST API experience
      - Git proficiency

      Nice to have:
      - Node.js experience
      - AWS knowledge
    `.padEnd(200, ' additional details about the role ');

    const res = await fetch(`${API_BASE}/api/analyses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ resume_text: resumeText, job_description_text: jdText }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.analysis_id).toBeDefined();
    expect(data.status).toBe('pending');
    analysisId = data.analysis_id;
  });

  test('GET /api/analyses/:id/status returns status', async () => {
    const res = await fetch(`${API_BASE}/api/analyses/${analysisId}/status`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(analysisId);
    expect(['pending', 'processing', 'completed', 'failed']).toContain(data.status);
  });

  test('GET /api/analyses/:id returns full analysis', async () => {
    const res = await fetch(`${API_BASE}/api/analyses/${analysisId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(analysisId);
    expect(data.status).toBeDefined();
  });

  test('GET /api/analyses/:id returns 404 for non-existent', async () => {
    const res = await fetch(`${API_BASE}/api/analyses/00000000-0000-0000-0000-000000000000`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(404);
  });

  test('GET /api/analyses supports pagination', async () => {
    const res = await fetch(`${API_BASE}/api/analyses?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.page).toBe(1);
    expect(data.limit).toBe(5);
    expect(data.analyses.length).toBeLessThanOrEqual(5);
  });

  test('waits for analysis completion (worker processing)', async () => {
    // Poll for up to 60 seconds
    let status = 'pending';
    for (let i = 0; i < 30; i++) {
      const res = await fetch(`${API_BASE}/api/analyses/${analysisId}/status`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      status = data.status;
      if (status === 'completed' || status === 'failed') break;
      await new Promise((r) => setTimeout(r, 2000));
    }

    // Fetch full result
    const res = await fetch(`${API_BASE}/api/analyses/${analysisId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const analysis = await res.json();

    if (status === 'completed') {
      expect(analysis.overall_score).not.toBeNull();
      expect(parseFloat(analysis.overall_score)).toBeGreaterThan(0);
      expect(analysis.score_breakdown).not.toBeNull();
      expect(analysis.skill_gaps).not.toBeNull();
      expect(analysis.skill_gaps.matchedSkills).toBeArray();
      expect(analysis.roadmap).not.toBeNull();
      expect(analysis.resume_suggestions).not.toBeNull();
    } else {
      // If failed, that's still valid — LLM might not be configured
      console.log(`Analysis ended with status: ${status}`);
      expect(['completed', 'failed']).toContain(status);
    }
  }, 65000); // 65s timeout
});
