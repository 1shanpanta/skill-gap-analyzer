# Components

## API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Email/password signup (1 free credit) |
| POST | `/login` | No | Email/password login, sets httpOnly cookie |
| POST | `/logout` | Yes | Clears auth cookie |
| GET | `/google` | No | Redirects to Google OAuth consent |
| GET | `/google/callback` | No | OAuth callback, sets cookie, redirects |
| GET | `/me` | Yes | Current user profile + stats |
| PATCH | `/me` | Yes | Update name |
| POST | `/change-password` | Yes | Change password (requires current) |
| POST | `/forgot-password` | No | Send password reset email |
| POST | `/reset-password` | No | Reset password with token |
| DELETE | `/unlink-google` | Yes | Remove Google account link |

### Analyses (`/api/analyses`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Yes | Create analysis (costs 1 credit) |
| GET | `/` | Yes | List analyses (paginated, filterable) |
| GET | `/stats` | Yes | Dashboard stats (total, avg score) |
| GET | `/:id` | Yes | Full analysis with all data |
| GET | `/:id/status` | Yes | Quick status poll |
| GET | `/:id/stream` | Yes | SSE stream for real-time updates |
| POST | `/:id/retry` | Yes | Requeue failed analysis |
| DELETE | `/:id` | Yes | Delete analysis + orphan cleanup |
| POST | `/:id/share` | Yes | Generate share token |
| DELETE | `/:id/share` | Yes | Revoke share link |

### Notes (`/api/analyses/:id/notes`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List notes for analysis |
| POST | `/` | Yes | Create note (max 5000 chars) |
| PATCH | `/:noteId` | Yes | Update note |
| DELETE | `/:noteId` | Yes | Delete note |

### Resumes (`/api/resumes`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List saved resumes |
| GET | `/:id` | Yes | Get resume with raw_text |
| PATCH | `/:id` | Yes | Update name/is_saved |
| DELETE | `/:id` | Yes | Delete resume |

### Billing (`/api/billing`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/checkout` | Yes | Create DodoPayments checkout |
| GET | `/status` | Yes | Credits + purchase history |

### Webhooks (`/webhooks`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/dodo` | Signature | DodoPayments payment.succeeded |

### Public

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/shared/:token` | No | View shared analysis |
| GET | `/health` | No | Server health check |

---

## Frontend Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Landing page | Hero, how-it-works, CTA |
| `/login` | Login form | Email/password + Google OAuth |
| `/register` | Register form | Email/password + Google OAuth |
| `/forgot-password` | Forgot password | Email input for reset |
| `/reset-password` | Reset password | Token-based password reset |
| `/pricing` | Pricing page | Credit packs + features list |
| `/privacy` | Privacy policy | Legal page |
| `/terms` | Terms of service | Legal page |
| `/shared/[token]` | Shared analysis | Public read-only analysis view |
| `/dashboard` | Dashboard | Analysis form + stats + recent |
| `/analysis/[id]` | Analysis detail | Full results with SSE, share, export |
| `/history` | History | Paginated list with filters |
| `/compare` | Compare | Side-by-side two analyses |
| `/settings` | Settings | Profile, password, Google, credits |

---

## Backend Services

### `analysisOrchestrator.ts`
Runs the full analysis pipeline as a background job. Coordinates skill extraction, scoring, LLM calls, and result storage.

### `skillExtractor.ts`
Deterministic skill extraction using a 200+ skill taxonomy with synonyms, regex matching, certification patterns, and education parsing. Splits JD into required vs preferred.

### `scorer.ts`
Multi-factor weighted scoring: skill match (exact + partial), seniority alignment, GitHub signals, and bonus factors (education, certs, soft skills, keywords).

### `roadmapGenerator.ts`
Calls Groq LLM to generate a week-by-week learning plan based on missing skills.

### `resumeSuggestions.ts`
Calls Groq LLM to generate resume improvements: keyword additions, bullet rewrites, skills section optimization.

### `githubAnalyzer.ts`
Fetches public GitHub data: languages, repos, stars, activity recency, README quality.

### `llmSkillExtractor.ts`
Optional LLM-enhanced skill extraction for both resume and JD (when `ENABLE_LLM_SKILL_EXTRACTION=true`).

### `dodo.ts`
DodoPayments client initialization and credit pack configuration.

### `email.ts`
Password reset emails via Resend. Falls back to console.log in dev.

---

## Frontend Components

### Analysis
- **AnalysisForm** — Resume input (text/file/saved), JD input, GitHub URL, submit
- **ScoreGauge** — Visual circular gauge for overall score
- **ScoreBreakdownCard** — Detailed breakdown of all scoring factors
- **SkillGapChart** — Categorized display of matched/missing/partial/extra skills
- **RoadmapViewer** — Markdown-rendered week-by-week learning plan
- **SuggestionsViewer** — Markdown-rendered resume improvement tips
- **GitHubSignals** — GitHub stats display (repos, languages, activity)
- **AnalysisNotes** — CRUD interface for per-analysis notes
- **AnalysisPDF** — React PDF export of full analysis

### Dashboard
- **DashboardStats** — Total analyses, completed count, average score
- **RecentAnalyses** — Last 5 analyses with quick links

### Shared
- **Pagination** — Reusable page navigation
- **GoogleSignInButton** — OAuth trigger button

### Hooks
- **useAuth()** — Auth context: user, login, logout, register, loading state
- **useAnalysisSSE()** — SSE connection for real-time analysis status
- **apiFetch()** — Authenticated fetch wrapper with timeout and auto-reauth

### UI (shadcn/ui)
Button, Input, Textarea, Select, Checkbox, Card, Badge, Label, AlertDialog, Skeleton, Toast (Sonner)
