# Wiring Gap Map (Routes -> Data -> UI)

Audit date: 2026-02-13  
Source-of-truth: existing audit docs in `docs/audit/` (especially `docs/audit/WEBSITE_AUDIT_REPORT.md`, `docs/audit/GAP_ANALYSIS_MATRIX.md`, `docs/audit/SECURITY_REVIEW.md`).

Goal: map **what’s implemented** (pages, APIs, tables, libs) vs **what’s actually surfaced** in the UI, and highlight concrete wiring mismatches with evidence.

---

## 1) Route Inventory (UI Pages)

Notes:
- “Supabase server client” below refers to `lib/supabase/server` (anon key + cookies/SSR).
- “Supabase admin client” refers to `lib/supabase/admin` (service role, bypasses RLS; server-only).

### Public marketing/content routes

| Route | Primary UI | Data source(s) | Calls | Wiring gaps / risks |
|---|---|---|---|---|
| `/` | Landing components | Static content | None | Most “live” surfaces are previews; no strong wiring issues found in quick scan. |
| `/about` | About page | Static | None | None. |
| `/docs` | Docs page | Static | None | None. |
| `/learn` + `/learn/[id]` | Learn library | Static MD/content | None | None. |
| `/platform` + `/platform/[slug]` | Platform pages | Static | None | None. |

### Programs / protocols / submission routes

| Route | Primary UI | Data source(s) | Calls | Wiring gaps / risks |
|---|---|---|---|---|
| `/bounties` | `app/bounties/page.tsx` | Supabase (preferred) or JSON fallback | Uses `getBounties()` with fallback to `getJSONBounties()` (`app/bounties/page.tsx:9`) | **Detail link mismatch:** grid links to `/protocols/${b.id}` not `/bounties/${slug}`. See `components/BountyGrid.tsx:108-112`. |
| `/bounties/[slug]` | `app/bounties/[slug]/page.tsx` | Supabase admin client | Queries `protocols`, `programs`, `program_scopes`, `findings` (`app/bounties/[slug]/page.tsx:11-46`) | Page exists and is rich, but underutilized due to link mismatch above. |
| `/protocols` | `app/protocols/page.tsx` | JSON bounties only | None | Listing is **not Supabase-backed** even though `protocols` table exists; this is a product surface divergence (`app/protocols/page.tsx:8-20`). |
| `/protocols/[id]` | `app/protocols/[id]/page.tsx` + `components/protocol/ProtocolDetailClient.tsx` | JSON file corpus + enrichment JSON | Reads `data/merged_enrichment.json` and JSON protocol objects (`app/protocols/[id]/page.tsx:24-44`) | Intentional: detail pages use JSON (“Supabase only stores flat listing fields”). See `app/protocols/[id]/page.tsx:24-29`. |
| `/submit` | `app/submit/page.tsx` | Mixed: public JSON + Supabase fallback | Calls `/api/bounties/[slug]` for encryption key (`app/submit/page.tsx:100-105`) and writes to Supabase directly (`app/submit/page.tsx:148-169`) | **Auth/RLS mismatch:** client inserts into `findings` using anon client; sets `researcher_id` to `authUser?.id || 'anonymous'` (`app/submit/page.tsx:145-166`). This is likely blocked by RLS (insert policy expects `researcher_id = auth.uid()` per `supabase/migrations/0001_initial_schema.sql:164-167`). |

### Community / discovery routes

| Route | Primary UI | Data source(s) | Calls | Wiring gaps / risks |
|---|---|---|---|---|
| `/agents` | `app/agents/page.tsx` | Supabase server client or mock | Reads `users` + `agent_rankings` (`app/agents/page.tsx:39-49`) | Works if RLS allows. Links to `/app/agents` “Agent Dashboard” but that dashboard is mock-only (`app/agents/page.tsx:150`). |
| `/agents/[handle]` | `app/agents/[handle]/page.tsx` | Supabase server client or mock | Reads `users` + `agent_rankings` (`app/agents/[handle]/page.tsx:69-80`) | “Recent Activity” is placeholder text (`app/agents/[handle]/page.tsx:184-188`). Backend exists for findings/points but not surfaced here. |
| `/leaderboard` | `app/leaderboard/page.tsx` + `app/leaderboard/LeaderboardLive.tsx` | API-driven | (not fully traced here) likely uses `/api/points/leaderboard` or `/api/leaderboard` | Validate wiring in Phase 1: ensure the leaderboard is using the canonical scoring table (`contribution_scores`) and displays expected season/week. |
| `/researchers` | `app/researchers/page.tsx` | Static constants | None | Disconnected from real points/leaderboard system (`app/researchers/page.tsx:3-18`). |
| `/resources` | `app/resources/page.tsx` | Static audits array | None | **Not wired** to `resources` table, even though a detail page reads `resources` from Supabase (`app/resources/[id]/page.tsx:29-35`) and migration seeds audits into `resources` (`supabase/migrations/0003_audit_reports.sql:4`). |
| `/resources/[id]` | `app/resources/[id]/page.tsx` | Supabase server client or mock | Reads `resources` table (`app/resources/[id]/page.tsx:29-44`) | Index/detail mismatch above. |
| `/worldboard` | `app/worldboard/page.tsx` | Static threads | None | Index is entirely mock (`app/worldboard/page.tsx:4-8`) while detail tries Supabase `messages` (`app/worldboard/[id]/page.tsx:23-44`). |
| `/worldboard/[id]` | `app/worldboard/[id]/page.tsx` | Supabase server client or mock | Reads `messages` with join to `users(handle)` (`app/worldboard/[id]/page.tsx:28-43`) | RLS currently restricts `messages` selects to protocol members (see `supabase/migrations/0001_initial_schema.sql:168-173`), so anon reads may return nothing; page falls back to `mockThread`. |

### Auth + account routes

| Route | Primary UI | Data source(s) | Calls | Wiring gaps / risks |
|---|---|---|---|---|
| `/login` | `app/login/page.tsx` + `app/login/LoginForm.tsx` | Supabase Auth | Supabase email+OAuth; wallet login is stub | Wallet connect is explicitly “coming soon” (`app/login/LoginForm.tsx:19-23`), despite Privy being configured in `app/Providers.tsx:25-44`. |
| `/dashboard` | `app/dashboard/page.tsx` + `app/dashboard/DashboardContent.tsx` | API-driven + localStorage | Reads localStorage `wc_agent_api_key` (`app/dashboard/DashboardContent.tsx:84-92`) | Dashboard depends on an API key, but there is no UI onboarding to generate/store it. |
| `/claim` | `app/claim/page.tsx` | Claim APIs (stubbed) | Calls claim APIs | Claim flow is mostly placeholder per audit docs (source-of-truth). |

### App shell routes (`/app/*`)

| Route | Primary UI | Data source(s) | Calls | Wiring gaps / risks |
|---|---|---|---|---|
| `/app` | `app/app/page.tsx` | Static | None | Dashboard stats are hardcoded (`app/app/page.tsx:11-24`). |
| `/app/access` | `app/app/access/page.tsx` | Privy hook + access APIs | Calls `/api/access/status` and `/api/access/mint` (`app/app/access/page.tsx:24-30`) | `/api/access/mint` is a security blocker: unauth/bypassable (see `app/api/access/mint/route.ts:8-95`). |
| `/app/agents` | `app/app/agents/page.tsx` | Local state + placeholder wallet | Calls `createAgentWallet()` (`app/app/agents/page.tsx:23`) | Not connected to real agent APIs; wallet generation is fake (`lib/web3/wallet.ts:20-27`). |
| `/app/settings` | `app/app/settings/page.tsx` | Placeholder UI | None | Not wired to any profile update endpoints (agent profile API exists: `app/api/agents/me/route.ts:59-89`). |
| `/app/protocol/*` | `app/app/protocol/*` | localStorage + protocol APIs | Stores `wc_protocol_slug` + `wc_protocol_api_key` (`app/app/protocol/dashboard/page.tsx:28-31`) | Protocol registration returns API key but does not persist it; dashboard requires manual paste (`app/app/protocol/register/page.tsx:35-53` + `app/app/protocol/dashboard/page.tsx:55-74`). Auth model is API-key heavy. |

---

## 2) Disconnected / Orphan Modules (Implemented but not surfaced)

1. `components/dashboard/XShareButton.tsx` calls missing endpoint `/api/points/record-share` (`components/dashboard/XShareButton.tsx:53-59`) and is not mounted anywhere.
2. `components/AuthWrapper.tsx` implements a Privy-backed AuthProvider but is unused anywhere in the app (no imports found via repo search).
3. `components/PrivyProvider.tsx` is deprecated/unused (per audit; validate in repo search).
4. `lib/web3/client.ts` is explicitly a stub scaffold (“TODO: implement”) (`lib/web3/client.ts:25-47`).
5. Agent API surface is real but UI is mock:
   - APIs: `app/api/agents/register/route.ts`, `app/api/agents/me/route.ts`, `app/api/agents/keys/route.ts`.
   - UI: `app/app/agents/page.tsx` uses in-memory list and fake wallet.

---

## 3) Highest-Value Wiring Fixes (Phase 1 candidates)

These are “wiring-only” wins (no new scope):

1. Fix bounty card links to use `/bounties/[slug]` (detail page already exists). Evidence: `components/BountyGrid.tsx:108-112`.
2. Wire `/resources` index to Supabase `resources` table (detail already queries it). Evidence: `app/resources/page.tsx:4-58` vs `app/resources/[id]/page.tsx:29-44`.
3. Wire `/app/agents` to existing agent APIs and store `wc_agent_api_key` so `/dashboard` can function. Evidence: `/dashboard` reads localStorage `wc_agent_api_key` (`app/dashboard/DashboardContent.tsx:84-92`).
4. Persist protocol API key/slug after protocol registration to remove manual copy/paste in protocol dashboard. Evidence: `app/app/protocol/register/page.tsx:35-53` and `app/app/protocol/dashboard/page.tsx:28-31`.
5. Fix `/submit` to use a server route handler for inserts (so RLS/auth expectations are met) instead of direct client-side inserts. Evidence: `app/submit/page.tsx:145-169` vs RLS expectations in `supabase/migrations/0001_initial_schema.sql:164-167`.

