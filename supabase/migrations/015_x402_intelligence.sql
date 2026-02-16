-- Migration: 015_x402_intelligence.sql
-- WhiteClaws x402 Intelligence API
-- Pay-per-call API for enriched protocol data via USDC payments on Base

-- ═══════════════════════════════════════════════════════════════
-- x402 Payments Table (individual payment transactions)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS x402_payments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payer_wallet    text NOT NULL,
    endpoint        text NOT NULL,
    amount_usdc     numeric NOT NULL,
    tx_hash         text NOT NULL UNIQUE,
    facilitator     text,
    block_number    bigint,
    verified        boolean DEFAULT false,
    created_at      timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_x402_payer ON x402_payments(payer_wallet);
CREATE INDEX IF NOT EXISTS idx_x402_endpoint ON x402_payments(endpoint);
CREATE INDEX IF NOT EXISTS idx_x402_tx ON x402_payments(tx_hash);
CREATE INDEX IF NOT EXISTS idx_x402_created ON x402_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_x402_verified ON x402_payments(verified);

-- Comments
COMMENT ON TABLE x402_payments IS 'x402 pay-per-call API payments via USDC on Base (Initiative 3)';
COMMENT ON COLUMN x402_payments.endpoint IS 'API endpoint accessed (e.g., /api/intel/protocol/aave)';
COMMENT ON COLUMN x402_payments.amount_usdc IS 'Payment amount in USDC (e.g., 0.01, 0.05, 0.10)';
COMMENT ON COLUMN x402_payments.facilitator IS 'x402 facilitator address that verified payment';
COMMENT ON COLUMN x402_payments.verified IS 'Whether payment has been verified on-chain';

-- ═══════════════════════════════════════════════════════════════
-- x402 Revenue Table (materialized aggregates)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS x402_revenue (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    period          text NOT NULL,
    endpoint        text NOT NULL,
    total_calls     integer DEFAULT 0,
    total_usdc      numeric DEFAULT 0,
    unique_payers   integer DEFAULT 0,
    updated_at      timestamptz DEFAULT now(),
    UNIQUE(period, endpoint)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_x402_revenue_period ON x402_revenue(period);
CREATE INDEX IF NOT EXISTS idx_x402_revenue_endpoint ON x402_revenue(endpoint);
CREATE INDEX IF NOT EXISTS idx_x402_revenue_updated ON x402_revenue(updated_at DESC);

-- Comments
COMMENT ON TABLE x402_revenue IS 'Materialized x402 revenue aggregates by period and endpoint';
COMMENT ON COLUMN x402_revenue.period IS 'Time period (e.g., "2026-02", "2026-W07")';
COMMENT ON COLUMN x402_revenue.total_usdc IS 'Total USDC revenue for this period+endpoint';
COMMENT ON COLUMN x402_revenue.unique_payers IS 'Count of unique payer wallets';

-- ═══════════════════════════════════════════════════════════════
-- RLS Policies for x402_payments
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE x402_payments ENABLE ROW LEVEL SECURITY;

-- Users can read their own payments
CREATE POLICY "Users can view own x402 payments"
    ON x402_payments
    FOR SELECT
    USING (auth.jwt() ->> 'wallet_address' = payer_wallet);

-- Service role full access
CREATE POLICY "Service role full access to x402 payments"
    ON x402_payments
    FOR ALL
    USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════
-- RLS Policies for x402_revenue
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE x402_revenue ENABLE ROW LEVEL SECURITY;

-- Anyone can read revenue stats (transparent platform metrics)
CREATE POLICY "Public read for x402 revenue stats"
    ON x402_revenue
    FOR SELECT
    USING (true);

-- Service role full access
CREATE POLICY "Service role full access to x402 revenue"
    ON x402_revenue
    FOR ALL
    USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════
-- Function to update x402_revenue aggregates
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_x402_revenue(p_period text, p_endpoint text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO x402_revenue (period, endpoint, total_calls, total_usdc, unique_payers, updated_at)
    SELECT
        p_period,
        p_endpoint,
        COUNT(*),
        COALESCE(SUM(amount_usdc), 0),
        COUNT(DISTINCT payer_wallet),
        now()
    FROM x402_payments
    WHERE endpoint = p_endpoint
      AND verified = true
      AND to_char(created_at, 'YYYY-MM') = p_period
    ON CONFLICT (period, endpoint)
    DO UPDATE SET
        total_calls = EXCLUDED.total_calls,
        total_usdc = EXCLUDED.total_usdc,
        unique_payers = EXCLUDED.unique_payers,
        updated_at = now();
END;
$$;

COMMENT ON FUNCTION update_x402_revenue IS 'Updates x402_revenue materialized aggregates for a given period and endpoint';
