# Skill Gap Analyzer - Build Progress

## Phase 1: Foundation - DONE
- package.json with all deps (bun)
- tsconfig.json (strict, ES2022, NodeNext)
- .env.example, .gitignore
- src/config/index.ts (zod env validation)
- src/db/connection.ts (pg Pool)
- knexfile.ts + src/db/migrations/001_initial_schema.ts (5 tables)
- src/index.ts (Express + health check)
- Directory structure created

## Phase 2: Auth - DONE
- src/db/queries/users.ts (createUser, findByEmail, findById, incrementAnalysisCount, resetDailyCount)
- src/middleware/errorHandler.ts (AppError class + global handler)
- src/middleware/auth.ts (JWT verification middleware)
- src/routes/auth.ts (POST /register + POST /login with zod validation)
- Wired auth routes + error handler into src/index.ts
## Phase 3: Skill Taxonomy + Extraction - DONE
- src/taxonomy/skills.ts (100+ entries with synonyms, relatedGroups, reverse lookup map)
- src/utils/textNormalizer.ts (lowercase, collapse whitespace, keep special chars)
- src/utils/experienceParser.ts (regex years extraction)
- src/utils/seniorityDetector.ts (pattern + experience-based detection)
- src/services/skillExtractor.ts (extractSkillsFromResume + extractSkillsFromJD with JD section splitting)
## Phase 4: Deterministic Scoring - DONE
- src/services/scorer.ts with weighted formula:
  * SkillMatchScore (required 2x, preferred 1x, partial 50%)
  * SeniorityAlignmentScore (level diff mapping)
  * GitHubSignalScore (recency + lang relevance + repo quality + volume)
  * BonusFactors (education + certs + soft skills + keywords + breadth)
  * calculateOverallScore() with weight redistribution when no GitHub
## Phase 5: Job Queue - DONE
- src/db/queries/jobs.ts (createJob, claimJob with FOR UPDATE SKIP LOCKED, completeJob, failJob with exponential backoff, recoverStaleJobs)
- src/workers/poller.ts (setInterval polling + stale recovery + graceful shutdown)
- src/workers/handlers.ts (job type routing, dynamic import for orchestrator)
- Worker started in src/index.ts after server listen
## Phase 6: Analysis Pipeline - DONE
- src/db/queries/resumes.ts, jobDescriptions.ts, analyses.ts (full CRUD)
- src/middleware/rateLimit.ts (daily limit check with reset)
- src/routes/analyses.ts (POST create, GET by id, GET list paginated, GET status)
- src/services/analysisOrchestrator.ts (full pipeline with placeholder LLM)
- src/services/emailSimulator.ts (console log simulation)
- Wired analyses routes in src/index.ts
## Phase 7: GitHub Analyzer - DONE
- src/services/githubAnalyzer.ts (2 API calls: user profile + repos, derives all signals)
- Already integrated into analysisOrchestrator via dynamic import
## Phase 8: LLM Integration - DONE
- src/utils/tokenTracker.ts (token counting + cost estimation)
- src/prompts/roadmap.ts (30-60-90 day roadmap prompt template)
- src/prompts/resumeRewrite.ts (resume suggestions prompt template)
- src/services/roadmapGenerator.ts (OpenAI GPT-4o-mini call)
- src/services/resumeSuggestions.ts (OpenAI GPT-4o-mini call)
- Already integrated into analysisOrchestrator via dynamic import
## Phase 9: Polish - NOT DONE
