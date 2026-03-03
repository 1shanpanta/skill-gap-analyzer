# Skill Gap Analyzer

Paste your resume and a job description, and get a breakdown of what matches, what's missing, and what to learn next. Optionally link your GitHub for a more complete picture.

The app scores your fit, identifies skill gaps, and generates a personalized learning roadmap and resume improvement suggestions using Groq's LLM.

## Features

- **Skill gap detection** — matched, missing, partial, and extra skills between resume and job description
- **Multi-factor scoring** — weighted score across skill match, seniority alignment, GitHub signals, and bonus factors
- **Learning roadmap** — LLM-generated week-by-week plan to close skill gaps
- **Resume suggestions** — keyword additions, bullet rewrites, and skills section reordering
- **GitHub analysis** — repo count, languages, activity, and contribution signals
- **Resume upload** — parse PDF, DOCX, or TXT files client-side (or paste text directly)
- **Saved resumes** — persist resumes for reuse across analyses
- **Background processing** — analyses run async via a Postgres-based job queue
- **Google OAuth** — sign in with Google or email/password
- **Analysis history** — browse and revisit all past analyses with filtering and sorting
- **Analysis sharing** — generate unique share links for public viewing
- **Analysis comparison** — side-by-side comparison of two analyses
- **PDF export** — download analysis as a PDF report
- **Analysis notes** — add notes and comments to analyses
- **Pay-as-you-go credits** — 1 free analysis, then buy credit packs via DodoPayments
- **Analytics** — PostHog integration with reverse proxy for event tracking

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Express + TypeScript |
| Frontend | Next.js 16 (App Router) + Tailwind CSS + shadcn/ui |
| Database | PostgreSQL + Prisma ORM v7 |
| LLM | Groq (llama-3.3-70b-versatile) |
| Payments | DodoPayments |
| Auth | JWT + bcrypt + Google OAuth |
| Analytics | PostHog |
| Package Manager | bun |

## Getting Started

### Prerequisites

- [bun](https://bun.sh) (v1.0+)
- PostgreSQL running locally
- A [Groq API key](https://console.groq.com)

### Setup

```bash
# Clone and install
git clone https://github.com/1shanpanta/skill-gap-analyzer.git
cd skill-gap-analyzer
bun install
cd client && bun install && cd ..

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, and GROQ_API_KEY

# Run database migrations
bunx prisma migrate dev

# Start everything (backend on :3000, frontend on :3001)
bun run dev
```

The browser opens automatically when the dev server is ready.

### Environment Variables

The only required variables to get started:

```
DATABASE_URL=postgresql://user@localhost:5432/skill_gap_analyzer
JWT_SECRET=any-string-at-least-32-characters-long
GROQ_API_KEY=your-groq-api-key
```

Optional integrations:

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth login |
| `RESEND_API_KEY` | Transactional emails via Resend |
| `GITHUB_TOKEN` | Higher GitHub API rate limits |
| `DODO_API_KEY` / `DODO_WEBHOOK_SECRET` | DodoPayments for credit purchases |
| `DODO_PRODUCT_10` / `DODO_PRODUCT_30` / `DODO_PRODUCT_100` | DodoPayments product IDs for credit packs |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog analytics (set in `client/.env.local`) |

See `.env.example` for the full list.

## How It Works

1. User submits resume text + job description (+ optional GitHub URL)
2. Backend creates an analysis record and queues a background job
3. Worker picks up the job and runs the pipeline:
   - Extract skills from resume using a 200+ skill taxonomy with synonym matching
   - Extract required/preferred skills from the job description
   - Fetch GitHub profile signals (if URL provided)
   - Calculate a deterministic score breakdown
   - Generate a learning roadmap via Groq LLM
   - Generate resume improvement suggestions via Groq LLM
4. Frontend polls for status and displays results when ready

## Pricing

Every account gets 1 free analysis. After that, users buy credit packs:

| Pack | Credits | Price |
|------|---------|-------|
| Starter | 5 | $5 |
| Standard | 15 | $10 |
| Pro | 50 | $25 |

Payments are handled via DodoPayments with webhook-based credit fulfillment.

## Project Structure

```
├── src/                    # Express backend
│   ├── routes/             # API endpoints (auth, analyses, billing, webhooks)
│   ├── services/           # Core logic (scoring, skill extraction, LLM, dodo)
│   ├── middleware/          # Auth, rate limiting, error handling
│   ├── db/                 # Prisma queries (users, credits, analyses)
│   ├── utils/              # Taxonomy, text normalization, token tracking
│   └── worker/             # Background job poller and handlers
├── client/                 # Next.js frontend
│   └── src/
│       ├── app/            # Pages (App Router)
│       ├── components/     # UI components (analysis form, charts, viewers)
│       └── lib/            # Auth context, API wrapper, types, PostHog
├── prisma/                 # Database schema and migrations
└── tests/                  # Backend tests
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with email/password |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/google` | Start Google OAuth flow |
| GET | `/api/auth/me` | Get current user profile |
| POST | `/api/analyses` | Create a new analysis (costs 1 credit) |
| GET | `/api/analyses` | List analyses (paginated) |
| GET | `/api/analyses/:id` | Get full analysis results |
| GET | `/api/analyses/:id/status` | Poll analysis status |
| POST | `/api/analyses/:id/share` | Generate share token |
| DELETE | `/api/analyses/:id/share` | Revoke share link |
| POST | `/api/billing/checkout` | Create DodoPayments checkout session |
| GET | `/api/billing/status` | Get user credits and purchase history |
| POST | `/webhooks/dodo` | DodoPayments webhook (payment.succeeded) |

## Deployment

- **Frontend:** Vercel (auto-deploys from `main`)
- **Backend:** Render (web service, auto-deploys from `main`)
- **Database:** Supabase (PostgreSQL)

## License

MIT
