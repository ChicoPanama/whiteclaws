-- Migration: 016_escrow_system.sql
-- WhiteClaws Escrow & Automatic Payout System
-- Smart contract escrow for bounty programs with automatic 90/10 split on Base

-- ═══════════════════════════════════════════════════════════════
-- Escrow Vaults Table (per-program escrow balances)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS escrow_vaults (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id      uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE UNIQUE,
    protocol_id     uuid NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
    deposited_total numeric NOT NULL DEFAULT 0,
    balance         numeric NOT NULL DEFAULT 0,
    currency        text NOT NULL DEFAULT 'USDC',
    chain           text NOT NULL DEFAULT 'base',
    status          text DEFAULT 'active' CHECK (status IN ('active', 'depleted', 'refunded', 'frozen')),
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_escrow_program ON escrow_vaults(program_id);
CREATE INDEX IF NOT EXISTS idx_escrow_protocol ON escrow_vaults(protocol_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_vaults(status);
CREATE INDEX IF NOT EXISTS idx_escrow_balance ON escrow_vaults(balance DESC);

-- Comments
COMMENT ON TABLE escrow_vaults IS 'Smart contract escrow vaults for bounty programs on Base (Initiative 4)';
COMMENT ON COLUMN escrow_vaults.deposited_total IS 'Total amount ever deposited into this vault';
COMMENT ON COLUMN escrow_vaults.balance IS 'Current available balance for payouts';
COMMENT ON COLUMN escrow_vaults.status IS 'active: accepting payouts | depleted: balance=0 | refunded: closed | frozen: admin lock';

-- ═══════════════════════════════════════════════════════════════
-- Escrow Transactions Table (all vault movements)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id        uuid NOT NULL REFERENCES escrow_vaults(id) ON DELETE CASCADE,
    type            text NOT NULL CHECK (type IN ('deposit', 'release', 'refund', 'fee')),
    finding_id      uuid REFERENCES findings(id) ON DELETE SET NULL,
    from_wallet     text NOT NULL,
    to_wallet       text NOT NULL,
    amount          numeric NOT NULL,
    fee_amount      numeric DEFAULT 0,
    fee_wallet      text,
    tx_hash         text NOT NULL UNIQUE,
    block_number    bigint,
    status          text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    created_at      timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_escrow_tx_vault ON escrow_transactions(vault_id);
CREATE INDEX IF NOT EXISTS idx_escrow_tx_finding ON escrow_transactions(finding_id);
CREATE INDEX IF NOT EXISTS idx_escrow_tx_type ON escrow_transactions(type);
CREATE INDEX IF NOT EXISTS idx_escrow_tx_tx ON escrow_transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_escrow_tx_status ON escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_escrow_tx_created ON escrow_transactions(created_at DESC);

-- Comments
COMMENT ON TABLE escrow_transactions IS 'All escrow vault transactions: deposits, releases, refunds, fees';
COMMENT ON COLUMN escrow_transactions.type IS 'deposit: protocol adds funds | release: payout to researcher | refund: return to protocol | fee: platform cut';
COMMENT ON COLUMN escrow_transactions.fee_amount IS 'Platform fee (10% of release amount)';
COMMENT ON COLUMN escrow_transactions.fee_wallet IS 'WhiteClaws treasury wallet that received fee';
COMMENT ON COLUMN escrow_transactions.tx_hash IS 'On-chain transaction hash on Base';

-- ═══════════════════════════════════════════════════════════════
-- Platform Revenue Table (consolidated revenue tracking)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS platform_revenue (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source          text NOT NULL CHECK (source IN ('escrow_fee', 'x402_intel', 'other')),
    amount          numeric NOT NULL,
    currency        text NOT NULL DEFAULT 'USDC',
    tx_hash         text,
    reference_id    uuid,
    period          text,
    created_at      timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_revenue_source ON platform_revenue(source);
CREATE INDEX IF NOT EXISTS idx_revenue_period ON platform_revenue(period);
CREATE INDEX IF NOT EXISTS idx_revenue_created ON platform_revenue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_reference ON platform_revenue(reference_id);

-- Comments
COMMENT ON TABLE platform_revenue IS 'Consolidated platform revenue from all sources';
COMMENT ON COLUMN platform_revenue.source IS 'escrow_fee: 10% from bounty payouts | x402_intel: intelligence API sales | other: misc';
COMMENT ON COLUMN platform_revenue.reference_id IS 'Links to escrow_transactions.id or x402_payments.id';
COMMENT ON COLUMN platform_revenue.period IS 'Revenue period (e.g., "2026-02")';

-- ═══════════════════════════════════════════════════════════════
-- Extend programs table with escrow vault reference
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE programs ADD COLUMN IF NOT EXISTS escrow_vault_id uuid REFERENCES escrow_vaults(id);

CREATE INDEX IF NOT EXISTS idx_programs_escrow_vault ON programs(escrow_vault_id);

COMMENT ON COLUMN programs.escrow_vault_id IS 'Optional link to escrow vault if program uses escrow';

-- ═══════════════════════════════════════════════════════════════
-- RLS Policies for escrow_vaults
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE escrow_vaults ENABLE ROW LEVEL SECURITY;

-- Protocol admins can view their own vaults
CREATE POLICY "Protocol admins can view own escrow vaults"
    ON escrow_vaults
    FOR SELECT
    USING (
        protocol_id IN (
            SELECT protocol_id FROM protocol_members
            WHERE user_id = auth.uid()
        )
    );

-- Public read for active vault balances (transparency)
CREATE POLICY "Public read for active escrow vault balances"
    ON escrow_vaults
    FOR SELECT
    USING (status = 'active');

-- Service role full access
CREATE POLICY "Service role full access to escrow vaults"
    ON escrow_vaults
    FOR ALL
    USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════
-- RLS Policies for escrow_transactions
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;

-- Protocol admins can view their vault transactions
CREATE POLICY "Protocol admins can view own vault transactions"
    ON escrow_transactions
    FOR SELECT
    USING (
        vault_id IN (
            SELECT id FROM escrow_vaults
            WHERE protocol_id IN (
                SELECT protocol_id FROM protocol_members
                WHERE user_id = auth.uid()
            )
        )
    );

-- Researchers can view transactions related to their findings
CREATE POLICY "Researchers can view own finding transactions"
    ON escrow_transactions
    FOR SELECT
    USING (
        finding_id IN (
            SELECT id FROM findings
            WHERE researcher_id = auth.uid()
        )
    );

-- Public read for confirmed transactions (transparency)
CREATE POLICY "Public read for confirmed escrow transactions"
    ON escrow_transactions
    FOR SELECT
    USING (status = 'confirmed');

-- Service role full access
CREATE POLICY "Service role full access to escrow transactions"
    ON escrow_transactions
    FOR ALL
    USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════
-- RLS Policies for platform_revenue
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE platform_revenue ENABLE ROW LEVEL SECURITY;

-- Public read for aggregate revenue stats (transparency)
CREATE POLICY "Public read for platform revenue"
    ON platform_revenue
    FOR SELECT
    USING (true);

-- Service role full access
CREATE POLICY "Service role full access to platform revenue"
    ON platform_revenue
    FOR ALL
    USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════
-- Functions for escrow management
-- ═══════════════════════════════════════════════════════════════

-- Update vault balance after transaction
CREATE OR REPLACE FUNCTION update_vault_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'confirmed' THEN
        CASE NEW.type
            WHEN 'deposit' THEN
                UPDATE escrow_vaults
                SET balance = balance + NEW.amount,
                    deposited_total = deposited_total + NEW.amount,
                    updated_at = now()
                WHERE id = NEW.vault_id;
            
            WHEN 'release' THEN
                UPDATE escrow_vaults
                SET balance = balance - (NEW.amount + NEW.fee_amount),
                    updated_at = now()
                WHERE id = NEW.vault_id;
            
            WHEN 'refund' THEN
                UPDATE escrow_vaults
                SET balance = balance - NEW.amount,
                    status = CASE WHEN balance - NEW.amount <= 0 THEN 'depleted' ELSE status END,
                    updated_at = now()
                WHERE id = NEW.vault_id;
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger to update vault balance
DROP TRIGGER IF EXISTS trigger_update_vault_balance ON escrow_transactions;
CREATE TRIGGER trigger_update_vault_balance
    AFTER INSERT OR UPDATE ON escrow_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_vault_balance();

COMMENT ON FUNCTION update_vault_balance IS 'Automatically updates escrow vault balance when transactions are confirmed';

-- Record platform revenue from escrow fees
CREATE OR REPLACE FUNCTION record_escrow_fee_revenue()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'confirmed' AND NEW.type = 'release' AND NEW.fee_amount > 0 THEN
        INSERT INTO platform_revenue (source, amount, currency, tx_hash, reference_id, period, created_at)
        VALUES (
            'escrow_fee',
            NEW.fee_amount,
            'USDC',
            NEW.tx_hash,
            NEW.id,
            to_char(NEW.created_at, 'YYYY-MM'),
            NEW.created_at
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger to record revenue
DROP TRIGGER IF EXISTS trigger_record_escrow_fee ON escrow_transactions;
CREATE TRIGGER trigger_record_escrow_fee
    AFTER INSERT OR UPDATE ON escrow_transactions
    FOR EACH ROW
    EXECUTE FUNCTION record_escrow_fee_revenue();

COMMENT ON FUNCTION record_escrow_fee_revenue IS 'Automatically records platform revenue when escrow fees are collected';
