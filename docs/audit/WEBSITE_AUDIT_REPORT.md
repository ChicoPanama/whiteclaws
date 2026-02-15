# WhiteClaws End-to-End Website Audit Report

## Audit Date
- 2026-02-13

## Method
- Full repo inventory (routes, components, libs, migrations, scripts).
- Wiring trace: page imports, API calls, Supabase usage, endpoint reachability.
- Vision comparison against `README.md` and roadmap docs.
- Security posture review across auth/authz/encryption/web3 boundaries.

## Current Product State (What Exists)

### Platform surfaces currently available
- Broad route coverage in App Router (36 UI pages + 53 API routes).
- Agent and protocol APIs for registration, findings lifecycle, comments, payouts, scope/program management.
- Supabase-backed data model with both core marketplace tables and airdrop/points/referral tables.
- Dashboard widgets for points, SBT status, activity, referral.
- Static content library: protocols JSON corpus, audit PDFs, heroes dataset.

### Reality check
- The project has substantial breadth but uneven depth: many features exist as partially connected flows, placeholders, or dual-mode stubs awaiting onchain deployment.

## Key Findings

## 1) What Exists but Is Not Wired Into UI

### Finding 1 — Disconnected dashboard share component and missing API
- Severity: **Medium**
- `components/dashboard/XShareButton.tsx` posts to `/api/points/record-share`, but that endpoint does not exist and the component is not mounted.
- Evidence: `components/dashboard/XShareButton.tsx:54`; no matching route under `app/api/points/*`.

### Finding 2 — Deprecated Privy provider component unused
- Severity: **Low**
- `components/PrivyProvider.tsx` is explicitly deprecated and unused.
- Evidence: `components/PrivyProvider.tsx:1`.

### Finding 3 — Unused/underused feature components
- Severity: **Low**
- Several reusable feature components appear disconnected from route tree: `EncryptUpload`, `SubmissionWizard`, `MessageBoard`, `ProtocolCard`, `ResourceCard`, `LeaderboardTable`, `UserMenu`.
- Evidence: component inventory + import scan.

### Finding 4 — Bounty detail route split and underused
- Severity: **Medium**
- `/bounties/[slug]` exists with rich program details, but `BountyGrid` links to `/protocols/[id]` instead of bounty detail path.
- Evidence: `app/bounties/[slug]/page.tsx:1`, `components/BountyGrid.tsx:104`.

## 2) README/Vision Claims vs Missing Reality

### Finding 5 — Token contract and claim contracts are not built/wired
- Severity: **Blocker**
- Config uses null placeholders for `wcToken`, `accessSBT`, `airdropClaim`; no Solidity contracts in repo.
- Evidence: `lib/web3/config.ts:15`; contract wiring doc is future-facing (`docs/CONTRACT_WIRING.md:1`); no `.sol` files found.

### Finding 6 — Wallet-first login claim is not fully true
- Severity: **High**
- Login shows wallet button but intentionally returns “coming soon.”
- Evidence: `app/login/LoginForm.tsx:18`.

### Finding 7 — Airdrop/claim flow is mostly placeholder
- Severity: **High**
- Claim page contains stub action and “not deployed” logic; merkle proof API returns placeholder amount/proof.
- Evidence: `app/claim/page.tsx:136`, `app/api/claims/proof/route.ts:6`, `lib/claims/merkle.ts:257`.

### Finding 8 — Coinbase Developer Platform integration absent
- Severity: **High**
- No CDP references or integration modules in codebase.
- Evidence: repository search returned no Coinbase/CDP matches.

## 3) Partially Implemented / Stubbed / Disconnected Features

### Finding 9 — Trustless agent wallet is currently a demo placeholder
- Severity: **High**
- `createAgentWallet()` builds deterministic fake address string; no secure custody/signing boundaries.
- Evidence: `lib/web3/wallet.ts:23`, consumed by `app/app/agents/page.tsx:20`.

### Finding 10 — Protocol dashboard auth model is localStorage API-key based
- Severity: **High**
- Protocol pages rely on `wc_protocol_api_key` and slug in localStorage instead of session/role-bound auth.
- Evidence: `app/app/protocol/dashboard/page.tsx:25`, `app/app/protocol/findings/page.tsx:33`, `app/app/protocol/settings/page.tsx:19`.

### Finding 11 — Duplicate submission paths create inconsistent behavior
- Severity: **Medium**
- Two submission routes exist with different schemas/storage conventions:
  - `/api/findings` (zod validated, session auth)
  - `/api/agents/submit` (API-key auth, points/notifications flow)
- Evidence: `app/api/findings/route.ts:11`, `app/api/agents/submit/route.ts:16`.

### Finding 12 — Some pages still hardcoded/static while DB-backed equivalents exist
- Severity: **Medium**
- `worldboard` and `resources` index pages are static arrays while detail pages query Supabase.
- Evidence: `app/worldboard/page.tsx:4`, `app/resources/page.tsx:3`, versus `app/worldboard/[id]/page.tsx:28`, `app/resources/[id]/page.tsx:29`.

## 4) Security/Compliance Gaps

### Finding 13 — Unauthenticated write endpoint (`/api/protocols` POST)
- Severity: **Blocker**
- Direct protocol insert route has no auth checks.
- Evidence: `app/api/protocols/route.ts:54`.

### Finding 14 — Access minting bypasses auth/payment enforcement
- Severity: **Blocker**
- `/api/access/mint` grants/creates access and SBT records for arbitrary submitted address.
- Evidence: `app/api/access/mint/route.ts:16`, `app/api/access/mint/route.ts:55`.

### Finding 15 — Incomplete RLS/policy lifecycle for newer tables
- Severity: **Blocker**
- Initial schema has RLS/policies; airdrop/points/referral migrations omit explicit RLS/policies.
- Evidence: `supabase/migrations/0001_initial_schema.sql:145`, `supabase/migrations/006_airdrop_system.sql`.

### Finding 16 — X verification can be marked verified without content proof
- Severity: **High**
- `verifyTweet()` currently trusts `tweet_id` and sets verified status.
- Evidence: `lib/x/verification.ts:196`.

### Finding 17 — Inconsistent API validation coverage
- Severity: **Medium**
- Only selected routes use zod; many endpoints parse body manually.
- Evidence: `app/api/findings/route.ts:11` vs `app/api/protocols/register/route.ts:14`, `app/api/protocols/[slug]/program/route.ts:37`.

### Finding 18 — Merkle hash implementation not EVM-final
- Severity: **High**
- `keccak256()` helper uses SHA-256 fallback comment, not production EVM hashing path.
- Evidence: `lib/claims/merkle.ts:116`.

## Disconnected Code Section
- `components/PrivyProvider.tsx`
- `components/dashboard/XShareButton.tsx`
- `lib/privy.ts` (server Privy verification helper appears unused)
- Static-heavy pages bypassing richer existing APIs:
  - `/worldboard` (static)
  - `/resources` (static)
  - `/app/agents` (in-memory demo)

## Missing Core Capability Section

### Token + revenue + gating
- No shipped token contract or claim contract code.
- Access minting still DB-centric and bypassable.
- Claim allocations/proofs are placeholders.

### Trustless wallet boundaries
- No custody model docs/implementation for agent key management.
- No separation of “agent execution key” vs “treasury/payout key.”

### Dashboards
- Airdrop/points dashboard exists as API + widgets, but has endpoint gaps and non-final claim/onchain settlement.
- Agent profile dashboard is partly real (public profile) and partly mock/demo (app agents page).

### Coinbase Developer Platform
- No existing integration.
- No wallet infrastructure or CDP primitives in code.

## Verification Results (read-only checks)
- `git status --short --branch`: repo has pre-existing modified files (`app/layout.tsx`, `next.config.js`, `package.json`, `scripts/pull-coingecko-contacts.cjs`).
- `tree -L 4`: unavailable (`tree` not installed), replaced with `find` inventory.
- `npm test`: failed (`Missing script: "test"`).
- `npx tsc --noEmit`: passed.
- `npm run lint`: blocked by interactive Next ESLint setup prompt (no configured lint workflow).

## Top 10 Gaps (Condensed)
1. Unauthenticated `POST /api/protocols`.
2. Unauthenticated/bypassable access mint flow.
3. Missing explicit RLS/policies on newer airdrop/referral/points tables.
4. No deployed/wired token + claim contracts.
5. Claim proof/merkle implementation still placeholder.
6. Trustless agent wallet not implemented (demo address generation).
7. Protocol dashboard security model depends on localStorage API keys.
8. Wallet login path still “coming soon.”
9. X verification does not validate tweet content proof.
10. Missing Coinbase Developer Platform integration.

