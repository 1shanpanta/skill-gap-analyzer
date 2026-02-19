You are building the Skill Gap Analyzer MVP backend. This is a Node.js + Express + PostgreSQL + TypeScript backend. No frontend. No Redis. No BullMQ. No microservices. Single service.

PROGRESS TRACKING: Check PROGRESS.md in the project root. It tracks which phases are done. Pick up from the first incomplete phase. After completing a phase, update PROGRESS.md. If PROGRESS.md does not exist, start from Phase 1.

PHASE 1 - FOUNDATION (if not done):
- npm init, install deps: express pg knex bcryptjs jsonwebtoken zod openai dotenv uuid. Dev: typescript tsx concurrently wait-on @types/express @types/pg @types/bcryptjs @types/jsonwebtoken @types/uuid @types/node
- tsconfig.json (strict, ES2022, NodeNext)
- .env.example with: NODE_ENV, PORT=3000, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN=7d, BCRYPT_SALT_ROUNDS=12, OPENAI_API_KEY, OPENAI_MODEL=gpt-4o-mini, GITHUB_TOKEN (optional), DAILY_ANALYSIS_LIMIT=5, WORKER_POLL_INTERVAL_MS=2000, JOB_STALE_THRESHOLD_MINUTES=5, JOB_MAX_ATTEMPTS=3
- .gitignore (node_modules, dist, .env, *.js in src)
- src/config/index.ts - zod validated env config
- src/db/connection.ts - pg Pool singleton from DATABASE_URL
- knexfile.ts + src/db/migrations/001_initial_schema.ts with 5 tables:
  * users (id UUID PK, email UNIQUE, name, password_hash, daily_analysis_count INT DEFAULT 0, last_analysis_date DATE, created_at, updated_at)
  * resumes (id UUID PK, user_id FK, raw_text TEXT, extracted_data JSONB, created_at)
  * job_descriptions (id UUID PK, user_id FK, raw_text TEXT, extracted_data JSONB, created_at)
  * analyses (id UUID PK, user_id FK, resume_id FK, job_description_id FK, status VARCHAR(20) CHECK pending/processing/completed/failed, overall_score NUMERIC(5,2), score_breakdown JSONB, skill_gaps JSONB, github_signals JSONB, roadmap TEXT, resume_suggestions TEXT, token_usage JSONB, github_url VARCHAR(500), created_at, completed_at)
  * jobs (id UUID PK, type VARCHAR(50), status VARCHAR(20) CHECK pending/processing/completed/failed, payload JSONB, result JSONB, attempts INT DEFAULT 0, max_attempts INT DEFAULT 3, priority INT DEFAULT 0, scheduled_at TIMESTAMPTZ DEFAULT NOW(), started_at, completed_at, failed_at, error TEXT, worker_id VARCHAR(100), created_at)
  * Partial index on jobs: CREATE INDEX idx_jobs_claimable ON jobs(priority DESC, scheduled_at ASC) WHERE status = 'pending'
  * Use pgcrypto extension for gen_random_uuid()
- src/index.ts - Express app with JSON parsing, health check GET /health that pings DB, listen on PORT
- package.json scripts: dev uses concurrently with tsx watch + wait-on, build: tsc, start: node dist/index.js, migrate: knex migrate:latest, migrate:rollback: knex migrate:rollback
- Update PROGRESS.md: Phase 1 DONE

PHASE 2 - AUTH (if not done):
- src/db/queries/users.ts - createUser(email,name,passwordHash), findByEmail(email), findById(id), incrementAnalysisCount(id), resetDailyCount(id)
- src/middleware/errorHandler.ts - global Express error handler, returns JSON { error, message, statusCode }
- src/middleware/auth.ts - JWT verification middleware, extracts userId, attaches to req
- src/routes/auth.ts - POST /api/auth/register (validate with zod: email, name 2-100chars, password 8+ with letter+number, hash with bcrypt, return user+JWT), POST /api/auth/login (verify email+password, return user+JWT)
- Wire routes in src/index.ts
- Update PROGRESS.md: Phase 2 DONE

PHASE 3 - SKILL TAXONOMY + EXTRACTION (if not done):
- src/taxonomy/skills.ts - 100+ TaxonomyEntry objects: { canonical, category (language|framework|library|database|cloud|devops|tool|concept|soft_skill), synonyms[], relatedGroup? }. Include: JavaScript, TypeScript, Python, Java, Go, Rust, C#, Ruby, PHP, Swift, Kotlin, SQL, React, Next.js, Vue, Angular, Svelte, Express, NestJS, Django, Flask, FastAPI, Spring Boot, Rails, PostgreSQL, MySQL, MongoDB, Redis, DynamoDB, Elasticsearch, AWS, GCP, Azure, Docker, Kubernetes, Terraform, CI/CD, Git, GraphQL, REST API, Microservices, System Design, Testing, Agile, Node.js, and 50+ more. Build reverse synonym->entry Map at module load. Export canonicalize(), hasExactMatch(), hasPartialMatch() functions.
- src/utils/textNormalizer.ts - lowercase, collapse whitespace, remove special chars except hyphens/dots/slashes/plus/hash
- src/utils/experienceParser.ts - regex extract years of experience from text (patterns: X years, X+ years, X yrs)
- src/utils/seniorityDetector.ts - detect seniority from text patterns (junior/mid/senior/lead/principal) + infer from years. Return highest.
- src/services/skillExtractor.ts - extractSkillsFromResume(text) returns { skills[], skillCategories{}, experienceYears, seniority, softSkills[], certifications[], educationText }. extractSkillsFromJD(text) returns { title, requiredSkills[], preferredSkills[], seniority, softSkills[], educationKeywords[] }. Use word-boundary regex matching against taxonomy. Split JD into required vs preferred sections using patterns like 'requirements:', 'nice to have:', 'preferred:', etc.
- Update PROGRESS.md: Phase 3 DONE

PHASE 4 - DETERMINISTIC SCORING (if not done):
- src/services/scorer.ts with these exact formulas:
  * OverallScore = (W_skill * SkillMatch) + (W_seniority * SeniorityAlignment) + (W_github * GitHubSignal) + (W_bonus * BonusFactors)
  * Weights WITH GitHub: skill=0.45, seniority=0.25, github=0.20, bonus=0.10
  * Weights WITHOUT GitHub: skill=0.55, seniority=0.30, github=0.00, bonus=0.15
  * SkillMatchScore(0-100): required skills 2x weight, preferred 1x. Exact taxonomy match = full credit, partial match (same relatedGroup) = 50%. score = earnedPoints/maxPoints * 100
  * SeniorityAlignmentScore(0-100): levels junior=1,mid=2,senior=3,lead=4,principal=5. diff 0=100, 1=75, 2=40, 3+=10
  * GitHubSignalScore(0-100): recency(0-25) + language relevance(0-35) + repo quality(0-25) + contribution volume(0-15)
  * BonusFactors(0-100): education(0-20) + certifications(0-20) + soft skills(0-20) + keyword density(0-20) + extra skills breadth(0-20)
  * Export calculateOverallScore() that returns { overallScore, scoreBreakdown, skillGaps }
- Update PROGRESS.md: Phase 4 DONE

PHASE 5 - JOB QUEUE (if not done):
- src/db/queries/jobs.ts - claimJob(workerId): UPDATE...WHERE id=(SELECT...FOR UPDATE SKIP LOCKED) atomically claims one pending job. completeJob(id, result). failJob(id, error) with exponential backoff retry. recoverStaleJobs(thresholdMinutes).
- src/workers/poller.ts - startWorker(pool): setInterval polling every WORKER_POLL_INTERVAL_MS. Claims job, processes via handler, completes/fails. Separate stale recovery interval every 60s. Graceful shutdown on SIGTERM/SIGINT.
- src/workers/handlers.ts - routes job.type to handler function. Type 'run_analysis' -> analysisOrchestrator.
- Start worker in src/index.ts after server listen.
- Update PROGRESS.md: Phase 5 DONE

PHASE 6 - ANALYSIS PIPELINE (if not done):
- src/db/queries/resumes.ts, jobDescriptions.ts, analyses.ts - CRUD queries
- src/middleware/rateLimit.ts - check user daily_analysis_count against DAILY_ANALYSIS_LIMIT. Reset count if last_analysis_date is before today. Return 429 if exceeded.
- src/routes/analyses.ts:
  * POST /api/analyses (auth + rateLimit middleware): validate {resume_text 100-50000chars, job_description_text 100-50000chars, github_url? valid github URL}. In transaction: insert resume, JD, analysis(status=pending), job(type=run_analysis, payload={analysis_id, user_id}). Increment daily count. Return {analysis_id, status}.
  * GET /api/analyses/:id (auth): full analysis result, 404 if not user's
  * GET /api/analyses (auth): paginated list with ?page=1&limit=10
  * GET /api/analyses/:id/status (auth): lightweight {id, status, overall_score, completed_at}
- src/services/analysisOrchestrator.ts - runAnalysisPipeline(analysisId, pool): fetch analysis+relations, mark processing, extract resume skills, extract JD skills, fetch GitHub (if URL), calculate all scores, generate roadmap (PLACEHOLDER STRING FOR NOW), generate suggestions (PLACEHOLDER FOR NOW), save all results, mark completed. On error mark failed and rethrow.
- src/services/emailSimulator.ts - log simulated email to console: 'EMAIL SENT to {email}: Analysis {id} complete. Score: {score}/100'
- Wire routes in index.ts
- Update PROGRESS.md: Phase 6 DONE

PHASE 7 - GITHUB ANALYZER (if not done):
- src/services/githubAnalyzer.ts - fetchGitHubSignals(githubUrl): extract username from URL. 2 API calls: GET /users/{username} + GET /users/{username}/repos?sort=pushed&per_page=100. Use GITHUB_TOKEN header if available. Derive: publicRepoCount, topLanguages (top 5 by frequency), lastPushDate, starredRepoCount, hasDescriptiveRepos, hasForkedRepos, recentlyActive (pushed in 90 days), profileBio. Handle 404 and 403 rate limit errors.
- Integrate into analysisOrchestrator (replace null GitHub signals with real fetch)
- Update PROGRESS.md: Phase 7 DONE

PHASE 8 - LLM INTEGRATION (if not done):
- src/utils/tokenTracker.ts - trackTokens(step, usage, model) returns {step, prompt_tokens, completion_tokens, total_tokens, model, estimated_cost_usd}. GPT-4o-mini pricing: input $0.15/1M, output $0.60/1M.
- src/prompts/roadmap.ts - buildRoadmapPrompt({missingRequired, missingPreferred, currentSkills, targetRole, seniorityLevel, overallScore}). System: career dev advisor. Output: 30-60-90 day plan with specific resources, projects, hour estimates. Max 1500 words.
- src/prompts/resumeRewrite.ts - buildResumeSuggestionsPrompt({resumeText, jobDescriptionText, missingSkills, matchedSkills, overallScore}). Output: missing keywords, 3 bullet rewrites (XYZ format), skills section optimization, tailored summary, 5 quick wins. Max 1200 words.
- src/services/roadmapGenerator.ts - generateRoadmap(data) calls OpenAI gpt-4o-mini, max_tokens=2000, temp=0.7. Returns {roadmap, tokenUsage}.
- src/services/resumeSuggestions.ts - generateResumeSuggestions(data) same pattern. Returns {suggestions, tokenUsage}.
- Replace placeholder strings in analysisOrchestrator with real LLM calls. Aggregate token usage from both calls.
- Update PROGRESS.md: Phase 8 DONE

PHASE 9 - POLISH (if not done):
- Add input validation edge cases (empty skills, very long texts, malformed GitHub URLs)
- Ensure all error responses are consistent JSON format
- Verify pagination works on GET /api/analyses
- Add request body size validation
- Make sure all DB queries use parameterized queries (no SQL injection)
- git init and make initial commit with message 'feat: complete MVP backend for Skill Gap Analyzer'
- Update PROGRESS.md: Phase 9 DONE
- Output: <promise>MVP BACKEND COMPLETE</promise>

RULES:
- Backend only. No frontend code.
- No Redis, BullMQ, Celery, or microservices.
- Use raw pg queries, NOT Knex query builder (Knex for migrations only).
- LLM ONLY for roadmap + resume suggestions. All scoring is deterministic.
- TypeScript strict mode.
- Use zod for all request validation.
- For dev script use concurrently with wait-on pattern.
- Do NOT create unnecessary .md files except PROGRESS.md and .env.example.
- Each phase: write all files, then update PROGRESS.md, then stop.
