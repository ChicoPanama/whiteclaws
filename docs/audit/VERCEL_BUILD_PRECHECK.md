# Vercel Build Precheck (Next.js 14 + Supabase)

Audit date: 2026-02-13  
Scope: build/deploy precheck documentation (no code changes).

This repo is configured to build Next.js output into `dist/`:
- `next.config.js:3` sets `distDir: 'dist'`
- `vercel.json:4` sets `"outputDirectory": "dist"`

---

## 1) Required Environment Variables

### A. Core (required for app runtime)
From `.env.example`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`  
  Used by server-only admin client (`lib/supabase/admin.ts:15-20`).
- `NEXT_PUBLIC_PRIVY_APP_ID` (optional for Privy UI; app runs without it)
- `PRIVY_APP_ID` + `PRIVY_APP_SECRET`  
  Used by server Privy client (`lib/privy.ts:6-11`).
- `RESEND_API_KEY` (optional; only needed for notifications)
- `FROM_EMAIL` (has default fallback in code)
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUBMISSION_PUBLIC_KEY` (optional, but required if client encryption expects it)
- `NEXT_PUBLIC_BUILD_STAMP` (optional)

### B. Admin/Cron (required if you call these routes)
Discovered by code search (`process.env.*` usage):
- `ADMIN_API_KEY`  
  Used by admin routes (example: `app/api/admin/sybil/review/route.ts` references `process.env.ADMIN_API_KEY`).
- `ADMIN_SECRET` or `CRON_SECRET`  
  Used by cron-ish routes (example: `app/api/admin/points/weekly/route.ts:13` uses `ADMIN_SECRET || CRON_SECRET`).

### C. X/Twitter verification (required if enabling X verification flows)
- `X_CLIENT_ID`
- `X_CLIENT_SECRET`
- `X_CALLBACK_URL` (optional; defaults to `NEXT_PUBLIC_APP_URL + '/api/x/callback'` in `lib/x/verification.ts:22`)
- `TWITTER_BEARER_TOKEN` (used in `lib/x/verification.ts:277`)

### D. Misc/optional envs referenced in UI
- `NEXT_PUBLIC_PROTOCOL_WALLET`  
  Used in unused `components/AuthWrapper.tsx:87` to compute `isProtocol`.
- `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA`  
  Used for footer build stamp (`components/Footer.tsx:5-6`, `components/landing/Footer.tsx:6-7`). Vercel usually injects it.

### E. Data pipeline scripts (not required for Vercel build)
These are used by scripts under `scripts/` and are typically **not** part of the Vercel build:
- `COINGECKO_API_KEY` (`scripts/pull-coingecko-contacts.cjs:31`)
- `SUPABASE_DB_URL` (`scripts/migrate-add-enrichment-columns.cjs:13`)
- `SUPABASE_URL` / `SUPABASE_KEY` (script fallback in `scripts/seed_supabase_protocols.ts:15-16`)
- `CONTACT_ENRICH_LIMIT` (`scripts/enrich_protocol_contacts.ts:64`)

---

## 2) Known Build/Deploy Hazards in This Repo

### Hazard A: Server-only Supabase admin client requires env at runtime
`lib/supabase/admin.ts` throws if `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is missing (`lib/supabase/admin.ts:15-20`). Many API routes use this client.

Practical implication:
- The build may succeed, but **API routes can hard-fail at runtime** if env vars are missing.

### Hazard B: Mixed auth models increase the chance of runtime-only failures
The app uses:
- Supabase Auth in `hooks/useAuth.ts`
- Privy wallet auth in `app/Providers.tsx` + `lib/web3/hooks.ts`
- API key auth for agents/protocols in many API routes (e.g., `app/api/protocols/[slug]/findings/route.ts:9-33`)

Practical implication:
- Pages can render in “mock mode” or “logged out mode” during build, but production runtime behaviors can diverge sharply if env/config differs.

### Hazard C: Output directory config is non-default
Because Next output is `dist/` (not `.next/`), Vercel must respect:
- `next.config.js:3` (`distDir: 'dist'`)
- `vercel.json:4` (`"outputDirectory": "dist"`)

If Vercel is misconfigured to expect `.next`, it may fail to serve.

---

## 3) Local Verification Commands (Safe/Repeatable)

From repo root:

```bash
# Install (reproducible)
npm ci

# Build
npm run build

# Optional: check what envs your shell has set (do not print secrets in CI logs)
node -e "console.log(['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','NEXT_PUBLIC_APP_URL','PRIVY_APP_ID','PRIVY_APP_SECRET','X_CLIENT_ID','X_CLIENT_SECRET','TWITTER_BEARER_TOKEN','ADMIN_API_KEY','ADMIN_SECRET','CRON_SECRET'].map(k=>[k,process.env[k]?'<set>':'<missing>']))"
```

---

## 4) Recommended Vercel Settings (Non-Scope Guidance)

- Build command: `npm run build` (already in `vercel.json:3`)
- Output directory: `dist` (already in `vercel.json:4`)
- Do not set any CDP/Coinbase env vars yet (Phase 1 constraint); if added later, keep them server-only (no `NEXT_PUBLIC_*`).

