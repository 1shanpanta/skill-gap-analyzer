# Project Status

Last updated: 2026-04-01

## Current State: Launch-ready, testing payments

The MVP is built and deployed. All core features work. Security audit complete.
Preparing for cold email outreach to job seekers / bootcamp grads / career switchers.

## What's Live

- Frontend: https://skill-gap-analyzer-nine.vercel.app (Vercel, auto-deploys)
- Backend: https://skill-gap-analyzer-4szb.onrender.com (Render, manual deploy)
- Database: Supabase (ap-northeast-2, password: `Sga2026Prod!Secure`)
- Payments: DodoPayments in `test_mode` (set `DODO_ENVIRONMENT=live_mode` when ready)

## Demo Account

Seeded via `scripts/seed-demo.ts`:
- Email: `alex@demo.com` / Password: `Demo1234`
- 10 credits, 3 pre-loaded analyses (Meta, Datadog, Vercel roles)

## What Was Done (March 31 session)

### P0 fixes (shipped)
1. Removed auto-login bypass on register page (`login("", "")` for all visitors)
2. DodoPayments mode now configurable via `DODO_ENVIRONMENT` env var
3. Credit refund when analysis job permanently fails (transactional, idempotent)

### Code review fixes (shipped)
1. Auth middleware: `warn` -> `debug` for unauthenticated requests (prevents log flood)
2. Webhook replay: rejects future timestamps (was using `Math.abs`)
3. Refund idempotency: `$transaction` with `[refunded]` marker

### Other changes (shipped)
- Login/register redirect to `/` instead of `/dashboard`
- Roadmap prompt rewritten: 4-week plan + 3 recommended projects
- Analysis page: roadmap and suggestions now full-width (unstacked)
- Removed redundant JWT_SECRET runtime check (zod validates min 32)

### QA Results
- Health score: 92/100
- 0 critical, 0 high, 2 medium, 1 low issues
- All public pages, forms, auth flows, dark mode, mobile tested
- Report: `.gstack/qa-reports/qa-report-skill-gap-analyzer-nine-vercel-app-2026-03-31.md`

## What's Next

### Before cold emailing
- [ ] Verify Render deploy succeeds with latest code (JWT fix + DODO_ENVIRONMENT)
- [ ] Test full checkout flow in test mode (card: 4242 4242 4242 4242)
- [ ] Switch DodoPayments to `live_mode` with live API key + product IDs
- [ ] Test real payment end-to-end

### Nice to have (post-launch)
- Console 401 noise: suppress `/api/auth/me` 401s on client side
- Register form: use styled inline errors instead of browser-native tooltips
- Pricing page nav: add sign-up CTA for logged-out visitors
- Test framework: no test suite exists yet (vitest recommended)
- Render auto-deploy: currently requires manual trigger

## Known Quirks

- Supabase DB is IPv6-only for direct connections; local access requires the pooler URL
- Render free tier spins down after inactivity (50s cold start)
- `.env.render` is a local reference file, NOT synced to Render automatically
- Render does NOT auto-deploy from GitHub; must use Manual Deploy button
