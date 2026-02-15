# Coinbase Developer Platform (CDP) Integration Blueprint

Audit date: 2026-02-13  
Scope: **Blueprint/spec only** (no implementation). Repo: `ChicoPanama/whiteclaws`.

This document does two things:
1. **Forensic proof** of whether Coinbase Developer Platform (CDP) integration exists in this repo today.
2. A concrete **“how CDP was supposed to be implemented”** blueprint that fits WhiteClaws’ existing architecture and README vision, using realistic Coinbase building blocks (OnchainKit, Smart Wallet, Wallet SDK, onchain templates), while staying Vercel-compatible.

---

## 1) Forensic Determination: CDP Integration Present?

### Conclusion
**CDP integration is not implemented in the application code.**

There is **no CDP client**, **no CDP API routes**, **no CDP environment variables**, and **no CDP SDK usage** in `app/` or `lib/`.

### Evidence Found (and what it means)

1. **No CDP imports / modules in app code**
   - Repo-wide search shows no CDP-related imports/usages in `app/`, `lib/`, `components/`, `hooks/` (only audit docs and unrelated dataset strings).
   - Audit’s claim “CDP integration absent” is consistent with current code reality. See `docs/audit/WEBSITE_AUDIT_REPORT.md` (“Finding 8”). (Source-of-truth.)

2. **`@coinbase/cdp-sdk` is not actually installed**
   - `npm ls @coinbase/cdp-sdk` returns empty (no dependency tree).
   - However, `package-lock.json` contains an entry referencing `@coinbase/cdp-sdk` (`package-lock.json:75` and `package-lock.json:152+`). This appears to be **stale lockfile residue** rather than an active app dependency.

3. **Coinbase Wallet SDK exists only as a transitive dependency (not CDP)**
   - `@coinbase/wallet-sdk` is present transitively via `@privy-io/react-auth` and `wagmi` connectors (`npm ls @coinbase/wallet-sdk`).
   - There are **no explicit imports** of Coinbase Wallet SDK in this repo (no `import '@coinbase/wallet-sdk'`), and no visible “Connect Coinbase Wallet” UX.
   - This indicates **wallet connector plumbing exists indirectly**, but not a CDP integration.

4. **No CDP environment variables**
   - `.env.example` includes Supabase + Privy + Resend only. No `COINBASE_*` / `CDP_*` variables. See `.env.example`.

### False Positives in “CDP” text searches (non-integration)
Some files contain the string “CDP” in unrelated contexts (e.g., dataset taxonomy like `'CDP': 'DeFi'` in `scripts/fetch-all-immunefi.mjs:13`). This is **not** Coinbase Developer Platform usage.

---

## 2) What CDP Was Supposed To Look Like (Blueprint)

This blueprint is based on:
- WhiteClaws’ current architecture: Next.js App Router, Supabase (SSR + admin), Privy present but only partially wired, `lib/web3/*` stubs and placeholders.
- WhiteClaws’ existing “wallet + access token/SBT + agents” narrative in code and audit docs:
  - Access flow uses `/app/access` + `/api/access/*` (currently bypassable). See `app/app/access/page.tsx:24` and `app/api/access/mint/route.ts:8`.
  - Web3 config contains null contract placeholders. See `lib/web3/config.ts:15`.
  - “Trustless agent wallet” is currently a demo placeholder. See `lib/web3/wallet.ts:20`.

### 2.1 Intended User Journeys

#### Journey A: User login / wallet connect (researcher)
- User connects wallet (or passkey-based smart wallet).
- Server establishes an authenticated session (Supabase session or Privy session, but **one** canonical identity).
- User can view dashboard + points, and submit findings (encrypted).

Where it would hook today:
- Wallet connect hook exists via Privy: `lib/web3/hooks.ts:29` (uses `usePrivy()` and `useWallets()`).
- Login UX currently does not wire wallet login: `app/login/LoginForm.tsx:19` sets “coming soon”.

#### Journey B: Agent identity + “trustless wallet boundary”
- An “agent” is a user record + an API key + a wallet address used for onchain actions.
- Agent wallet is not a local fake address string; it is created/managed via a real embedded wallet system (Privy embedded wallets or Coinbase Smart Wallet / CDP-managed wallet).
- The “trustless boundary” is enforced by:
  - server-side policy checks (what the agent can do),
  - strict scoping of signing authority,
  - auditable event logs.

Where it would hook today:
- Current demo wallet: `lib/web3/wallet.ts:20` returns fake deterministic address.
- Agent UI is mock-only: `app/app/agents/page.tsx:13` uses in-memory state.
- Agent APIs exist (real): `app/api/agents/register/route.ts:13`, `app/api/agents/me/route.ts:12`, `app/api/agents/keys/route.ts:13`.

#### Journey C: Protocol dashboard access model
- Protocol operator authenticates with wallet/SIWE (recommended) or with a short-lived server-issued token.
- Operator can triage findings, manage scope, and process payouts.
- Today, protocol dashboard uses localStorage API keys: `app/app/protocol/dashboard/page.tsx:28` and related pages.

### 2.2 System Architecture (Client vs Server)

#### Client-side responsibilities
- Wallet connection UI and signature prompts:
  - Realistically done via **OnchainKit** components and/or Privy UI.
- Display-only onchain state (balances, access status) via public RPC or safe read-only routes.
- Never store long-lived secrets (protocol/agent API keys) in `localStorage` for production.

#### Server-side responsibilities (Next.js Route Handlers)
- CDP calls must be **server-only**:
  - any wallet creation / transaction submission / paymaster usage.
  - secrets must never be exposed as `NEXT_PUBLIC_*`.
- AuthN/AuthZ:
  - Verify session (Supabase/Privy) and enforce roles.
  - Enforce that “caller address” matches “authenticated wallet address” to prevent spoofing.
- Logging:
  - Redact secrets, tokens, and signatures.

### 2.3 Coinbase Building Blocks (Plausible Stack)

The plausible intended stack for WhiteClaws (given current repo structure and common ecosystem practice):

1. **OnchainKit**
   - Wallet connect UI, transaction button patterns, identity/address presentation.
   - Hook into `/app/access` and onboarding UIs.

2. **Coinbase Smart Wallet (ERC-4337 + passkeys)**
   - Best fit for “trustless wallet for agents” if agents need a smart account with policy controls.
   - Enables paymaster/bundler patterns for “gasless” actions if desired later.

3. **Coinbase Wallet SDK**
   - Optional, for Coinbase Wallet connection flows if not covered by OnchainKit/Privy.
   - Note: This repo currently includes Coinbase Wallet SDK only transitively and does not configure it.

4. **CDP APIs**
   - Server-managed wallet lifecycle and transaction routing (exact API surfaces depend on CDP product chosen).

### 2.4 Integration Surfaces in THIS Repo (Where CDP Would Hook)

These are concrete seams already present:

- Access gating and minting:
  - UI: `app/app/access/page.tsx`
  - APIs: `app/api/access/status/route.ts`, `app/api/access/mint/route.ts`
  - Web3 contracts shim: `lib/web3/contracts/access-sbt.ts`

- Agent wallets:
  - Placeholder wallet module: `lib/web3/wallet.ts`
  - Agent UI: `app/app/agents/page.tsx` (currently mock)
  - Agent APIs: `app/api/agents/*`

- Contract configuration:
  - `lib/web3/config.ts` contains null placeholders for onchain addresses.

### 2.5 Minimal Scaffolding-Only File Plan (No Implementation)

If/when CDP work begins (NOT Phase 1), a minimal, reviewable scaffolding plan that matches this repo’s layout:

- `lib/cdp/types.ts`
  - Types for “Wallet”, “TransactionRequest”, “Policy”, “Network”.

- `lib/cdp/client.server.ts`
  - Server-only client wrapper.
  - Hard-fails if required env vars missing.

- `app/api/cdp/wallets/route.ts`
  - Server-only proxy: create/list wallets for authenticated user.

- `app/api/cdp/tx/route.ts`
  - Server-only proxy: simulate/submit transactions for authenticated user.

- `lib/cdp/policy.ts`
  - Explicit allow-list of contract addresses + methods (later), tied to WhiteClaws roles.

Env var placeholders (names only; do not add secrets here):
- `CDP_API_KEY` (server-only)
- `CDP_API_SECRET` (server-only)
- `CDP_PROJECT_ID` (server-only)
- `CDP_WEBHOOK_SECRET` (server-only, if webhooks used)

### 2.6 CDP Security Considerations (Non-Negotiables)

If CDP is introduced later, these requirements should be enforced from day 1:

1. **Server-only secrets**
   - No `NEXT_PUBLIC_CDP_*` variables.

2. **AuthZ before CDP calls**
   - Every CDP route must verify:
     - authenticated user (session),
     - role (agent/protocol/admin),
     - resource ownership (wallet belongs to user/agent),
     - target allow-lists (contract/method).

3. **Rate limiting**
   - Apply per-user and per-IP throttles to CDP proxy routes to prevent wallet-drain/DoS.

4. **Request integrity + replay protection**
   - For signature-based operations, require nonce + timestamp window and store one-time nonce (avoid in-memory maps in multi-instance deployments).

5. **Logging redaction**
   - Never log:
     - CDP secrets,
     - OAuth tokens,
     - raw signatures,
     - API keys (agent/protocol).

---

## 3) Phase 1 Boundary Reminder

Phase 1 (per project constraints) must **not** implement CDP. It should only:
- connect existing backend/data to existing UI,
- fix routing/wiring/placeholders,
- close security blockers (authN/authZ/RLS/validation/secrets separation).

