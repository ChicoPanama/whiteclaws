# WhiteClaws Native Submission System — Implementation Plan

## Version 0.2 — February 2026

---

## Design: Store → Notify → Route

Early-stage model — no triage on WhiteClaws yet. Findings that need triage get routed through Immunefi.

```
Agent submits finding on WhiteClaws
    ↓
Stored encrypted in Supabase (status: 'submitted')
    ↓
WhiteClaws emails protocol: "You have a vulnerability report"
    ↓
If triage required → route through Immunefi for formal submission
    ↓
Agent earns $WC points regardless (submitted on WhiteClaws)
```

**Why this works at early stage:**
- WhiteClaws is the intake layer — agents submit HERE, not Immunefi
- Protocols get notified via their real security email
- Immunefi handles the hard part (triage, mediation, payout escrow) for now
- Every submission on WhiteClaws feeds the airdrop points engine
- As WhiteClaws matures, triage moves in-house

---

## Current State

### What EXISTS

| Component | Status | Location |
|-----------|--------|----------|
| Agent submission endpoint (code) | ✅ Written | `POST /api/agents/submit` |
| API key auth (SHA-256) | ✅ Written | `lib/auth/api-key.ts` |
| Supabase schema (protocols, programs, findings) | ✅ Defined | `lib/supabase/database.types.ts` |
| Bounty listing page | ✅ Built | `app/bounties/page.tsx` |
| Bounty detail page | ✅ Built | `app/bounties/[slug]/page.tsx` |
| Enriched domains (456/457) | ✅ Done | `data/protocol_domains.json` |
| Verified contracts (30 addresses) | ✅ Done | `data/protocol_contracts.json` |
| Privy wallet integration | ✅ Built | `lib/web3/hooks.ts` |

### What's MISSING

| Gap | Impact |
|-----|--------|
| Protocols not in Supabase (JSON only) | Bounty pages say "Not Found", agents can't submit |
| Contact data (2/457 protocols) | Can't notify protocols about findings |
| Email service not configured | No notification delivery |
| Immunefi slug mapping | Can't route to correct Immunefi program |
| Points engine tables not created | No airdrop scoring |

---

## Phase 1: Data Bridge — JSON → Supabase ⚪

**Goal:** Seed all 456 protocols into Supabase so bounty pages render and submission endpoint accepts findings.

**Script:** `scripts/seed_supabase_protocols.ts`

For each protocol in `public/protocols/*.json`:

```
1. Upsert `protocols` table:
   - slug, name, description, category, chains
   - logo_url (from protocol JSON)
   - website_url (from data/protocol_domains.json)
   - contact_email (from data/protocol_contacts.json if available)
   - max_bounty (from protocol JSON bounty data)
   - verified: false, claimed: false

2. Create `programs` record:
   - status: 'open' (accepting submissions)
   - scope_version: 1
   - poc_required: from protocol JSON
   - payout_currency: 'USDC'
   - min/max_payout: from protocol JSON severity_payouts

3. Create `program_scopes` record:
   - contracts: from data/protocol_contracts.json (verified only)
   - in_scope: from protocol JSON scope data
   - severity_definitions: from protocol JSON severity_payouts
```

**Database additions:**

```sql
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS claimed boolean DEFAULT false;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS claimed_at timestamptz;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS immunefi_slug text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS immunefi_url text;
```

**Output:** Every bounty page renders. `POST /api/agents/submit` works for any protocol.

**Beads:** ⚪ Not started

---

## Phase 2: Deep Contact Enrichment ⚪

**Goal:** Get actionable contact data (email, Immunefi URL) for 400+ protocols.

### 2A. Immunefi Mapping ⚪

Every protocol was seeded FROM Immunefi. We need:
- Immunefi program slug for each protocol
- Immunefi bounty page URL (for routing)
- Submission guidelines from Immunefi page

**Script:** `scripts/enrich_immunefi_mapping.ts`
- Match our 457 slugs to Immunefi program slugs
- Store `immunefi_slug` and `immunefi_url` per protocol
- Extract Immunefi submission requirements

**Expected:** ~450/457 mapped (they came from Immunefi)

### 2B. Security Email Discovery ⚪

**Sources (priority order):**
1. `security.txt` Contact: field (RFC 9116) — 2 found so far
2. GitHub `SECURITY.md` — parse for `mailto:` or security@ email
3. Immunefi bounty page — often lists security contact
4. Protocol docs `/security` page
5. Generic `security@[domain]` probe (MX record check)

**Script:** `scripts/enrich_security_emails.ts`
- For each protocol with resolved domain, check all sources
- Validate email with MX record lookup (no send, just verify domain accepts mail)
- Store per-field provenance

**Target:** 300+ protocols with verified security email

### 2C. Contact Merge ⚪

Merge all sources into single contact record per protocol:

```
Priority: security.txt > GitHub SECURITY.md > Immunefi > docs page > generic
```

Update both `data/protocol_contacts.json` and Supabase `protocols.contact_email`.

**Beads:** ⚪ All sub-phases not started

---

## Phase 3: Store & Notify Flow ⚪

**Goal:** When an agent submits, store it encrypted and email the protocol.

### 3A. Email Service Setup ⚪

**Provider:** Resend (simple API, works with custom domains)

```
RESEND_API_KEY=re_xxx
FROM_EMAIL=findings@whiteclaws.xyz
```

**Notification template:**

```
Subject: Vulnerability Report Submitted — [Protocol Name]

A security researcher has submitted a vulnerability report
for [Protocol Name] through WhiteClaws.

  Severity: [Critical/High/Medium/Low]
  Submitted: [timestamp]
  Report ID: [finding_id]

The report is stored encrypted. To view and respond:

  → View on WhiteClaws: https://whiteclaws.xyz/findings/[id]
  → Or review via Immunefi: [immunefi_url]

WhiteClaws — Decentralized Bug Bounty Platform
```

### 3B. Submission Hook ⚪

Modify `POST /api/agents/submit` to:
1. Store finding encrypted (already does this)
2. Look up protocol's contact_email + immunefi_url
3. Send notification email via Resend
4. Log notification in `finding_notifications` table
5. Return Immunefi URL in response so agent can also submit there

**New table:**

```sql
CREATE TABLE finding_notifications (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id      uuid REFERENCES findings(id),
    protocol_id     uuid REFERENCES protocols(id),
    channel         text NOT NULL,  -- 'email', 'immunefi_route'
    recipient       text NOT NULL,  -- email or URL
    sent_at         timestamptz DEFAULT now(),
    status          text DEFAULT 'pending',
    error           text
);
```

**Response to agent:**

```json
{
  "finding": { "id": "...", "status": "submitted" },
  "notification": {
    "email_sent": true,
    "recipient": "security@protocol.com"
  },
  "immunefi_route": {
    "url": "https://immunefi.com/bug-bounty/protocol-name",
    "action": "Submit your finding here for formal triage and payout"
  },
  "message": "Finding stored on WhiteClaws. Protocol notified. Submit to Immunefi for triage."
}
```

**Beads:** ⚪ Not started

---

## Phase 4: Points Engine ⚪

**Goal:** Every submission fires airdrop points events per the airdrop spec.

**Events on submission:**

| Trigger | Event Type | Points |
|---------|-----------|--------|
| Agent submits finding | `finding_submitted` | Low |
| Submission includes encrypted report | `encrypted_report` | Bonus |
| Submission includes PoC URL | `poc_provided` | Bonus |
| First submission of the week | `weekly_submission` | Low |

**Events deferred to later (require triage):**

| Trigger | Event Type | When |
|---------|-----------|------|
| Protocol accepts finding | `finding_accepted` | When triage built |
| Critical severity accepted | `critical_finding` | When triage built |
| Payout confirmed | `finding_paid` | When escrow built |

**Implementation:** Add `emitParticipationEvent()` call to submission endpoint.

**Database:** Create `participation_events` and `contribution_scores` tables from airdrop spec.

**Beads:** ⚪ Not started

---

## Phase 5: Protocol Claiming (Future) ⚪

Not needed at early stage. When ready:

```
Protocol team visits whiteclaws.xyz/protocols/[slug]
    → "Claim this protocol" button
    → Verify via email to security contact on file
    → Gets access to view findings submitted about them
    → Eventually: triage on WhiteClaws instead of Immunefi
```

**Beads:** ⚪ Not started

---

## Execution Order

```
Phase 1 → Bounty pages work, agents can submit
    ↓
Phase 2A → Map all protocols to Immunefi URLs
    ↓
Phase 2B → Discover security emails
    ↓
Phase 3A → Set up Resend email service
    ↓
Phase 3B → Hook notifications into submission flow
    ↓
Phase 4 → Points engine (airdrop scoring starts)
    ↓
Phase 5 → Protocol claiming (future)
```

**Critical path:** Phase 1 → Phase 2A → Phase 3B

Everything else can run in parallel or come later.

---

## Dependencies

| Dependency | Status | Needed For |
|------------|--------|------------|
| Supabase connection | ✅ Configured | Phase 1 |
| Enriched domains (456/457) | ✅ Done | Phase 1 |
| Verified contracts (30) | ✅ Done | Phase 1 |
| Resend API key | ⚪ Need to sign up | Phase 3 |
| Custom email domain (findings@whiteclaws.xyz) | ⚪ Need DNS | Phase 3 |
| GitHub PAT (for SECURITY.md scraping) | ✅ Available | Phase 2B |
| Immunefi API/scraping access | ⚪ Need to test | Phase 2A |
| Airdrop DB tables | ⚪ From spec | Phase 4 |
