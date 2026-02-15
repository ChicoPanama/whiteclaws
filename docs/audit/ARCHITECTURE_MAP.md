# WhiteClaws Architecture Map

## 1) Repository Structure (high level)
- `app/`: Next.js App Router UI + API routes (`app/api/*`).
- `components/`: reusable UI components + dashboard widgets.
- `lib/`: auth, Supabase clients, data loaders, points, referral, sybil, web3 shims.
- `supabase/migrations/`: SQL schema/migration history.
- `scripts/`: data ingestion/enrichment/sync tooling (Immunefi + contacts + enrichment).
- `data/` and `public/`: static datasets (protocol JSONs, audits, heroes) used by UI fallback paths.
- `backend/` and `cli/`: auxiliary schema/CLI packages, not wired into Next runtime.

## 2) Route Inventory

### UI routes (`app/**/page.tsx`)
- Public: `/`, `/about`, `/bounties`, `/bounties/[slug]`, `/protocols`, `/protocols/[id]`, `/platform`, `/platform/[slug]`, `/learn`, `/learn/[id]`, `/resources`, `/resources/[id]`, `/heroes`, `/worldboard`, `/worldboard/[id]`, `/agents`, `/agents/[handle]`, `/leaderboard`, `/docs`, `/researchers`, `/submit`, `/claim`, `/login`.
- Auth/app shell: `/dashboard`, `/app`, `/app/agents`, `/app/access`, `/app/settings`, `/app/protocol/register`, `/app/protocol/dashboard`, `/app/protocol/findings`, `/app/protocol/findings/[id]`, `/app/protocol/scope`, `/app/protocol/settings`, `/app/protocol/payouts`.
- Notes:
  - No legacy `pages/` directory found.
  - 36 UI routes discovered.

### API routes (`app/api/**/route.ts`)
- 53 routes discovered across: `access`, `agents`, `protocols`, `findings`, `bounties`, `points`, `referral`, `claims`, `x`, `admin`, `sbt`, auth/discovery.

## 3) Page Wiring Map (UI -> data/API)

### Fully static/marketing pages (no live data)
- `/about`, `/docs`, `/platform`, `/researchers`, `/worldboard`.
- Evidence: `app/about/page.tsx:1`, `app/docs/page.tsx:1`, `app/platform/page.tsx:1`, `app/researchers/page.tsx:1`, `app/worldboard/page.tsx:1`.

### Server-rendered pages using Supabase directly
- `/agents`, `/agents/[handle]`, `/resources/[id]`, `/worldboard/[id]`, `/bounties/[slug]`.
- Evidence: `app/agents/page.tsx:39`, `app/agents/[handle]/page.tsx:69`, `app/resources/[id]/page.tsx:29`, `app/worldboard/[id]/page.tsx:28`, `app/bounties/[slug]/page.tsx:11`.

### Hybrid/static fallback pages
- `/bounties` uses `getBounties()` with JSON fallback to static protocol files.
- `/protocols` and `/protocols/[id]` rely heavily on static JSON and filesystem data.
- Evidence: `app/bounties/page.tsx:9`, `lib/data/bounties.ts:59`, `app/protocols/page.tsx:5`, `app/protocols/[id]/page.tsx:3`.

### Client pages calling API routes
- `/dashboard`: `/api/bounties`, `/api/sbt/status`, `/api/agents/findings`, `/api/agents/earnings`, `/api/points/me`.
  - Evidence: `app/dashboard/DashboardContent.tsx:66`, `app/dashboard/DashboardContent.tsx:74`, `app/dashboard/DashboardContent.tsx:89`, `app/dashboard/DashboardContent.tsx:104`, `app/dashboard/DashboardContent.tsx:116`.
- `/claim`: `/api/claims/status`.
  - Evidence: `app/claim/page.tsx:29`.
- `/submit`: `/api/bounties/[slug]` plus direct Supabase insert/upload.
  - Evidence: `app/submit/page.tsx:100`, `app/submit/page.tsx:154`, `app/submit/page.tsx:176`.
- `/app/protocol/*`: primarily localStorage-driven API-key calls.
  - Evidence: `app/app/protocol/dashboard/page.tsx:25`, `app/app/protocol/findings/page.tsx:33`, `app/app/protocol/settings/page.tsx:19`, `app/app/protocol/scope/page.tsx:22`.

### Stub/demo pages
- `/app/agents` generates fake local wallet addresses and in-memory agent rows; no backend persistence.
  - Evidence: `app/app/agents/page.tsx:11`, `lib/web3/wallet.ts:23`.

## 4) Component / Module Map

### Core app shell and auth
- `app/Providers.tsx` wraps Privy + React Query.
- `hooks/useAuth.ts` uses Supabase session auth.
- `components/AuthGuard.tsx` guards client pages via Supabase user session.
- Evidence: `app/Providers.tsx:1`, `hooks/useAuth.ts:1`, `components/AuthGuard.tsx:1`.

### Security & submission
- Encryption helpers in `lib/crypto.ts` (NaCl box primitives).
- Agent submission API in `app/api/agents/submit/route.ts`.
- Program key rotation API in `app/api/protocols/[slug]/rotate-key/route.ts`.
- Evidence: `lib/crypto.ts:1`, `app/api/agents/submit/route.ts:16`, `app/api/protocols/[slug]/rotate-key/route.ts:14`.

### Points/airdrop layer
- Event + score engines in `lib/services/points-engine.ts`, `lib/points/engine.ts`, `lib/points/scores.ts`.
- Public/private points APIs in `app/api/points/*`.
- UI widgets in `components/dashboard/*`.

### Web3 layer
- Contract config and placeholders in `lib/web3/config.ts` + `lib/web3/contracts/*`.
- Access gating UI/hooks in `lib/web3/hooks.ts`, `lib/web3/access.ts`, `/app/access`.

## 5) Supabase Schema Map -> UI/Features

### Core bounty lifecycle tables used by UI/API
- `users`, `protocols`, `programs`, `program_scopes`, `findings`, `protocol_members`, `finding_comments`, `api_keys`, `agent_rankings`.
- Evidence: type declarations in `lib/supabase/database.types.ts:12`, `lib/supabase/database.types.ts:227`, `lib/supabase/database.types.ts:286`, `lib/supabase/database.types.ts:310`.

### Airdrop/points tables
- `access_sbt`, `participation_events`, `contribution_scores`, `referral_links`, `referral_rewards`, `x_verifications`, `anti_sybil_flags`, `season_config`, `spam_flags`, `finding_notifications`.
- Evidence: `supabase/migrations/006_airdrop_system.sql:9`, `supabase/migrations/006_airdrop_system.sql:29`, `supabase/migrations/006_airdrop_system.sql:146`, `supabase/migrations/001_submission_points_engine.sql:17`, `supabase/migrations/001_submission_points_engine.sql:77`.

### Schema gaps
- Early migrations enable RLS for core tables, but later tables (airdrop/points/referral) are created without explicit RLS/policies in migration files.
- Evidence: `supabase/migrations/0001_initial_schema.sql:145`, and absence of policy/RLS statements in `supabase/migrations/006_airdrop_system.sql`.

## 6) Scripts / Cron-like Jobs -> UI linkage
- Data ingestion scripts (`scripts/immunefi-sync.mjs`, enrichment scripts, contacts/domain builders) mainly feed Supabase/data artifacts; not invoked by runtime UI.
- Admin/cron APIs exist for recalculation/snapshot/retention:
  - `/api/admin/points/weekly`, `/api/admin/points/recalculate`, `/api/admin/season/snapshot`, `/api/admin/x/retention`.
- UI does not expose admin operations; they are header-secret driven.

## 7) Disconnected Modules (unwired or weakly wired)
- `components/PrivyProvider.tsx` (explicitly deprecated and unused).
  - Evidence: `components/PrivyProvider.tsx:1`.
- `components/dashboard/XShareButton.tsx` references missing API `/api/points/record-share` and is not imported.
  - Evidence: `components/dashboard/XShareButton.tsx:54`; no route file exists under `app/api/points/record-share`.
- Legacy/unused UI primitives likely not reachable from routes:
  - `components/EncryptUpload.tsx`, `components/SubmissionWizard.tsx`, `components/MessageBoard.tsx`, `components/ProtocolCard.tsx`, `components/ResourceCard.tsx`, `components/LeaderboardTable.tsx`, `components/UserMenu.tsx`.
- `lib/privy.ts` server verification helper appears unused.
  - Evidence: `lib/privy.ts:1` and no imports across `app/` routes.
- `lib/web3/contracts/airdrop-claim.ts` + `lib/web3/contracts/access-sbt.ts` are placeholder dual-mode shims with TODO onchain paths.

## 8) API Reachability Snapshot
- Routes with effectively no observed UI/docs callers in repo include:
  - `/api/admin/points/recalculate`, `/api/admin/season/snapshot`, `/api/admin/sybil/flags`, `/api/admin/sybil/review`, `/api/admin/x/retention`, `/api/claims/proof`, `/api/points/estimate`, `/api/referral/apply`, `/api/referral/stats`, `/api/x/auth`, `/api/x/status`, `/api/x/verify-tweet`.
- Some are valid back-office endpoints but currently not surfaced in product UI.

