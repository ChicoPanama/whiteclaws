-- ============================================================
-- WhiteClaws Marketplace Migration — Phase A
-- Run in Supabase SQL Editor
-- ============================================================

-- ─── A1: PROGRAMS TABLE ───
-- The bounty program itself, linked to a protocol entity.
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','ended')),
  scope_version INTEGER NOT NULL DEFAULT 0,
  duplicate_policy TEXT NOT NULL DEFAULT 'first' CHECK (duplicate_policy IN ('first','best')),
  response_sla_hours INTEGER NOT NULL DEFAULT 72,
  poc_required BOOLEAN NOT NULL DEFAULT true,
  kyc_required BOOLEAN NOT NULL DEFAULT false,
  payout_currency TEXT NOT NULL DEFAULT 'USDC',
  min_payout NUMERIC NOT NULL DEFAULT 500,
  max_payout NUMERIC NOT NULL DEFAULT 1000000,
  encryption_public_key TEXT,
  payout_wallet TEXT,
  exclusions TEXT[] NOT NULL DEFAULT '{}',
  cooldown_hours INTEGER NOT NULL DEFAULT 24,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(protocol_id)
);

-- ─── A2: PROGRAM_SCOPES TABLE ───
-- Versioned scope definitions. New version published on each update.
CREATE TABLE IF NOT EXISTS program_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  contracts JSONB NOT NULL DEFAULT '[]',
  in_scope TEXT[] NOT NULL DEFAULT '{}',
  out_of_scope TEXT[] NOT NULL DEFAULT '{}',
  severity_definitions JSONB NOT NULL DEFAULT '{
    "critical": {"min": 50000, "max": 1000000, "description": "Direct theft of user funds or protocol insolvency"},
    "high": {"min": 10000, "max": 50000, "description": "Temporary freezing of funds or manipulation of protocol state"},
    "medium": {"min": 1000, "max": 10000, "description": "Griefing, DoS, or protocol disruption without fund loss"},
    "low": {"min": 500, "max": 1000, "description": "Informational findings, gas optimizations, best practice violations"}
  }',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(program_id, version)
);

-- ─── A3: EXTEND FINDINGS TABLE ───
ALTER TABLE findings ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id);
ALTER TABLE findings ADD COLUMN IF NOT EXISTS scope_version INTEGER;
ALTER TABLE findings ADD COLUMN IF NOT EXISTS duplicate_of UUID REFERENCES findings(id);
ALTER TABLE findings ADD COLUMN IF NOT EXISTS triage_notes TEXT;
ALTER TABLE findings ADD COLUMN IF NOT EXISTS triaged_at TIMESTAMPTZ;
ALTER TABLE findings ADD COLUMN IF NOT EXISTS triaged_by UUID REFERENCES users(id);
ALTER TABLE findings ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE findings ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE findings ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE findings ADD COLUMN IF NOT EXISTS payout_amount NUMERIC;
ALTER TABLE findings ADD COLUMN IF NOT EXISTS payout_tx_hash TEXT;
ALTER TABLE findings ADD COLUMN IF NOT EXISTS payout_currency TEXT;
ALTER TABLE findings ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE findings ADD COLUMN IF NOT EXISTS poc_url TEXT;
ALTER TABLE findings ADD COLUMN IF NOT EXISTS encrypted_report JSONB;
ALTER TABLE findings ADD COLUMN IF NOT EXISTS description TEXT;

-- ─── A4: PROTOCOL_MEMBERS TABLE ───
CREATE TABLE IF NOT EXISTS protocol_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'triager' CHECK (role IN ('owner','admin','triager')),
  invited_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(protocol_id, user_id)
);

-- ─── A5: EXTEND PROTOCOLS TABLE ───
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS docs_url TEXT;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id);
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ─── A6: EXTEND USERS TABLE ───
ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_wallet TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status TEXT NOT NULL DEFAULT 'none' CHECK (kyc_status IN ('none','pending','verified'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ;

-- ─── A7: FINDING_COMMENTS TABLE ───
CREATE TABLE IF NOT EXISTS finding_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── A8: RLS POLICIES ───

-- programs: public read, service role write
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Programs are publicly readable" ON programs FOR SELECT USING (true);

-- program_scopes: public read
ALTER TABLE program_scopes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scopes are publicly readable" ON program_scopes FOR SELECT USING (true);

-- protocol_members: members can read own memberships
ALTER TABLE protocol_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read own memberships" ON protocol_members FOR SELECT USING (user_id = auth.uid());

-- finding_comments: participants can read
ALTER TABLE finding_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Finding comments readable by participants" ON finding_comments FOR SELECT USING (true);

-- ─── A9: INDEXES ───

-- programs
CREATE INDEX IF NOT EXISTS idx_programs_protocol_id ON programs(protocol_id);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);

-- program_scopes
CREATE INDEX IF NOT EXISTS idx_program_scopes_program_id ON program_scopes(program_id);
CREATE INDEX IF NOT EXISTS idx_program_scopes_version ON program_scopes(program_id, version);

-- findings extensions
CREATE INDEX IF NOT EXISTS idx_findings_program_id ON findings(program_id);
CREATE INDEX IF NOT EXISTS idx_findings_status ON findings(status);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);
CREATE INDEX IF NOT EXISTS idx_findings_researcher_status ON findings(researcher_id, status);

-- protocol_members
CREATE INDEX IF NOT EXISTS idx_protocol_members_protocol ON protocol_members(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_members_user ON protocol_members(user_id);

-- finding_comments
CREATE INDEX IF NOT EXISTS idx_finding_comments_finding ON finding_comments(finding_id);

-- protocols extensions
CREATE INDEX IF NOT EXISTS idx_protocols_owner ON protocols(owner_id);
CREATE INDEX IF NOT EXISTS idx_protocols_verified ON protocols(verified);

-- users extensions
CREATE INDEX IF NOT EXISTS idx_users_kyc ON users(kyc_status);

-- ─── AUTO-UPDATE TIMESTAMPS ───
-- Reuse the handle_updated_at trigger function from Phase 2 schema
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at') THEN
    CREATE FUNCTION handle_updated_at() RETURNS trigger AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

CREATE OR REPLACE TRIGGER programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE OR REPLACE TRIGGER protocols_updated_at
  BEFORE UPDATE ON protocols
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- DONE. Verify with:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' ORDER BY table_name;
-- ============================================================
