# Supabase Compatibility Checklist (RLS + Policies + Server/Client Separation)

Audit date: 2026-02-13  
Scope: concrete checklist for Phase 1 wiring and Vercel/Supabase compatibility.

Source-of-truth audit docs:
- `docs/audit/SECURITY_REVIEW.md` (RLS gaps, open endpoints)
- `docs/audit/WEBSITE_AUDIT_REPORT.md`

---

## 1) Supabase Client Separation Rules (This Repo)

### Server-only (service role, bypasses RLS)
- `lib/supabase/admin.ts` uses `SUPABASE_SERVICE_ROLE_KEY` and **must never be imported into client components** (`lib/supabase/admin.ts:1-5`, `lib/supabase/admin.ts:15-20`).
- Any route using this client must implement its own AuthN/AuthZ checks (API key, session, etc.) because RLS is bypassed.

### Server SSR (anon key, subject to RLS)
- `lib/supabase/server.ts` (used by server components/pages) should be used for public reads or authenticated cookie-based reads.
- RLS must be correct for any data surfaced by SSR pages.

### Browser client (anon key, subject to RLS)
- `lib/supabase/client.ts` is used by client components and `hooks/useAuth.ts`.
- Any direct browser writes to tables must be covered by explicit RLS insert/update policies, or they will fail at runtime.

---

## 2) Tables Referenced by App Code (Must Be Consistent with RLS/Policies)

The following tables are referenced by code via `.from('<table>')` calls across `app/` and `lib/` (see repo-wide search results).

### Core marketplace tables (created in `supabase/migrations/0001_initial_schema.sql`)
RLS is enabled for these in the initial schema (`supabase/migrations/0001_initial_schema.sql:145-152`), and policies exist for some operations.

Checklist:
- `users`
  - Used by: `/agents`, `/agents/[handle]`, auth resolution, agent APIs, access APIs.
  - RLS: enabled (`0001_initial_schema.sql:145`).
  - Policy gaps to verify:
    - Insert policy for `users` is not shown in the initial policy block; client-side inserts may fail.
    - Risk example: unused `components/AuthWrapper.tsx` attempts client-side insert into `users` (`components/AuthWrapper.tsx:53-67`).

- `protocols`
  - Used by: `/bounties/[slug]` (admin), `/api/protocols/*`, `/submit` fallback.
  - RLS: enabled (`0001_initial_schema.sql:146`).
  - Phase 1 requirement: lock down open write endpoints that bypass any intended gating (see `/api/protocols` POST).

- `findings`
  - Used by: `/submit` (browser write), protocol/agent APIs, points engine.
  - RLS: enabled (`0001_initial_schema.sql:147`).
  - Policy in initial schema suggests inserts must match `auth.uid()` (`0001_initial_schema.sql:164-167`).
  - Risk example: `/submit` inserts with `researcher_id: authUser?.id || 'anonymous'` (`app/submit/page.tsx:145-166`) which will likely violate RLS unless authenticated correctly.

- `messages`
  - Used by: `/worldboard/[id]` (`app/worldboard/[id]/page.tsx:28-33`).
  - RLS: enabled (`0001_initial_schema.sql:148`).
  - Policy appears to restrict reads to protocol members (`0001_initial_schema.sql:168-173`), which blocks public listing/detail unless explicitly designed as public.

- `resources`
  - Used by: `/resources/[id]` (`app/resources/[id]/page.tsx:29-35`).
  - RLS: enabled and “viewable by all” is present (`0001_initial_schema.sql:149` + `0001_initial_schema.sql:176-178`).
  - Gap: `/resources` index page is static and not wired to table (UI wiring, not DB).

- `agent_rankings`
  - Used by: `/agents`, `/leaderboard` APIs.
  - RLS: enabled (`0001_initial_schema.sql:151`).

- `audit_logs`
  - RLS: enabled (`0001_initial_schema.sql:152`).

### Extended protocol scope tables (created in `supabase/migrations/0004_protocol_details.sql`)
RLS is explicitly enabled for these (`supabase/migrations/0004_protocol_details.sql:69-71`) and select policies allow public reads (`0004_protocol_details.sql:73-75`).

Checklist:
- `protocol_contracts`
- `protocol_rules`
- `severity_criteria`

### Post-initial tables used by points/referrals/anti-sybil
These appear in later migrations, but **RLS enable/policy blocks are not present** in at least two migration files:
- `supabase/migrations/001_submission_points_engine.sql` creates tables but does not enable RLS in the snippet scanned (e.g., `participation_events`, `contribution_scores`, `spam_flags`, `anti_sybil_flags`).
- `supabase/migrations/006_airdrop_system.sql` creates tables and seeds `season_config` but does not enable RLS/policies in the file (`supabase/migrations/006_airdrop_system.sql:9-160`).

Tables to explicitly review for RLS/policies before wiring any browser reads/writes:
- `access_sbt` (`006_airdrop_system.sql:9`)
- `participation_events` (`006_airdrop_system.sql:29` and also created in `001_submission_points_engine.sql:35`)
- `contribution_scores` (`006_airdrop_system.sql:50` and also created in `001_submission_points_engine.sql:54`)
- `referral_links` (`006_airdrop_system.sql:73`)
- `referral_rewards` (`006_airdrop_system.sql:88`)
- `x_verifications` (`006_airdrop_system.sql:107`)
- `anti_sybil_flags` (`006_airdrop_system.sql:127` and also in `001_submission_points_engine.sql:102`)
- `season_config` (`006_airdrop_system.sql:146`)
- `spam_flags` (`001_submission_points_engine.sql:77`)
- `finding_notifications` (`001_submission_points_engine.sql:17`)

**Important migration hygiene note**
- The same tables appear in multiple migrations (e.g., `participation_events`, `contribution_scores`, `anti_sybil_flags` exist in both `001_submission_points_engine.sql` and `006_airdrop_system.sql`).
- Phase 1 should treat this as a **compatibility hazard**: ensure the database matches the expected schema and that only one canonical definition is applied in production (or that the definitions are identical).

---

## 3) Storage Buckets (Compatibility)

The submission flow uploads encrypted blobs to Supabase Storage bucket `findings`:
- `app/submit/page.tsx:175-178` uses `supabase.storage.from('findings').upload(...)`.

Checklist:
- Bucket `findings` exists.
- Storage policies allow:
  - authenticated users to upload only their own submissions (or only via server route),
  - protocols to read encrypted blobs only when authorized,
  - anon users: typically **no write**.

---

## 4) Phase 1 RLS/Policy Checklist (Concrete)

For every table that Phase 1 wiring would surface in the UI (especially via browser client), confirm:

1. RLS enabled: `ALTER TABLE <t> ENABLE ROW LEVEL SECURITY;`
2. Explicit policies exist for the required actions:
   - `SELECT` public vs authenticated vs owner-only
   - `INSERT` only with `auth.uid()` ownership checks (or disallow and route through server)
   - `UPDATE/DELETE` owner/admin only
3. If a route handler uses `lib/supabase/admin`, ensure the handler is protected (API key/session) because RLS is bypassed.

---

## 5) “Do Not Do This” Rules (Avoid Vercel/Supabase Footguns)

1. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client (no `NEXT_PUBLIC_*`).
2. Do not import `lib/supabase/admin.ts` from any `'use client'` module.
3. Avoid browser direct writes to `findings/users/...` unless RLS is intentionally designed for it; prefer server route handlers with strict validation.

