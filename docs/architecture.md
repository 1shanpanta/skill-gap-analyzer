# Architecture

## System Overview

Skill Gap Analyzer is a full-stack web app with a split deployment model:

- **Frontend**: Next.js 16 on Vercel (`skill-gap-analyzer-nine.vercel.app`)
- **Backend**: Express + TypeScript on Render (`skill-gap-analyzer-4szb.onrender.com`)
- **Database**: PostgreSQL on Supabase
- **LLM**: Groq (llama-3.3-70b-versatile)
- **Payments**: DodoPayments (one-time credit packs)
- **Analytics**: PostHog (reverse-proxied through Next.js)

## Request Flow

```
Browser → Vercel (Next.js :3001)
  ├── Static pages served directly
  └── /api/* → rewritten to Render (Express :3000)
        ├── Auth middleware (JWT from httpOnly cookie)
        ├── Rate limit middleware (credits check)
        └── Route handler → Prisma → PostgreSQL
```

## Analysis Pipeline

```
1. POST /api/analyses
   ├── Validate input (Zod)
   ├── Check 24h cache (content_hash)
   ├── Transaction:
   │   ├── Create/link resume
   │   ├── Create job description
   │   ├── Create analysis (status: pending)
   │   ├── Queue background job
   │   └── Decrement user credits
   └── Return analysis_id

2. Worker picks up job (polling every 2s)
   ├── Extract skills from resume (deterministic taxonomy)
   ├── Extract skills from job description
   ├── [Optional] LLM-enhanced skill extraction
   ├── Fetch GitHub signals (if URL provided)
   ├── Calculate score breakdown (deterministic)
   ├── Generate learning roadmap (Groq LLM)
   ├── Generate resume suggestions (Groq LLM)
   └── Save results (status: completed)

3. Frontend polls via SSE (GET /api/analyses/:id/stream)
   └── Displays results when status = completed
```

## Job Queue

Postgres-based with `FOR UPDATE SKIP LOCKED` for lock-free claiming:

- **Polling**: Every 2 seconds (configurable)
- **Retries**: 3 attempts with exponential backoff
- **Stale recovery**: Jobs stuck in `processing` > 5 minutes are reclaimed
- **Graceful shutdown**: SIGTERM/SIGINT handlers stop polling

## Authentication

Two auth methods, both set an httpOnly JWT cookie:

1. **Email/Password**: bcrypt hashing, JWT issued on login
2. **Google OAuth**: OAuth2 consent flow, auto-links if email matches

Password reset uses a time-limited token sent via Resend email (or console.log in dev).

## Payment Flow

```
1. User clicks "Buy" on /pricing
2. POST /api/billing/checkout → DodoPayments checkout session
3. User completes payment on DodoPayments
4. Webhook POST /webhooks/dodo → verify signature → add credits
5. User redirected to /settings?billing=success
```

Credit packs (one-time, not subscription):

| Pack | Credits | Price |
|------|---------|-------|
| Starter | 5 | $5 |
| Standard | 15 | $10 |
| Pro | 50 | $25 |

## Scoring Algorithm

Multi-factor weighted scoring (0-100):

| Factor | With GitHub | Without GitHub |
|--------|------------|----------------|
| Skill match | 45% | 55% |
| Seniority alignment | 25% | 30% |
| GitHub signals | 20% | 0% |
| Bonus factors | 10% | 15% |

## Key Directories

```
src/                     Express backend
├── routes/              API endpoints
├── services/            Business logic (scoring, LLM, GitHub, payments)
├── middleware/           Auth, rate limiting, error handling
├── db/                  Prisma instance + query functions
├── workers/             Job queue poller + handlers
├── utils/               Taxonomy, text normalization, token tracking
└── config/              Zod-validated env config

client/                  Next.js frontend
└── src/
    ├── app/             Pages (App Router)
    ├── components/      UI components
    └── lib/             Auth context, API wrapper, types

prisma/                  Schema + migrations
```

## Environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection |
| `JWT_SECRET` | Yes | JWT signing (min 32 chars) |
| `GROQ_API_KEY` | Yes | LLM for roadmap + suggestions |
| `FRONTEND_URL` | Prod | CORS origin + redirect URLs |
| `DODO_API_KEY` | For payments | DodoPayments API |
| `DODO_WEBHOOK_SECRET` | For payments | Webhook signature verification |
| `DODO_PRODUCT_*` | For payments | Product IDs for credit packs |
| `GOOGLE_CLIENT_ID/SECRET` | For OAuth | Google sign-in |
| `RESEND_API_KEY` | For email | Password reset emails |
| `GITHUB_TOKEN` | Optional | Higher GitHub API rate limits |
