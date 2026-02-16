-- Migration: 014_erc8004_identity.sql
-- WhiteClaws ERC-8004 Agent Identity System
-- On-chain reputation for security researchers via ERC-8004 standard on Base

-- ═══════════════════════════════════════════════════════════════
-- Agent Identities Table (ERC-8004 NFT registrations)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS agent_identities (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    wallet_address  text NOT NULL,
    agent_id        bigint,
    agent_uri       text,
    registration_tx text,
    reputation_score float DEFAULT 0.0,
    total_feedback  integer DEFAULT 0,
    last_feedback_at timestamptz,
    status          text DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'revoked')),
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_identity_wallet ON agent_identities(wallet_address);
CREATE INDEX IF NOT EXISTS idx_agent_identity_user ON agent_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_identity_agent_id ON agent_identities(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_identity_status ON agent_identities(status);

-- Comments
COMMENT ON TABLE agent_identities IS 'ERC-8004 on-chain agent identity NFTs on Base (Initiative 2)';
COMMENT ON COLUMN agent_identities.agent_id IS 'ERC-8004 tokenId (agentId) from Identity Registry';
COMMENT ON COLUMN agent_identities.agent_uri IS 'IPFS or HTTPS URI pointing to registration JSON file';
COMMENT ON COLUMN agent_identities.registration_tx IS 'Transaction hash of ERC-8004 NFT mint';
COMMENT ON COLUMN agent_identities.reputation_score IS 'Aggregated reputation from on-chain feedback (0.0 - 1.0)';

-- ═══════════════════════════════════════════════════════════════
-- Reputation Feedback Table (on-chain feedback events)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS reputation_feedback (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_identity_id uuid NOT NULL REFERENCES agent_identities(id) ON DELETE CASCADE,
    finding_id      uuid REFERENCES findings(id) ON DELETE SET NULL,
    feedback_value  integer NOT NULL,
    tag1            text,
    tag2            text,
    tx_hash         text NOT NULL,
    block_number    bigint,
    created_at      timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rep_feedback_agent ON reputation_feedback(agent_identity_id);
CREATE INDEX IF NOT EXISTS idx_rep_feedback_finding ON reputation_feedback(finding_id);
CREATE INDEX IF NOT EXISTS idx_rep_feedback_tx ON reputation_feedback(tx_hash);
CREATE INDEX IF NOT EXISTS idx_rep_feedback_created ON reputation_feedback(created_at DESC);

-- Comments
COMMENT ON TABLE reputation_feedback IS 'Individual ERC-8004 reputation feedback posts from Reputation Registry on Base';
COMMENT ON COLUMN reputation_feedback.feedback_value IS 'Severity-weighted score (e.g., critical=1000, high=500, medium=250, low=100)';
COMMENT ON COLUMN reputation_feedback.tag1 IS 'Feedback tag 1, typically "vulnerability"';
COMMENT ON COLUMN reputation_feedback.tag2 IS 'Feedback tag 2, typically protocol slug';
COMMENT ON COLUMN reputation_feedback.tx_hash IS 'Transaction hash of reputation feedback posted on-chain';

-- ═══════════════════════════════════════════════════════════════
-- RLS Policies for agent_identities
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE agent_identities ENABLE ROW LEVEL SECURITY;

-- Anyone can read registered agent identities (public reputation)
CREATE POLICY "Public read for registered agent identities"
    ON agent_identities
    FOR SELECT
    USING (status = 'registered');

-- Users can read their own identity regardless of status
CREATE POLICY "Users can view own agent identity"
    ON agent_identities
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own identity
CREATE POLICY "Users can create own agent identity"
    ON agent_identities
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role full access to agent identities"
    ON agent_identities
    FOR ALL
    USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════
-- RLS Policies for reputation_feedback
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE reputation_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can read reputation feedback (public)
CREATE POLICY "Public read for reputation feedback"
    ON reputation_feedback
    FOR SELECT
    USING (true);

-- Service role full access
CREATE POLICY "Service role full access to reputation feedback"
    ON reputation_feedback
    FOR ALL
    USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════
-- Extend anti_sybil_flags for ERC-8004 reputation signal
-- ═══════════════════════════════════════════════════════════════
-- NOTE: No schema changes needed - we use existing flags jsonb column
-- New flag format: { "type": "erc8004_reputation", "score": 0.87, "feedback_count": 15 }

COMMENT ON COLUMN anti_sybil_flags.flags IS 'Anti-Sybil flag array including ERC-8004 reputation: [{ type: "erc8004_reputation", score: float, feedback_count: int }, ...]';
