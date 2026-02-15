-- Migration: 013_multi_level_referrals.sql
-- Multi-Level Wallet-Based Referral System (L1-L5)
-- Replaces single-level user_id-based system with wallet-based tree

-- ═══════════════════════════════════════════════════════
-- SAFETY: Backup existing data before migration
-- ═══════════════════════════════════════════════════════
DO $$
BEGIN
    -- Create backup tables if referral data exists
    IF EXISTS (SELECT 1 FROM referral_links LIMIT 1) THEN
        CREATE TABLE IF NOT EXISTS referral_links_backup_v1 AS 
        SELECT * FROM referral_links;
        
        CREATE TABLE IF NOT EXISTS referral_rewards_backup_v1 AS 
        SELECT * FROM referral_rewards;
        
        RAISE NOTICE 'Backed up existing referral data to *_backup_v1 tables';
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════
-- DROP old single-level tables
-- ═══════════════════════════════════════════════════════
DROP TABLE IF EXISTS referral_rewards CASCADE;
DROP TABLE IF EXISTS referral_links CASCADE;

-- ═══════════════════════════════════════════════════════
-- NEW: Referral Links (wallet-based, not user_id)
-- ═══════════════════════════════════════════════════════
CREATE TABLE referral_links (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address      text UNIQUE NOT NULL,           -- Primary key is wallet
    code                text UNIQUE NOT NULL,            -- 'wc-a7x9k2'
    total_referred      integer DEFAULT 0,
    qualified_referred  integer DEFAULT 0,
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT wallet_lowercase CHECK (wallet_address = lower(wallet_address)),
    CONSTRAINT code_format CHECK (code ~ '^wc-[a-z0-9]{6}$')
);

CREATE INDEX idx_referral_links_wallet ON referral_links(wallet_address);
CREATE INDEX idx_referral_links_code ON referral_links(code);

-- ═══════════════════════════════════════════════════════
-- NEW: Referral Tree (multi-level relationships)
-- ═══════════════════════════════════════════════════════
CREATE TABLE referral_tree (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address      text NOT NULL,                  -- User's wallet
    referrer_wallet     text NOT NULL,                  -- Direct or indirect referrer
    level               integer NOT NULL,               -- 1-5 (depth in tree)
    upline_path         text[] NOT NULL,                -- [L1_wallet, L2_wallet, ...]
    qualified           boolean DEFAULT false,          -- Has user contributed?
    qualifying_action   text,                           -- 'finding_accepted', etc
    qualified_at        timestamptz,
    created_at          timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT level_range CHECK (level >= 1 AND level <= 5),
    CONSTRAINT wallet_lowercase_tree CHECK (wallet_address = lower(wallet_address)),
    CONSTRAINT referrer_lowercase_tree CHECK (referrer_wallet = lower(referrer_wallet)),
    CONSTRAINT no_self_referral CHECK (wallet_address != referrer_wallet),
    CONSTRAINT upline_path_not_empty CHECK (array_length(upline_path, 1) >= 1),
    CONSTRAINT upline_path_matches_level CHECK (array_length(upline_path, 1) = level),
    
    -- Each wallet can only have one referrer at each level
    UNIQUE(wallet_address, referrer_wallet, level)
);

CREATE INDEX idx_referral_tree_wallet ON referral_tree(wallet_address);
CREATE INDEX idx_referral_tree_referrer ON referral_tree(referrer_wallet);
CREATE INDEX idx_referral_tree_level ON referral_tree(wallet_address, level);
CREATE INDEX idx_referral_tree_upline ON referral_tree USING gin(upline_path);
CREATE INDEX idx_referral_tree_qualified ON referral_tree(wallet_address, qualified) WHERE qualified = true;

-- ═══════════════════════════════════════════════════════
-- NEW: Referral Bonuses (earnings tracking)
-- ═══════════════════════════════════════════════════════
CREATE TABLE referral_bonuses (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    earner_wallet       text NOT NULL,                  -- Wallet earning the bonus
    contributor_wallet  text NOT NULL,                  -- Wallet that did the work
    level               integer NOT NULL,               -- 1-5
    action_type         text NOT NULL,                  -- 'finding_accepted', etc
    base_points         integer NOT NULL,               -- What contributor earned (T1+T2)
    bonus_percentage    decimal(5,4) NOT NULL,          -- 0.1000, 0.0500, etc
    bonus_points        integer NOT NULL,               -- Calculated bonus
    season              integer NOT NULL DEFAULT 1,
    created_at          timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT level_range_bonus CHECK (level >= 1 AND level <= 5),
    CONSTRAINT percentage_valid CHECK (bonus_percentage > 0 AND bonus_percentage <= 0.1),
    CONSTRAINT base_points_positive CHECK (base_points >= 0),
    CONSTRAINT bonus_points_positive CHECK (bonus_points >= 0),
    CONSTRAINT wallet_lowercase_earner CHECK (earner_wallet = lower(earner_wallet)),
    CONSTRAINT wallet_lowercase_contributor CHECK (contributor_wallet = lower(contributor_wallet))
);

CREATE INDEX idx_referral_bonuses_earner ON referral_bonuses(earner_wallet, season);
CREATE INDEX idx_referral_bonuses_contributor ON referral_bonuses(contributor_wallet);
CREATE INDEX idx_referral_bonuses_level ON referral_bonuses(level);
CREATE INDEX idx_referral_bonuses_created ON referral_bonuses(created_at DESC);

-- ═══════════════════════════════════════════════════════
-- Wallet Signature Nonces (replay attack prevention)
-- ═══════════════════════════════════════════════════════
CREATE TABLE wallet_signature_nonces (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address      text NOT NULL,
    nonce               text NOT NULL,
    expires_at          timestamptz NOT NULL,
    created_at          timestamptz DEFAULT now(),
    
    -- Prevent nonce reuse
    UNIQUE(wallet_address, nonce),
    
    -- Auto-cleanup expired nonces
    CONSTRAINT nonce_not_expired CHECK (expires_at > now())
);

CREATE INDEX idx_nonces_wallet ON wallet_signature_nonces(wallet_address);
CREATE INDEX idx_nonces_expires ON wallet_signature_nonces(expires_at);

-- Auto-cleanup expired nonces (runs daily)
CREATE OR REPLACE FUNCTION cleanup_expired_nonces()
RETURNS void AS $$
BEGIN
    DELETE FROM wallet_signature_nonces
    WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════
-- Helper Functions
-- ═══════════════════════════════════════════════════════

-- Function: Get referral tier percentage
CREATE OR REPLACE FUNCTION get_referral_tier_percentage(tier integer)
RETURNS decimal(5,4) AS $$
BEGIN
    RETURN CASE tier
        WHEN 1 THEN 0.1000  -- 10%
        WHEN 2 THEN 0.0500  -- 5%
        WHEN 3 THEN 0.0250  -- 2.5%
        WHEN 4 THEN 0.0100  -- 1%
        WHEN 5 THEN 0.0050  -- 0.5%
        ELSE 0.0000
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Get full downline stats for a wallet
CREATE OR REPLACE FUNCTION get_downline_stats(ancestor_wallet text)
RETURNS TABLE(
    level integer,
    count bigint,
    qualified_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rt.level,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE rt.qualified = true) as qualified_count
    FROM referral_tree rt
    WHERE rt.referrer_wallet = lower(ancestor_wallet)
    GROUP BY rt.level
    ORDER BY rt.level;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Check if referral would create circular reference
CREATE OR REPLACE FUNCTION check_circular_referral(
    new_wallet text,
    referrer_wallet text
) RETURNS boolean AS $$
DECLARE
    referrer_upline text[];
BEGIN
    -- Get referrer's upline path
    SELECT upline_path INTO referrer_upline
    FROM referral_tree
    WHERE wallet_address = lower(referrer_wallet)
    AND level = 1
    LIMIT 1;
    
    -- Check if new_wallet appears in referrer's upline
    IF referrer_upline IS NOT NULL THEN
        IF lower(new_wallet) = ANY(referrer_upline) THEN
            RETURN true;  -- Circular
        END IF;
    END IF;
    
    RETURN false;  -- Not circular
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Auto-generate referral code on user creation
CREATE OR REPLACE FUNCTION auto_generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code text;
    max_attempts integer := 10;
    attempt integer := 0;
BEGIN
    -- Only create referral link if wallet_address exists
    IF NEW.wallet_address IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Generate unique code
    WHILE attempt < max_attempts LOOP
        new_code := 'wc-' || substr(md5(random()::text || NEW.id::text), 1, 6);
        
        -- Try to insert
        BEGIN
            INSERT INTO referral_links (wallet_address, code)
            VALUES (lower(NEW.wallet_address), new_code);
            
            EXIT;  -- Success
        EXCEPTION WHEN unique_violation THEN
            attempt := attempt + 1;
            -- Loop and try again
        END;
    END LOOP;
    
    IF attempt >= max_attempts THEN
        RAISE EXCEPTION 'Failed to generate unique referral code after % attempts', max_attempts;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-create referral link when user registers
DROP TRIGGER IF EXISTS create_referral_on_user_insert ON users;
CREATE TRIGGER create_referral_on_user_insert
    AFTER INSERT ON users
    FOR EACH ROW
    WHEN (NEW.wallet_address IS NOT NULL)
    EXECUTE FUNCTION auto_generate_referral_code();

-- ═══════════════════════════════════════════════════════
-- Data Migration: Convert existing user-based to wallet-based
-- ═══════════════════════════════════════════════════════
DO $$
DECLARE
    user_rec RECORD;
    new_code text;
BEGIN
    -- Migrate existing users to new referral_links table
    FOR user_rec IN 
        SELECT id, wallet_address 
        FROM users 
        WHERE wallet_address IS NOT NULL
    LOOP
        -- Generate code
        new_code := 'wc-' || substr(md5(random()::text || user_rec.id::text), 1, 6);
        
        -- Insert into new table
        INSERT INTO referral_links (wallet_address, code)
        VALUES (lower(user_rec.wallet_address), new_code)
        ON CONFLICT (wallet_address) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Migrated % users to wallet-based referral system', 
        (SELECT COUNT(*) FROM referral_links);
END $$;

-- ═══════════════════════════════════════════════════════
-- Verification Queries (for post-migration check)
-- ═══════════════════════════════════════════════════════
-- Run these after migration to verify:
-- SELECT COUNT(*) FROM referral_links;
-- SELECT COUNT(*) FROM users WHERE wallet_address IS NOT NULL;
-- SELECT * FROM referral_links LIMIT 5;
-- SELECT check_circular_referral('0xtest1', '0xtest2');
-- SELECT get_referral_tier_percentage(1);
-- SELECT * FROM get_downline_stats('0x0000000000000000000000000000000000000000');
