-- Migration: 006_airdrop_system.sql
-- WhiteClaws Airdrop & Participation System
-- Tables: access_sbt, participation_events, contribution_scores,
--         referral_links, referral_rewards, x_verifications, anti_sybil_flags

-- ═══════════════════════════════════════════════════════
-- Access SBT (airdrop qualification gate)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS access_sbt (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES users(id) UNIQUE,
    wallet_address  text UNIQUE NOT NULL,
    tx_hash         text,
    mint_price      text DEFAULT '20.00 USDC',
    payment_token   text DEFAULT 'USDC' CHECK (payment_token IN ('USDC', 'ETH', 'WC')),
    minted_at       timestamptz DEFAULT now(),
    token_id        integer,
    is_early        boolean DEFAULT false,
    status          text DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sbt_wallet ON access_sbt(wallet_address);
CREATE INDEX IF NOT EXISTS idx_sbt_status ON access_sbt(status);

-- ═══════════════════════════════════════════════════════
-- Participation Events (every scorable action)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS participation_events (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES users(id),
    event_type      text NOT NULL,
    points          integer NOT NULL DEFAULT 0,
    metadata        jsonb DEFAULT '{}',
    wallet_address  text,
    verified        boolean DEFAULT false,
    season          integer NOT NULL DEFAULT 1,
    week            integer NOT NULL DEFAULT 1,
    created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_user_season ON participation_events(user_id, season);
CREATE INDEX IF NOT EXISTS idx_events_type ON participation_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_week ON participation_events(season, week);
CREATE INDEX IF NOT EXISTS idx_events_created ON participation_events(created_at DESC);

-- ═══════════════════════════════════════════════════════
-- Contribution Scores (materialized per-user per-season)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS contribution_scores (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL REFERENCES users(id),
    season              integer NOT NULL DEFAULT 1,
    security_points     integer DEFAULT 0,
    growth_points       integer DEFAULT 0,
    engagement_points   integer DEFAULT 0,
    social_points       integer DEFAULT 0,
    total_score         float DEFAULT 0,
    rank                integer,
    streak_weeks        integer DEFAULT 0,
    last_active_at      timestamptz,
    sybil_multiplier    float DEFAULT 1.0,
    updated_at          timestamptz DEFAULT now(),
    UNIQUE(user_id, season)
);

CREATE INDEX IF NOT EXISTS idx_scores_season_rank ON contribution_scores(season, rank);
CREATE INDEX IF NOT EXISTS idx_scores_user ON contribution_scores(user_id);

-- ═══════════════════════════════════════════════════════
-- Referral Links
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS referral_links (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id     uuid NOT NULL REFERENCES users(id) UNIQUE,
    code            text UNIQUE NOT NULL,
    wallet_address  text NOT NULL,
    total_referred  integer DEFAULT 0,
    qualified_referred integer DEFAULT 0,
    created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_code ON referral_links(code);

-- ═══════════════════════════════════════════════════════
-- Referral Rewards
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS referral_rewards (
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

CREATE INDEX IF NOT EXISTS idx_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON referral_rewards(status);

-- ═══════════════════════════════════════════════════════
-- X/Twitter Verifications
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS x_verifications (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES users(id) UNIQUE,
    user_type       text DEFAULT 'human' CHECK (user_type IN ('agent', 'human', 'protocol')),
    x_handle        text UNIQUE NOT NULL,
    x_id            text UNIQUE NOT NULL,
    tweet_id        text,
    wallet_address  text NOT NULL,
    verified_at     timestamptz,
    tweet_checked_at timestamptz,
    status          text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'revoked')),
    created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_xver_user ON x_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_xver_handle ON x_verifications(x_handle);

-- ═══════════════════════════════════════════════════════
-- Anti-Sybil Flags
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS anti_sybil_flags (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address  text NOT NULL,
    risk_score      float DEFAULT 0.0 CHECK (risk_score >= 0 AND risk_score <= 1),
    flags           jsonb DEFAULT '[]',
    cluster_id      text,
    reviewed        boolean DEFAULT false,
    reviewed_by     text,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sybil_wallet ON anti_sybil_flags(wallet_address);
CREATE INDEX IF NOT EXISTS idx_sybil_cluster ON anti_sybil_flags(cluster_id);
CREATE INDEX IF NOT EXISTS idx_sybil_score ON anti_sybil_flags(risk_score);

-- ═══════════════════════════════════════════════════════
-- Season Config (simple key-value for season parameters)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS season_config (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    season          integer UNIQUE NOT NULL DEFAULT 1,
    start_date      timestamptz,
    end_date        timestamptz,
    pool_size       bigint,
    status          text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'frozen', 'claiming', 'completed')),
    weekly_cap      integer DEFAULT 5000,
    metadata        jsonb DEFAULT '{}',
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- Seed Season 1 config
INSERT INTO season_config (season, status) VALUES (1, 'pending')
ON CONFLICT (season) DO NOTHING;
