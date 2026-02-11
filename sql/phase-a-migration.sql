-- =============================================
-- WhiteClaws Phase A: Three-Sided Marketplace Schema
-- Run in Supabase SQL Editor
-- =============================================

-- A5: Extend protocols table
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS docs_url TEXT;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id);

-- A6: Extend users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_wallet TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ;

-- A1: Programs table (bounty program instance)
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  scope_version INTEGER NOT NULL DEFAULT 1,
  duplicate_policy TEXT NOT NULL DEFAULT 'first' CHECK (duplicate_policy IN ('first', 'best')),
  response_sla_hours INTEGER NOT NULL DEFAULT 72,
  poc_required BOOLEAN NOT NULL DEFAULT true,
  kyc_required BOOLEAN NOT NULL DEFAULT false,
  payout_currency TEXT NOT NULL DEFAULT 'USDC',
  min_payout NUMERIC NOT NULL DEFAULT 500,
  max_payout NUMERIC NOT NULL DEFAULT 100000,
  encryption_public_key TEXT,
  payout_wallet TEXT,
  exclusions TEXT[] NOT NULL DEFAULT '{}',
  cooldown_hours INTEGER NOT NULL DEFAULT 24,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_programs_protocol ON programs(protocol_id);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);

-- A2: Program scopes (versioned)
CREATE TABLE IF NOT EXISTS program_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  contracts JSONB NOT NULL DEFAULT '[]',
  in_scope TEXT[] NOT NULL DEFAULT '{}',
  out_of_scope TEXT[] NOT NULL DEFAULT '{}',
  severity_definitions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(program_id, version)
);

CREATE INDEX IF NOT EXISTS idx_program_scopes_program ON program_scopes(program_id);
CREATE INDEX IF NOT EXISTS idx_program_scopes_version ON program_scopes(program_id, version DESC);

-- A3: Extend findings table
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

CREATE INDEX IF NOT EXISTS idx_findings_program ON findings(program_id);
CREATE INDEX IF NOT EXISTS idx_findings_status ON findings(status);
CREATE INDEX IF NOT EXISTS idx_findings_duplicate ON findings(duplicate_of);

-- A4: Protocol members (who can manage a protocol)
CREATE TABLE IF NOT EXISTS protocol_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'triager' CHECK (role IN ('owner', 'admin', 'triager')),
  invited_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(protocol_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_protocol_members_protocol ON protocol_members(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_members_user ON protocol_members(user_id);

-- A7: Finding comments (protocol <-> agent communication)
CREATE TABLE IF NOT EXISTS finding_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finding_comments_finding ON finding_comments(finding_id);

-- A8: RLS policies
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE finding_comments ENABLE ROW LEVEL SECURITY;

-- Programs: public read for active, service role full access
CREATE POLICY "Public can read active programs" ON programs
  FOR SELECT USING (status = 'active');

-- Program scopes: public read
CREATE POLICY "Public can read program scopes" ON program_scopes
  FOR SELECT USING (true);

-- Protocol members: members can read own memberships
CREATE POLICY "Members can read own memberships" ON protocol_members
  FOR SELECT USING (user_id = auth.uid());

-- Finding comments: visible to finding participants
CREATE POLICY "Public can read non-internal comments" ON finding_comments
  FOR SELECT USING (is_internal = false);

-- A9: Updated_at trigger for programs
CREATE OR REPLACE FUNCTION update_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS programs_updated_at ON programs;
CREATE TRIGGER programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION update_programs_updated_at();

-- A10: Seed programs from existing protocol data
-- Create a program for every protocol that has a max_bounty > 0
INSERT INTO programs (protocol_id, status, poc_required, kyc_required, payout_currency, min_payout, max_payout)
SELECT 
  id,
  'active',
  true,
  false,
  'USDC',
  500,
  COALESCE(max_bounty, 100000)
FROM protocols
WHERE max_bounty > 0
ON CONFLICT DO NOTHING;

-- Create initial scope v1 for each program using protocol JSON data
INSERT INTO program_scopes (program_id, version, in_scope, out_of_scope, severity_definitions)
SELECT 
  p.id,
  1,
  ARRAY['Smart contracts per Immunefi listing'],
  ARRAY['Frontend applications', 'Off-chain infrastructure'],
  jsonb_build_object(
    'critical', jsonb_build_object('min', GREATEST(FLOOR(pr.max_bounty * 0.25), 1000), 'max', pr.max_bounty, 'description', 'Direct theft of user funds or protocol insolvency'),
    'high', jsonb_build_object('min', GREATEST(FLOOR(pr.max_bounty * 0.01), 1000), 'max', GREATEST(FLOOR(pr.max_bounty * 0.1), 5000), 'description', 'Temporary freezing of funds or manipulation'),
    'medium', jsonb_build_object('min', 500, 'max', GREATEST(FLOOR(pr.max_bounty * 0.01), 1000), 'description', 'Griefing or protocol disruption'),
    'low', jsonb_build_object('min', 100, 'max', 500, 'description', 'Informational or best practice issues')
  )
FROM programs p
JOIN protocols pr ON pr.id = p.protocol_id
ON CONFLICT (program_id, version) DO NOTHING;
