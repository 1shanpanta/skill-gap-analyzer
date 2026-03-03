# Data Model

## Entity Relationship

```
User 1──* Resume
User 1──* JobDescription
User 1──* Analysis
User 1──* CreditPurchase
Analysis 1──* AnalysisNote
Analysis *──1 Resume
Analysis *──1 JobDescription
```

## Tables

### User

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key, auto-generated |
| email | String | Unique |
| name | String | Display name |
| password_hash | String? | Null for Google-only users |
| google_id | String? | Unique, for OAuth |
| avatar_url | String? | From Google profile |
| password_reset_token | String? | Unique, hashed token |
| password_reset_expires | DateTime? | Token expiry |
| credits | Int | Default 1 (free analysis) |
| daily_analysis_count | Int | Default 0 (legacy, unused) |
| last_analysis_date | Date? | Legacy, unused |
| created_at | DateTime | Auto |
| updated_at | DateTime | Auto |

### Resume

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK → User (CASCADE delete) |
| raw_text | String | Full resume content |
| extracted_data | JSON? | Parsed skills, experience |
| name | String | Default "Untitled Resume" |
| is_saved | Boolean | Default false |
| created_at | DateTime | Auto |

**Indexes**: `user_id`, `(user_id, is_saved)`

### JobDescription

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK → User (CASCADE delete) |
| raw_text | String | Full JD content |
| extracted_data | JSON? | Parsed required/preferred skills |
| created_at | DateTime | Auto |

**Indexes**: `user_id`

### Analysis

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK → User (CASCADE delete) |
| resume_id | UUID | FK → Resume (CASCADE delete) |
| job_description_id | UUID | FK → JobDescription (CASCADE delete) |
| status | String | pending / processing / completed / failed |
| overall_score | Decimal(5,2)? | 0-100 |
| score_breakdown | JSON? | `{skill_match, seniority, github, bonus, weights, totals}` |
| skill_gaps | JSON? | `{matchedSkills, missingRequired, missingPreferred, partialMatches, extraSkills}` |
| github_signals | JSON? | `{repos, languages, stars, activity, ...}` |
| roadmap | String? | LLM-generated learning plan (markdown) |
| resume_suggestions | String? | LLM-generated improvements (markdown) |
| token_usage | JSON? | Per-step LLM token counts and cost |
| github_url | String? | User-provided GitHub profile URL |
| content_hash | String? | SHA256 of resume+JD+github for 24h cache |
| share_token | String? | Unique, for public sharing |
| completed_at | DateTime? | When processing finished |
| created_at | DateTime | Auto |

**Indexes**: `status`, `user_id`, `(user_id, created_at DESC)`, `(user_id, status)`, `(user_id, content_hash)`

### AnalysisNote

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| analysis_id | UUID | FK → Analysis (CASCADE delete) |
| user_id | UUID | FK → User (CASCADE delete) |
| content | String | Max 5000 chars |
| created_at | DateTime | Auto |
| updated_at | DateTime | Auto |

**Indexes**: `analysis_id`

### Job (Queue)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| type | String | "run_analysis" |
| status | String | pending / processing / completed / failed |
| payload | JSON | `{analysis_id, user_id}` |
| result | JSON? | Job output |
| attempts | Int | Default 0 |
| max_attempts | Int | Default 3 |
| priority | Int | Default 0 (higher = first) |
| scheduled_at | DateTime | Default now, future for retries |
| started_at | DateTime? | When worker claimed |
| completed_at | DateTime? | When finished |
| failed_at | DateTime? | When last failed |
| worker_id | String? | Claiming worker instance |
| created_at | DateTime | Auto |

**Indexes**: `(priority DESC, scheduled_at) WHERE status = 'pending'`, `started_at WHERE status = 'processing'`

Job claiming uses `FOR UPDATE SKIP LOCKED` raw SQL for lock-free concurrency.

### CreditPurchase

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK → User (CASCADE delete) |
| dodo_payment_id | String | Unique, from DodoPayments |
| dodo_customer_id | String | DodoPayments customer |
| pack_key | String | pack_10 / pack_30 / pack_100 |
| credits | Int | Credits granted |
| amount_cents | Int | Price paid in cents |
| currency | String | Default "USD" |
| created_at | DateTime | Auto |

**Indexes**: `user_id`

## JSON Schemas

### score_breakdown
```json
{
  "skill_match": { "score": 72, "matched": 8, "total": 12 },
  "seniority_alignment": { "score": 75, "resume": "mid", "job": "senior" },
  "github_signal": { "score": 60, "repos": 15, "languages": ["TypeScript", "Python"] },
  "bonus_factors": { "score": 55, "education": 20, "certs": 0, "soft_skills": 15, "keywords": 10, "extra": 10 },
  "weights": { "skill": 0.45, "seniority": 0.25, "github": 0.20, "bonus": 0.10 },
  "weighted_total": 68.5
}
```

### skill_gaps
```json
{
  "matchedSkills": [{ "name": "React", "category": "frontend" }],
  "missingRequired": [{ "name": "Kubernetes", "category": "devops" }],
  "missingPreferred": [{ "name": "GraphQL", "category": "backend" }],
  "partialMatches": [{ "have": "JavaScript", "need": "TypeScript" }],
  "extraSkills": [{ "name": "Go", "category": "backend" }]
}
```

### token_usage
```json
{
  "roadmap": { "prompt_tokens": 1200, "completion_tokens": 800, "model": "llama-3.3-70b-versatile" },
  "resume_suggestions": { "prompt_tokens": 1100, "completion_tokens": 600, "model": "llama-3.3-70b-versatile" },
  "skill_extraction": { "prompt_tokens": 900, "completion_tokens": 400, "model": "llama-3.3-70b-versatile" }
}
```
