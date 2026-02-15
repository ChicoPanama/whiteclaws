-- Rollback Migration: rollback_013_multi_level_referrals.sql
-- Restores single-level user_id-based referral system

-- ═══════════════════════════════════════════════════════
-- WARNING: This will delete all multi-level referral data
-- ═══════════════════════════════════════════════════════

-- Drop new multi-level tables
DROP TABLE IF EXISTS referral_bonuses CASCADE;
DROP TABLE IF EXISTS referral_tree CASCADE;
DROP TABLE IF EXISTS referral_links CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_referral_tier_percentage(integer);
DROP FUNCTION IF EXISTS get_downline_stats(text);
DROP FUNCTION IF EXISTS check_circular_referral(text, text);
DROP FUNCTION IF EXISTS auto_generate_referral_code();

-- Drop trigger
DROP TRIGGER IF EXISTS create_referral_on_user_insert ON users;

-- ═══════════════════════════════════════════════════════
-- Restore old single-level tables
-- ═══════════════════════════════════════════════════════

CREATE TABLE referral_links (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id     uuid NOT NULL REFERENCES users(id) UNIQUE,
    code            text UNIQUE NOT NULL,
    wallet_address  text NOT NULL,
    total_referred  integer DEFAULT 0,
    qualified_referred integer DEFAULT 0,
    created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_referral_code ON referral_links(code);

CREATE TABLE referral_rewards (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id         uuid NOT NULL REFERENCES users(id),
    referred_id         uuid NOT NULL REFERENCES users(id),
    qualifying_action   text,
    qualified_at        timestamptz,
    referrer_bonus      integer DEFAULT 0,
    season              integer NOT NULL DEFAULT 1,
    status              text DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'paid')),
    created_at          timestamptz DEFAULT now(),
    UNIQUE(referrer_id, referred_id)
);

CREATE INDEX idx_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX idx_rewards_status ON referral_rewards(status);

-- ═══════════════════════════════════════════════════════
-- Restore data from backup (if exists)
-- ═══════════════════════════════════════════════════════
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_links_backup_v1') THEN
        INSERT INTO referral_links
        SELECT * FROM referral_links_backup_v1;
        
        RAISE NOTICE 'Restored % referral links from backup', 
            (SELECT COUNT(*) FROM referral_links);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_rewards_backup_v1') THEN
        INSERT INTO referral_rewards
        SELECT * FROM referral_rewards_backup_v1;
        
        RAISE NOTICE 'Restored % referral rewards from backup', 
            (SELECT COUNT(*) FROM referral_rewards);
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════
-- Verification
-- ═══════════════════════════════════════════════════════
-- Run these to verify rollback:
-- SELECT COUNT(*) FROM referral_links;
-- SELECT COUNT(*) FROM referral_rewards;
-- SELECT * FROM referral_links LIMIT 5;
