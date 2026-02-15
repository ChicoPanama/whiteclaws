# Phase 1 Execution Tasks (Wiring-Only)

Audit date: 2026-02-13  
Phase 1 constraints (absolute):
- No new product scope (only wiring/connecting what already exists).
- No token contract work.
- No Coinbase/CDP implementation (plan/spec only; see `docs/audit/COINBASE_CDP_INTEGRATION_BLUEPRINT.md`).
- No new airdrop implementation.
- No commits in this phase plan document (but tasks are grouped into small, reviewable “commit units”).
- Every route touched must include AuthN/AuthZ/RLS/validation/secrets checks.

Definition of done:
- Users can navigate without dead links.
- Existing APIs that already exist become reachable from UI where intended.
- Security blockers are closed (at least “block obvious bypass”).
- `npm run build` remains green on Vercel configuration (`next.config.js` uses `dist/`).

---

## 0) Security Blockers (Must Land First)

### Commit Unit S1: Close Open Write Endpoints

- [ ] **Gate `POST /api/protocols`**
  - Goal: prevent unauthenticated protocol insertion.
  - Evidence: `app/api/protocols/route.ts:54-85` performs insert with no auth checks.
  - Scope boundaries: do not remove the endpoint; just require authorization.
  - Likely files: `app/api/protocols/route.ts`
  - Security checks:
    - AuthN: require `ADMIN_API_KEY` (pattern already exists in admin routes via `process.env.ADMIN_API_KEY`) or require a verified API key with an explicit admin scope.
    - AuthZ: only allow admin actors to create protocols.
    - Validation: add strict schema validation (zod) for body fields (slug format, URL format).
    - Secrets: never accept service-role key from client; only read env on server.
  - Supabase checklist:
    - Use `lib/supabase/admin` server-only, already used.
    - Ensure RLS assumptions are documented: admin bypasses RLS, so handler is the gate.
  - Vercel compatibility:
    - Do not import browser-only modules.
  - Validation:
    - `npm run build`
    - `curl -X POST /api/protocols` without auth should return `401/403`.

- [ ] **Gate `POST /api/access/mint`**
  - Goal: stop trivial access/SBT-grant bypass.
  - Evidence: `app/api/access/mint/route.ts:8-95` allows any caller to mint/access-grant any address.
  - Scope boundaries: do not add payment verification yet; only ensure caller proves control of `address`.
  - Likely files: `app/api/access/mint/route.ts`, optionally `lib/auth/wallet-signature.ts` and/or `app/api/auth/*` for reuse.
  - Security checks:
    - AuthN: require either:
      - wallet signature headers verified by `lib/auth/wallet-signature.ts:36-70`, or
      - a SIWE verification flow (existing endpoints: `app/api/auth/challenge/route.ts`, `app/api/auth/verify/route.ts`) and a server-stored session token (if available).
    - AuthZ: require “signed address == requested address”.
    - Validation: zod schema for body `{ address, payment_token?, tx_hash? }`.
    - Rate limiting: minimal per-IP throttle (even coarse) on this high-risk path.
  - Supabase checklist:
    - Ensure `access_sbt` table RLS/policies are defined before any browser access is allowed (see “RLS patch” below).
  - Validation:
    - `npm run build`
    - Negative tests: request without signature should fail.
    - Positive: signed request should succeed for that address only.

### Commit Unit S2: RLS/Policy Patch for Post-Initial Tables

- [ ] **Add explicit RLS enablement + least-privilege policies for points/referral/airdrop tables already referenced by code**
  - Goal: ensure tables referenced by APIs/UI have explicit access control.
  - Evidence: `supabase/migrations/006_airdrop_system.sql:9-160` creates tables without RLS/policy blocks; `supabase/migrations/001_submission_points_engine.sql:17+` creates additional tables without RLS/policy blocks.
  - Scope boundaries: do not add new tables/features; only enable RLS + add minimal policies to match current usage patterns.
  - Likely files: add a new migration under `supabase/migrations/` (do not rename existing files).
  - Security checks:
    - Define what is public vs authenticated vs admin-only reads:
      - `contribution_scores`: likely public select for leaderboard, or authenticated select only (product decision).
      - `participation_events`, `spam_flags`: likely owner-only select or admin-only.
      - `x_verifications`: owner-only select; admin review surfaces are API-only.
      - `referral_*`: owner-only.
      - `access_sbt`: owner-only select by `user_id` or `wallet_address`.
  - Supabase checklist:
    - Ensure no table remains in “default policy” ambiguity.
    - Resolve duplicate definitions between `001_submission_points_engine.sql` and `006_airdrop_system.sql` (must match schema).
  - Validation:
    - `npm run build`
    - Supabase SQL: confirm `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` applied and policies exist.

---

## 1) Wiring Fixes (No New Scope)

### Commit Unit W1: Fix Broken Routing / Dead Links

- [ ] **Fix bounty cards to link to bounty detail route**
  - Goal: make `/bounties/[slug]` reachable from the main grid.
  - Evidence: `components/BountyGrid.tsx:108-112` links to `/protocols/${b.id}` while bounty detail exists at `/bounties/[slug]` (`app/bounties/[slug]/page.tsx`).
  - Scope boundaries: do not change visual design; only fix the href and data mapping.
  - Likely files: `components/BountyGrid.tsx`, potentially `lib/data/types.ts` (ensure `slug` is present on `Bounty`).
  - Security checks:
    - None (routing only).
  - Vercel compatibility:
    - None.
  - Validation:
    - `npm run build`
    - Click through from `/bounties` to a detail page without 404.

### Commit Unit W2: Wire Resources Index to Existing `resources` Table

- [ ] **Replace static `/resources` list with Supabase-backed reads**
  - Goal: surface the data that already exists in Supabase and is used by the detail route.
  - Evidence:
    - Index is static (`app/resources/page.tsx:4-58`).
    - Detail queries Supabase `resources` (`app/resources/[id]/page.tsx:29-44`).
    - Migration seeds audits into `resources` (`supabase/migrations/0003_audit_reports.sql:4-84`).
  - Scope boundaries: preserve the existing list UX; only change data source and keep a safe fallback if Supabase env is missing.
  - Likely files: `app/resources/page.tsx`
  - Security checks:
    - Ensure only public-safe columns are selected.
    - Confirm `resources` RLS policy allows public select (initial schema includes “viewable by all”: `supabase/migrations/0001_initial_schema.sql:176-178`).
  - Supabase checklist:
    - Use `lib/supabase/server` (NOT admin) for public reads.
  - Validation:
    - `npm run build`
    - With env configured: `/resources` renders rows coming from Supabase.

### Commit Unit W3: Make Protocol Registration Feed Protocol Dashboard (localStorage wiring)

- [ ] **Persist protocol slug + API key after registration**
  - Goal: remove manual copy/paste requirement.
  - Evidence:
    - Registration returns `api_key` (`app/app/protocol/register/page.tsx:35-53`).
    - Dashboard reads `wc_protocol_slug` + `wc_protocol_api_key` from localStorage (`app/app/protocol/dashboard/page.tsx:28-31`).
  - Scope boundaries: no new auth model; keep API key approach for now.
  - Likely files: `app/app/protocol/register/page.tsx`, `app/app/protocol/dashboard/page.tsx`
  - Security checks:
    - Note: storing long-lived keys in localStorage is not ideal; Phase 1 should at least add warnings and avoid logging it.
    - Ensure any API calls that require key include `Authorization: Bearer <key>` consistently.
  - Validation:
    - `npm run build`
    - After registering: dashboard loads without re-entering slug/key.

### Commit Unit W4: Wire Agent Dashboard to Existing Agent APIs

- [ ] **Replace `/app/agents` mock-only state with calls to existing agent endpoints**
  - Goal: make agent identity + keys reachable from UI without adding new features.
  - Evidence:
    - UI is in-memory mock + fake wallet generation (`app/app/agents/page.tsx:13-35`, `lib/web3/wallet.ts:20-27`).
    - APIs exist for registration and profile/keys:
      - `POST /api/agents/register` (`app/api/agents/register/route.ts:13-91`)
      - `GET/PATCH /api/agents/me` (`app/api/agents/me/route.ts:12-89`)
      - `GET/POST/DELETE /api/agents/keys` (`app/api/agents/keys/route.ts:13-74`)
    - Dashboard depends on localStorage `wc_agent_api_key` (`app/dashboard/DashboardContent.tsx:84-92`).
  - Scope boundaries:
    - No new agent capabilities; just make existing registration + key management reachable.
    - Do not implement “trustless wallet” yet (keep as placeholder but clearly label it).
  - Likely files: `app/app/agents/page.tsx`, `app/dashboard/DashboardContent.tsx`
  - Security checks:
    - Input validation for agent registration form (client + server already validates in route).
    - Prevent leaking API keys in logs/telemetry.
    - Consider minimal rate-limiting on `POST /api/agents/register` (abuse surface).
  - Wiring bug to fix:
    - `/dashboard` fetch uses `apiKey` state before it’s updated; it should use `storedKey` for the request headers (`app/dashboard/DashboardContent.tsx:84-121`).
  - Validation:
    - `npm run build`
    - Register agent from UI -> key is stored -> `/dashboard` shows findings/points widgets without manual header hacking.

### Commit Unit W5: Route `/submit` Through Existing Server Submission Endpoint

- [ ] **Stop direct browser inserts into `findings`; use `POST /api/findings`**
  - Goal: make submissions compatible with RLS/auth and consistent validation.
  - Evidence:
    - Direct insert happens client-side (`app/submit/page.tsx:145-169`).
    - Server submission route exists with zod + session check (`app/api/findings/route.ts:11-65`).
  - Scope boundaries:
    - Keep encryption behavior; just move DB insert behind server endpoint.
    - Do not add new submission fields/features.
  - Likely files: `app/submit/page.tsx`, `app/api/findings/route.ts` (only if schema alignment needed)
  - Security checks:
    - AuthN: require Supabase session (already in `/api/findings`, `app/api/findings/route.ts:35-41`).
    - Validation: keep zod strict schema.
    - Storage: confirm bucket policy allows uploads only for authorized users or move upload to server route (if required by RLS/policy).
  - Validation:
    - `npm run build`
    - Submit flow succeeds when logged in; unauthorized submission is rejected with `401`.

---

## 2) Phase 1 Validation Checklist (Minimum)

- [ ] `npm run build` (must pass with Vercel `dist/` configuration)
- [ ] Manual smoke:
  - [ ] `/bounties` -> click a card -> `/bounties/[slug]` renders.
  - [ ] `/resources` list renders from Supabase (when env set) and `/resources/[id]` still works.
  - [ ] `/app/protocol/register` -> dashboard loads without re-entering slug/key.
  - [ ] `/app/agents` can register + store API key; `/dashboard` shows data (where available).
  - [ ] `/app/access` “Request Access” fails without signature/auth after S1 fixes.

