-- Missing tables for WhiteClaws Multi-Level Referral System

-- Table: referral_tree (Multi-level referral relationships)
CREATE TABLE IF NOT EXISTS referral_tree (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address text NOT NULL,
    referrer_wallet text NOT NULL,
    level integer NOT NULL CHECK (level >= 1 AND level <= 5),
    upline_path text[] DEFAULT '{}',
    qualified boolean DEFAULT false,
    qualified_at timestamptz,
    created_at timestamptz DEFAULT now(),
    UNIQUE(wallet_address, referrer_wallet)
);

CREATE INDEX IF NOT EXISTS idx_referral_tree_wallet ON referral_tree(wallet_address);
CREATE INDEX IF NOT EXISTS idx_referral_tree_referrer ON referral_tree(referrer_wallet);
CREATE INDEX IF NOT EXISTS idx_referral_tree_level ON referral_tree(level);
CREATE INDEX IF NOT EXISTS idx_referral_tree_qualified ON referral_tree(qualified);

-- Table: referral_bonuses (Bonus distribution records)
CREATE TABLE IF NOT EXISTS referral_bonuses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    earner_wallet text NOT NULL,
    contributor_wallet text NOT NULL,
    level integer NOT NULL CHECK (level >= 1 AND level <= 5),
    event_type text NOT NULL,
    base_points integer NOT NULL,
    bonus_percentage decimal(5,4) NOT NULL,
    bonus_points integer NOT NULL,
    season integer DEFAULT 1,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_bonuses_earner ON referral_bonuses(earner_wallet);
CREATE INDEX IF NOT EXISTS idx_referral_bonuses_contributor ON referral_bonuses(contributor_wallet);
CREATE INDEX IF NOT EXISTS idx_referral_bonuses_season ON referral_bonuses(season);

-- Table: wallet_signature_nonces (Replay attack prevention)
CREATE TABLE IF NOT EXISTS wallet_signature_nonces (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address text NOT NULL,
    nonce text NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(wallet_address, nonce)
);

CREATE INDEX IF NOT EXISTS idx_wallet_nonces_wallet ON wallet_signature_nonces(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_nonces_expires ON wallet_signature_nonces(expires_at);

-- Enable RLS
ALTER TABLE referral_tree ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_signature_nonces ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_tree
CREATE POLICY IF NOT EXISTS "Users can read own referral tree"
  ON referral_tree FOR SELECT
  USING (
    wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    OR referrer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  );

CREATE POLICY IF NOT EXISTS "Service role has full access to referral_tree"
  ON referral_tree FOR ALL
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- RLS Policies for referral_bonuses
CREATE POLICY IF NOT EXISTS "Users can read own bonuses"
  ON referral_bonuses FOR SELECT
  USING (
    earner_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    OR contributor_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  );

CREATE POLICY IF NOT EXISTS "Service role has full access to referral_bonuses"
  ON referral_bonuses FOR ALL
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- RLS Policies for wallet_signature_nonces  
CREATE POLICY IF NOT EXISTS "Service role has full access to wallet_signature_nonces"
  ON wallet_signature_nonces FOR ALL
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
