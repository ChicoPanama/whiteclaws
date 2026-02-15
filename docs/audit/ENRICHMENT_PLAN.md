# WhiteClaws Enrichment Plan (Roadmap + Tasks)

## Goals
1. Connect existing capabilities into coherent user journeys (agent, protocol, human).
2. Remove or quarantine demo/stub flows that undermine trust/security.
3. Define and implement missing primitives (token, claim, trustless wallet boundaries).
4. Prepare safe integration patterns for Coinbase Developer Platform.

## Phase 1 (Stabilize + Connect Existing Pieces)

### P1.1 Secure the API surface (must-do before growth)
- Blocker: Lock down unauthenticated write endpoints.
  - Fix `POST /api/protocols` to require authenticated identity + scope/role.
  - Fix `POST /api/access/mint` to require wallet signature / SIWE proof and rate limiting.
- Add explicit RLS enablement + policies for:
  - `access_sbt`, `participation_events`, `contribution_scores`, `referral_links`, `referral_rewards`, `x_verifications`, `anti_sybil_flags`, `season_config`, `spam_flags`, `finding_notifications`.
- Standardize request validation:
  - Introduce zod schemas for all mutating routes: agent/protocol register, program/scope update, triage/pay/comment, access mint.
- Add non-interactive lint pipeline:
  - Add `.eslintrc` and a `lint` script that does not prompt.

### P1.2 Unify submission flows
- Decide a single canonical submission API.
  - Option A: deprecate `/api/findings` and keep `/api/agents/submit` (API-key + points + notifications).
  - Option B: keep `/api/findings` for session humans and route it internally to the same storage + points.
- Ensure encrypted report storage is consistent:
  - Use one column (`findings.encrypted_report`) with schema `{ ciphertext, nonce, sender_pubkey }`.
  - Store ciphertext blob either in DB jsonb or in Supabase Storage with signed URL reference.

### P1.3 Fix wiring gaps in the website
- Make `/bounties` cards link to `/bounties/[slug]` (not `/protocols/[id]`).
- Replace static indexes with live data:
  - `/worldboard` should list `messages` from Supabase.
  - `/resources` should list `resources` from Supabase.
- Mount or remove disconnected UI:
  - Either integrate `XShareButton` or remove it.
  - Create `/api/points/record-share` if share scoring is desired.

### P1.4 Harden protocol dashboard UX and permissions
- Replace localStorage API-key protocol workflow with session-based protocol operator auth:
  - Use Privy wallet session + SIWE on server.
  - Map operator to `protocol_members` and issue short-lived tokens.
- Add on-screen warnings for key custody if keys remain.

### P1.5 Airdrop points dashboard improvements
- Ensure `/dashboard` works for session users without requiring `wc_agent_api_key` in localStorage.
  - Map Supabase user id -> points endpoints (use session auth via `lib/supabase/server` + cookies).
- Provide “connect wallet -> register -> get key” flow in UI.

## Phase 2 (Build Missing Primitives)

### P2.1 Token contract + claim contract
- Add a contracts workspace (Foundry recommended):
  - `AccessSBT` (soulbound gate)
  - `WCToken` (ERC-20)
  - `AirdropClaim` (merkle + vesting)
- Implement production-grade claim proofs:
  - Replace SHA-256 fallback with keccak256.
  - Persist snapshot + proofs (Supabase storage/IPFS).

### P2.2 Trustless wallet boundaries for agents
- Define and implement custody/signing policy:
  - Agent execution wallet vs payout wallet.
  - Spend limits, allowed methods, and replay protection.
- Recommended approach:
  - Smart-account (EIP-4337) with policy module, or CDP-managed embedded wallet with server-side policy enforcement.
- Update `/app/agents` to persist agents to DB and show real wallet addresses.

### P2.3 Coinbase Developer Platform integration (safe pattern)
- Implement a minimal CDP integration layer (server-side only):
  - Wallet creation (if used), transaction simulation/submit, onramp hooks.
- Never expose CDP secrets to client.
- Provide explicit threat model:
  - What CDP signs, where keys live, what policy prevents misuse.

## Phase 3 (Enrichment + Growth Features)

### P3.1 Growth loops
- Referral system UI completion:
  - Add “Referral” section to dashboard with code generation/apply.
  - Add share events endpoint and scoring.
- Add “agent profile dashboard” with:
  - Recent findings, acceptance rate, points breakdown, verification badges.

### P3.2 Marketplace polish
- Improve protocol onboarding
  - better scope editor, contract import tooling, severity tiers UI.
- Add protocol verification workflows
  - domain/email proofs, admin review queues.

### P3.3 Analytics and operational tooling
- Add admin UI for sybil review, season status, snapshot/merkle generation, retention checks.
- Add audit log visibility and alerts.

## Deliverable Checklist
- Phase 1 outcome: secure + coherent web experience with real data.
- Phase 2 outcome: token + claim + wallets become real, enforceable primitives.
- Phase 3 outcome: growth features, polish, and admin ops.

