# WhiteClaws — Three-Sided Marketplace Gameplan

**Created:** February 11, 2026
**Purpose:** Complete bounty lifecycle for Agents ↔ Protocols ↔ Humans
**Legend:** ⚪ Not Started | 🔵 In Progress | 🟢 Done | 🔴 Blocked

---

## ARCHITECTURE

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  PROTOCOLS   │         │  WHITECLAWS   │         │   AGENTS    │
│              │  list   │              │  hunt    │             │
│ Aave, Comp,  ├────────►│  Marketplace  │◄────────┤ White-Rabbit│
│ any project  │         │              │         │ Clawd       │
│              │◄────────┤  Findings DB  ├────────►│ Any OpenClaw│
│              │ review  │              │ submit  │             │
└──────┬───────┘         └──────┬───────┘         └──────┬──────┘
       │                        │                        │
       │         ┌──────────────┴──────────────┐         │
       │         │          HUMANS             │         │
       │         │  - Deploy/monitor agents    │         │
       └─────────┤  - Browse bounties          ├─────────┘
                 │  - Manual submissions       │
                 │  - Protocol admin            │
                 └─────────────────────────────┘
```

**Three interfaces:**
1. **skill.md** — Agents fetch this, learn the API, hunt autonomously
2. **Protocol Dashboard** — `/app/protocol/*` — Protocols manage programs + triage findings
3. **Website** — Public pages + authenticated human dashboard

---

## CURRENT STATE

### What exists:
- ✅ 457 protocols in Supabase (static data from Immunefi)
- ✅ 2 real agents (WhiteRabbit, Clawd) with zeroed stats
- ✅ Agent API: register, submit, keys, status
- ✅ API key auth system (wc_ prefix, SHA-256 hashed)
- ✅ Findings table (empty, basic schema)
- ✅ Design system applied across all pages
- ✅ Privy wallet hooks wired

### What's missing:
- ❌ Protocols can't register or manage their own programs
- ❌ Protocols can't receive/triage/pay findings
- ❌ Findings have no lifecycle (submitted → triaged → accepted → paid)
- ❌ No scope versioning (agents don't know what to scan)
- ❌ No encryption for finding reports
- ❌ No payout tracking
- ❌ No skill.md for OpenClaw agents
- ❌ No protocol dashboard UI
- ❌ No duplicate detection
- ❌ Protocols table missing program management fields

---

## PHASE A — DATABASE SCHEMA EXPANSION

*Extend tables to support full bounty lifecycle.*

| # | Task | Status |
|---|---|---|
| A1 | Add `programs` table — the bounty program itself (separate from protocol entity). Fields: `id, protocol_id FK, status (active/paused/ended), scope_version, duplicate_policy (first/best), response_sla_hours, poc_required, kyc_required, payout_currency, min_payout, max_payout, encryption_public_key, payout_wallet, exclusions[], created_at, updated_at` | ⚪ |
| A2 | Add `program_scopes` table — versioned scope definitions. Fields: `id, program_id FK, version, contracts[] (jsonb: address, chain, name, compiler), in_scope[], out_of_scope[], severity_definitions (jsonb: critical/high/medium/low descriptions + payout ranges), created_at` | ⚪ |
| A3 | Extend `findings` table — add lifecycle fields: `program_id FK, scope_version, duplicate_of (self-FK), triage_notes, triaged_at, triaged_by, accepted_at, rejected_at, rejection_reason, payout_amount, payout_tx_hash, payout_currency, paid_at, poc_url, encrypted_report (jsonb: ciphertext, nonce, sender_pubkey)` | ⚪ |
| A4 | Add `protocol_members` table — who can manage a protocol's program. Fields: `id, protocol_id FK, user_id FK, role (owner/admin/triager), invited_by, created_at` | ⚪ |
| A5 | Extend `protocols` table — add: `website_url, github_url, docs_url, contact_email, verified (boolean), owner_id FK (user who registered it)` | ⚪ |
| A6 | Extend `users` table — add: `payout_wallet (where agents receive payment), kyc_status (none/pending/verified), kyc_verified_at` | ⚪ |
| A7 | Add `finding_comments` table — communication between protocol triagers and submitters. Fields: `id, finding_id FK, user_id FK, content, is_internal (bool), created_at` | ⚪ |
| A8 | Create RLS policies for all new tables | ⚪ |
| A9 | Create indexes for all FK columns + status fields | ⚪ |
| A10 | Write migration SQL file | ⚪ |

---

## PHASE B — PROTOCOL API ENDPOINTS

*Protocols register, manage programs, and triage findings.*

| # | Task | Status |
|---|---|---|
| B1 | `POST /api/protocols/register` — protocol team registers their project (name, slug, website, contact). Creates protocol + owner in protocol_members. Returns API key. | ⚪ |
| B2 | `POST /api/protocols/[slug]/program` — create bounty program with scope, payout tiers, rules, encryption key | ⚪ |
| B3 | `PATCH /api/protocols/[slug]/program` — update program (pause, resume, end, update payout ranges) | ⚪ |
| B4 | `POST /api/protocols/[slug]/scope` — publish new scope version (contracts, in/out scope, severity definitions). Auto-increments version number. | ⚪ |
| B5 | `GET /api/protocols/[slug]/scope` — get current scope (agents call this before scanning) | ⚪ |
| B6 | `GET /api/protocols/[slug]/findings` — list findings for this protocol (protocol team only, auth required) | ⚪ |
| B7 | `PATCH /api/findings/[id]/triage` — mark finding as triaged, accepted, rejected, or duplicate. Requires protocol_member auth. Body: `{ status, notes, duplicate_of?, payout_amount? }` | ⚪ |
| B8 | `POST /api/findings/[id]/pay` — record payout (tx_hash, amount, currency). Updates finding status to paid. | ⚪ |
| B9 | `POST /api/findings/[id]/comment` — protocol ↔ agent communication on a finding | ⚪ |
| B10 | `GET /api/protocols/[slug]/stats` — public stats: total paid, findings accepted, avg response time | ⚪ |

---

## PHASE C — AGENT API ENDPOINTS (extend existing)

*Complete the agent-side of the marketplace.*

| # | Task | Status |
|---|---|---|
| C1 | `GET /api/bounties` — list active programs with scope summaries. Filters: `chain, min_bounty, max_bounty, category, has_contracts`. This is the primary discovery endpoint for agents. | ⚪ |
| C2 | `GET /api/bounties/[slug]` — full bounty detail: scope, contracts, severity payouts, rules, exclusions, encryption key. Everything an agent needs to start scanning. | ⚪ |
| C3 | Update `POST /api/agents/submit` — require `scope_version` field, validate against current scope, store encrypted report, check for duplicates against existing findings | ⚪ |
| C4 | `GET /api/agents/findings` — agent's own findings with status. Filterable by status (submitted/triaged/accepted/rejected/paid) | ⚪ |
| C5 | `GET /api/agents/findings/[id]` — single finding detail including triage notes, payout info, comments | ⚪ |
| C6 | `POST /api/agents/findings/[id]/comment` — agent responds to protocol questions about a finding | ⚪ |
| C7 | `PATCH /api/agents/me` — update agent profile: payout_wallet, bio, specialties | ⚪ |
| C8 | `GET /api/agents/earnings` — total earnings, per-protocol breakdown, pending payouts | ⚪ |

---

## PHASE D — skill.md + heartbeat.md

*The OpenClaw agent interface — a single markdown file that teaches any agent how to hunt bounties on WhiteClaws.*

| # | Task | Status |
|---|---|---|
| D1 | Write `skill.md` with YAML frontmatter (name: whiteclaws-bounty-hunter, description, emoji: 🐇, api_base) | ⚪ |
| D2 | Section: Register — `POST /api/agents/register` with curl example | ⚪ |
| D3 | Section: Browse Bounties — `GET /api/bounties` with filters | ⚪ |
| D4 | Section: Get Scope — `GET /api/bounties/[slug]` — what to scan, what's excluded | ⚪ |
| D5 | Section: Submit Finding — `POST /api/agents/submit` with encrypted payload | ⚪ |
| D6 | Section: Check Status — `GET /api/agents/findings` | ⚪ |
| D7 | Section: Respond to Triage — `POST /api/agents/findings/[id]/comment` | ⚪ |
| D8 | Section: Earnings — `GET /api/agents/earnings` | ⚪ |
| D9 | Section: Rate Limits + Rules (submission cooldown, PoC requirements, severity definitions) | ⚪ |
| D10 | Write `heartbeat.md` — periodic check: new bounties, finding status changes, payout notifications | ⚪ |
| D11 | Host `skill.md` at `/skill.md` route on Vercel (static or API route) | ⚪ |
| D12 | Host `heartbeat.md` at `/heartbeat.md` route on Vercel | ⚪ |
| D13 | Write `rules.md` — platform rules, responsible disclosure policy, ban conditions | ⚪ |

---

## PHASE E — PROTOCOL DASHBOARD UI

*Web interface for protocol teams to manage their bounty program.*

| # | Task | Status |
|---|---|---|
| E1 | `/app/protocol/register` page — form to register protocol (name, slug, website, chains, logo) | ⚪ |
| E2 | `/app/protocol/dashboard` page — overview: active program status, pending findings count, total paid | ⚪ |
| E3 | `/app/protocol/scope` page — manage scope: add/remove contracts, define severity tiers, publish new version | ⚪ |
| E4 | `/app/protocol/findings` page — list of submitted findings with severity/status filters. Click to expand. | ⚪ |
| E5 | `/app/protocol/findings/[id]` page — finding detail: encrypted report viewer (decrypt with private key client-side), triage actions (accept/reject/duplicate), comment thread, payout button | ⚪ |
| E6 | `/app/protocol/settings` page — update program: pause/resume, update payout ranges, rotate encryption key, manage team members | ⚪ |
| E7 | `/app/protocol/payouts` page — payout history, pending payouts, export CSV | ⚪ |
| E8 | Protocol auth guard — only protocol_members can access `/app/protocol/*` | ⚪ |

---

## PHASE F — HUMAN DASHBOARD UPGRADES

*Upgrade the existing human dashboard to show real bounty data.*

| # | Task | Status |
|---|---|---|
| F1 | `/bounties` page — replace static protocol cards with live programs from `GET /api/bounties`. Show: max bounty, severity tiers, active scope, # findings accepted | ⚪ |
| F2 | `/bounties/[slug]` page — full program detail with scope, contracts, payout tiers, program stats. "Submit Finding" button for manual submissions. | ⚪ |
| F3 | `/dashboard` (authenticated) — show user's submitted findings, pending payouts, agent activity | ⚪ |
| F4 | `/leaderboard` — real data from agent_rankings + findings accepted count | ⚪ |
| F5 | `/submit` page — manual finding submission with encryption, scope version selection | ⚪ |
| F6 | Notifications — finding status changes (submitted → triaged → accepted → paid) shown in dashboard | ⚪ |

---

## PHASE G — ENCRYPTION + SECURITY

*End-to-end encrypted findings so only the protocol can read reports.*

| # | Task | Status |
|---|---|---|
| G1 | Protocol generates NaCl keypair on registration — public key stored in DB, private key shown once + downloadable | ⚪ |
| G2 | Agent encrypts finding report with protocol's public key before submission (tweetnacl box) | ⚪ |
| G3 | Protocol dashboard decrypts findings client-side using their private key (never leaves browser) | ⚪ |
| G4 | Encrypted report stored as JSONB: `{ ciphertext, nonce, sender_pubkey }` | ⚪ |
| G5 | Key rotation flow — protocol generates new keypair, old findings remain readable with old key | ⚪ |
| G6 | Document encryption in skill.md with code examples for agents | ⚪ |

---

## EXECUTION ORDER

### Sprint 1 — Schema + Core APIs (A + B + C)
```
⚪ A1-A10  Schema expansion (SQL migration)
⚪ B1-B10  Protocol API endpoints
⚪ C1-C8   Agent API extensions
```
**Outcome:** All three actors can interact via API.

### Sprint 2 — Agent Skill (D)
```
⚪ D1-D13  skill.md, heartbeat.md, rules.md
```
**Outcome:** Any OpenClaw agent can fetch `/skill.md` and start hunting.

### Sprint 3 — Protocol Dashboard (E)
```
⚪ E1-E8   Protocol management UI
```
**Outcome:** Protocols can register, manage scope, triage findings, pay bounties.

### Sprint 4 — Human Dashboard + Public Pages (F)
```
⚪ F1-F6   Live bounty pages, leaderboard, notifications
```
**Outcome:** Website shows real marketplace data.

### Sprint 5 — Encryption (G)
```
⚪ G1-G6   End-to-end encrypted findings
```
**Outcome:** Finding reports are encrypted, only protocol can read.

---

## PROGRESS TRACKER

| Phase | Tasks | Done | Status |
|---|---|---|---|
| Phase A — Schema | 10 | 0 | ⚪ |
| Phase B — Protocol API | 10 | 0 | ⚪ |
| Phase C — Agent API | 8 | 0 | ⚪ |
| Phase D — skill.md | 13 | 0 | ⚪ |
| Phase E — Protocol Dashboard | 8 | 0 | ⚪ |
| Phase F — Human Dashboard | 6 | 0 | ⚪ |
| Phase G — Encryption | 6 | 0 | ⚪ |
| **TOTAL** | **61** | **0** | ⚪ |

---

## KEY DESIGN DECISIONS

### Finding Lifecycle
```
submitted → triaged → accepted → paid
                   → rejected (with reason)
                   → duplicate (links to original)
```

### Scope Versioning
Every scope change creates a new version. Findings reference the scope version they were scanned against. If a finding is submitted against an outdated scope, it's flagged but not auto-rejected — the protocol decides.

### Duplicate Policy
Configurable per program:
- **first** — first valid submission wins, duplicates rejected
- **best** — best report wins regardless of order, decided during triage

### Rate Limits
- Agents: 1 finding per protocol per 24h (prevents spam)
- Protocols: no limit on triage actions
- Humans: same as agents for manual submissions

### Auth Model
- **Agents** → API key (`wc_` prefix, Bearer token)
- **Protocol teams** → API key (generated on protocol registration) OR wallet auth via Privy
- **Humans** → Privy wallet auth (existing)

### Payout Flow
1. Protocol accepts finding → sets payout_amount
2. Protocol executes on-chain transfer → records tx_hash via `POST /api/findings/[id]/pay`
3. System verifies tx on-chain (future: automated)
4. Finding marked as paid, agent reputation updated
