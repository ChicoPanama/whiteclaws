-- WhiteClaws Complete Database Setup
-- Includes all tables, functions, triggers, and RLS policies

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Get referral tier percentage
CREATE OR REPLACE FUNCTION get_referral_tier_percentage(tier INTEGER)
RETURNS DECIMAL(5, 4)
LANGUAGE plpgsql
AS $$
BEGIN
  CASE tier
    WHEN 1 THEN RETURN 0.1000;    -- 10%
    WHEN 2 THEN RETURN 0.0500;    -- 5%
    WHEN 3 THEN RETURN 0.0250;    -- 2.5%
    WHEN 4 THEN RETURN 0.0100;    -- 1%
    WHEN 5 THEN RETURN 0.0050;    -- 0.5%
    ELSE RETURN 0.0000;
  END CASE;
END;
$$;

-- Function: Get downline statistics
CREATE OR REPLACE FUNCTION get_downline_stats(ancestor_wallet TEXT)
RETURNS TABLE (
  level INTEGER,
  count BIGINT,
  qualified_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rt.level,
    COUNT(*)::BIGINT as count,
    COUNT(*) FILTER (WHERE rt.qualified = true)::BIGINT as qualified_count
  FROM referral_tree rt
  WHERE rt.referrer_wallet = LOWER(ancestor_wallet)
     OR LOWER(ancestor_wallet) = ANY(rt.upline_path)
  GROUP BY rt.level
  ORDER BY rt.level;
END;
$$;

-- Function: Check circular referral
CREATE OR REPLACE FUNCTION check_circular_referral(
  new_wallet TEXT,
  referrer_wallet TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  is_circular BOOLEAN;
BEGIN
  -- Check if new_wallet is in referrer's upline
  SELECT EXISTS (
    SELECT 1
    FROM referral_tree
    WHERE wallet_address = LOWER(referrer_wallet)
      AND (
        referrer_wallet = LOWER(new_wallet)
        OR LOWER(new_wallet) = ANY(upline_path)
      )
  ) INTO is_circular;
  
  RETURN is_circular;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger function: Auto-generate referral code
CREATE OR REPLACE FUNCTION auto_generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- Generate unique code
  LOOP
    new_code := 'wc-' || substring(md5(random()::text || clock_timestamp()::text) from 1 for 6);
    
    SELECT EXISTS (
      SELECT 1 FROM referral_links WHERE code = new_code
    ) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  -- Insert referral link
  INSERT INTO referral_links (wallet_address, code)
  VALUES (NEW.wallet_address, new_code)
  ON CONFLICT (wallet_address) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on users table
DROP TRIGGER IF EXISTS trigger_auto_generate_referral_code ON users;
CREATE TRIGGER trigger_auto_generate_referral_code
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_referral_code();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_tree ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE participation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribution_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE anti_sybil_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_signature_nonces ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Referral links policies
CREATE POLICY "Users can read own referral link"
  ON referral_links FOR SELECT
  USING (wallet_address = (SELECT wallet_address FROM users WHERE id::text = auth.uid()::text));

-- Referral tree policies
CREATE POLICY "Users can read own referral tree"
  ON referral_tree FOR SELECT
  USING (
    wallet_address = (SELECT wallet_address FROM users WHERE id::text = auth.uid()::text)
    OR referrer_wallet = (SELECT wallet_address FROM users WHERE id::text = auth.uid()::text)
  );

-- Referral bonuses policies
CREATE POLICY "Users can read own bonuses"
  ON referral_bonuses FOR SELECT
  USING (
    earner_wallet = (SELECT wallet_address FROM users WHERE id::text = auth.uid()::text)
    OR contributor_wallet = (SELECT wallet_address FROM users WHERE id::text = auth.uid()::text)
  );

-- Participation events policies
CREATE POLICY "Users can read own events"
  ON participation_events FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- Contribution scores policies
CREATE POLICY "Users can read own scores"
  ON contribution_scores FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- Public read access (for leaderboards, etc.)
CREATE POLICY "Public can read contribution scores"
  ON contribution_scores FOR SELECT
  USING (true);

-- Service role bypass (for admin operations)
CREATE POLICY "Service role has full access to users"
  ON users FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role has full access to referral_links"
  ON referral_links FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role has full access to referral_tree"
  ON referral_tree FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role has full access to referral_bonuses"
  ON referral_bonuses FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role has full access to participation_events"
  ON participation_events FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role has full access to contribution_scores"
  ON contribution_scores FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_handle ON users(handle);

-- Referral links indexes
CREATE INDEX IF NOT EXISTS idx_referral_links_wallet ON referral_links(wallet_address);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON referral_links(code);

-- Referral tree indexes
CREATE INDEX IF NOT EXISTS idx_referral_tree_wallet ON referral_tree(wallet_address);
CREATE INDEX IF NOT EXISTS idx_referral_tree_referrer ON referral_tree(referrer_wallet);
CREATE INDEX IF NOT EXISTS idx_referral_tree_level ON referral_tree(level);
CREATE INDEX IF NOT EXISTS idx_referral_tree_qualified ON referral_tree(qualified);

-- Referral bonuses indexes
CREATE INDEX IF NOT EXISTS idx_referral_bonuses_earner ON referral_bonuses(earner_wallet);
CREATE INDEX IF NOT EXISTS idx_referral_bonuses_contributor ON referral_bonuses(contributor_wallet);
CREATE INDEX IF NOT EXISTS idx_referral_bonuses_season ON referral_bonuses(season);

-- Participation events indexes
CREATE INDEX IF NOT EXISTS idx_participation_events_user ON participation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_participation_events_type ON participation_events(event_type);
CREATE INDEX IF NOT EXISTS idx_participation_events_season ON participation_events(season, week);

-- Contribution scores indexes
CREATE INDEX IF NOT EXISTS idx_contribution_scores_user ON contribution_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_contribution_scores_season_rank ON contribution_scores(season, rank);

-- Anti-sybil flags indexes
CREATE INDEX IF NOT EXISTS idx_anti_sybil_wallet ON anti_sybil_flags(wallet_address);
CREATE INDEX IF NOT EXISTS idx_anti_sybil_cluster ON anti_sybil_flags(cluster_id);

-- Rate limit buckets indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_key ON rate_limit_buckets(bucket_key);
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_reset ON rate_limit_buckets(reset_at);

-- Wallet signature nonces indexes
CREATE INDEX IF NOT EXISTS idx_wallet_nonces_wallet ON wallet_signature_nonces(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_nonces_expires ON wallet_signature_nonces(expires_at);

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant usage on functions
GRANT EXECUTE ON FUNCTION get_referral_tier_percentage(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_downline_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_circular_referral(TEXT, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION get_referral_tier_percentage(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_downline_stats(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION check_circular_referral(TEXT, TEXT) TO anon;

GRANT EXECUTE ON FUNCTION get_referral_tier_percentage(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_downline_stats(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION check_circular_referral(TEXT) TO service_role;
