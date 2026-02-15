# WhiteClaws Security Review

## Scope
Code-level review of auth, authz, secrets handling, encryption, and web3-related controls in Next.js app/API + Supabase migrations.

## Executive Summary
- Current platform has meaningful security building blocks (API key hashing, wallet signature checks, SIWE nonce, encrypted payload support), but several critical production gaps remain.
- Most severe issues are around open write endpoints, weak authorization boundaries in some protocol endpoints, and incomplete onchain trust assumptions.

## Findings

### Blocker

#### 1) Open protocol creation endpoint without authentication
- `POST /api/protocols` allows unauthenticated inserts into `protocols`.
- Evidence: `app/api/protocols/route.ts:54` (no auth extraction/verification before insert).
- Risk:
  - Untrusted actors can spam fake protocols, poison listing data, and bypass protocol registration process.
- Recommendation:
  - Require authenticated identity + role check or disable this endpoint in production.

#### 2) Access mint endpoint grants SBT-style access without auth or payment proof
- `/api/access/mint` allows any caller to mint/access-grant any wallet address by POST body.
- Evidence: `app/api/access/mint/route.ts:8`, `app/api/access/mint/route.ts:55`, `app/api/access/mint/route.ts:91`.
- Risk:
  - Access gating can be bypassed trivially; airdrop qualification can be gamed.
- Recommendation:
  - Require signed wallet challenge + payment verification (onchain receipt checks), plus anti-abuse rate limiting.

#### 3) Incomplete RLS/policy coverage for new airdrop/referral/points tables
- Core tables in initial schema enable RLS and policies, but later migration tables lack equivalent policy definitions.
- Evidence:
  - RLS enabled in `supabase/migrations/0001_initial_schema.sql:145`.
  - Airdrop tables created in `supabase/migrations/006_airdrop_system.sql:9` onward without policy blocks.
- Risk:
  - If anon/authenticated clients hit these tables directly, access model may be inconsistent or overly permissive depending on project defaults.
- Recommendation:
  - Add explicit `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + least-privilege policies for all new tables.

### High

#### 4) Protocol dashboard relies on localStorage API keys and slug
- Protocol admin UI reads API key and slug from browser localStorage and uses them for privileged actions.
- Evidence: `app/app/protocol/dashboard/page.tsx:25`, `app/app/protocol/findings/page.tsx:33`, `app/app/protocol/settings/page.tsx:19`.
- Risk:
  - API keys exposed to XSS/local compromise; accidental key leakage in browser environments.
- Recommendation:
  - Move protocol auth to server session (wallet/SIWE), use short-lived tokens, avoid long-lived localStorage secrets.

#### 5) SIWE nonce/state is in-memory only
- SIWE and X OAuth state stores are in-memory maps.
- Evidence: `lib/auth/siwe.ts:24`, `lib/x/verification.ts:27`.
- Risk:
  - Multi-instance deployments can break verification flows; restart loses nonce/state; potential auth reliability and replay edge cases.
- Recommendation:
  - Move nonce/state to Redis or Supabase table with TTL and one-time-use semantics.

#### 6) X verification flow trusts tweet ID without content proof
- Verification marks status as verified without validating tweet content.
- Evidence: `lib/x/verification.ts:196` comment and `lib/x/verification.ts:203` update flow.
- Risk:
  - Users can claim verification without actually posting required wallet-binding proof.
- Recommendation:
  - Fetch tweet text/author and verify expected template + wallet fragment + handle before marking verified.

#### 7) Claims/airdrop cryptography uses SHA-256 fallback and placeholder proofs
- Merkle utilities use SHA-256 fallback and return empty proof/amount placeholders in user proof API.
- Evidence: `lib/claims/merkle.ts:116`, `lib/claims/merkle.ts:257`.
- Risk:
  - Not compatible with expected EVM merkle-claim standards; claim logic is not production-safe.
- Recommendation:
  - Use keccak256-compatible implementation and persist deterministic proof snapshots.

#### 8) Input validation inconsistent across API surface
- Only selected routes use strict schema validation (zod). Many endpoints trust ad hoc body parsing.
- Evidence:
  - Zod usage in `app/api/findings/route.ts:11`.
  - Raw `req.json()` and manual checks in `app/api/protocols/register/route.ts:14`, `app/api/protocols/[slug]/program/route.ts:37`, `app/api/agents/register/route.ts:15`.
- Risk:
  - Data-shape drift, unexpected writes, and potential business logic bypass.
- Recommendation:
  - Standardize zod schemas per endpoint and enforce strict parsing.

### Medium

#### 9) Wallet login UX not wired to real wallet auth flow
- Login presents “Connect Wallet” but currently shows placeholder “coming soon”.
- Evidence: `app/login/LoginForm.tsx:18`.
- Risk:
  - Product claims mismatch, users fallback to weaker/social paths unexpectedly.
- Recommendation:
  - Wire actual Privy wallet connect and SIWE issuance for dashboard access.

#### 10) API key rate limiting claim not fully enforced at key layer
- README claims key-level request limits, but key verification path does not enforce per-key RPS/hour limits.
- Evidence:
  - Claimed in `README.md` rate limiting section.
  - `lib/auth/api-key.ts` verifies/revokes but no request counters.
- Risk:
  - Abuse/automation pressure at API layer.
- Recommendation:
  - Add centralized middleware-based rate limits keyed by API key prefix/user/IP.

#### 11) Secrets are mixed in runtime paths with nullable guards
- Admin client uses `NEXT_PUBLIC_SUPABASE_URL` + service role key, and many routes assume env presence.
- Evidence: `lib/supabase/admin.ts:13`.
- Risk:
  - Misconfiguration can silently degrade auth logic; operational fragility.
- Recommendation:
  - Fail fast on server boot in production if critical env missing; add startup health checks.

#### 12) Protocol registration returns private encryption key in API response
- Private key is returned to caller as plaintext once.
- Evidence: `app/api/protocols/register/route.ts:145`.
- Risk:
  - If transport/client logging compromised, key leak possible.
- Recommendation:
  - Keep one-time return, but add explicit client-side key generation option and secure key ceremony guidance.

### Low

#### 13) Missing endpoint referenced by component
- `XShareButton` posts to `/api/points/record-share`, but route does not exist.
- Evidence: `components/dashboard/XShareButton.tsx:54`.
- Risk:
  - Silent feature failure and telemetry blind spots.
- Recommendation:
  - Add endpoint or remove dead call.

#### 14) Deprecated and unused auth wrapper component
- `components/PrivyProvider.tsx` deprecated and not used.
- Evidence: `components/PrivyProvider.tsx:1`.
- Risk:
  - Maintenance confusion, drift.
- Recommendation:
  - Remove or clearly archive as legacy.

## Web3-Specific Risk Check
- Signature replay: wallet signature includes method/path/timestamp and 5-min window (`lib/auth/wallet-signature.ts:16`) -> good baseline.
- Chain mismatch: SIWE message uses Chain ID 8453 (`lib/auth/siwe.ts:66`) but server-side business logic largely ignores chain-context downstream.
- Address spoofing: many access/claim endpoints trust raw `address` query/body without signature (`app/api/access/status/route.ts:10`, `app/api/claims/status/route.ts:10`).
- Token gating bypass: current SBT gating is largely DB-backed and mint flow unauthenticated; contract addresses are unset (`lib/web3/config.ts:15`).

## Compliance/Operational Notes
- Social OAuth and wallet identity coexist; ensure privacy terms explicitly state handling of wallet, social IDs, and linkage tables (`x_verifications`).
- Add retention/data deletion policy for submissions, notification logs, and sybil flags.

## Recommended Security Priorities
1. Close open write endpoints (`/api/protocols`, `/api/access/mint`) and enforce signed auth.
2. Add RLS/policies for all post-initial migration tables.
3. Replace localStorage API key admin UX with session-based server auth.
4. Finish X verification proof checks and claim cryptography correctness.
5. Add uniform zod validation and global rate-limiting middleware.

