-- WhiteClaws Protocol Enrichment — New Columns
-- Adds social links, hunter toolkit data, and metadata

ALTER TABLE protocols ADD COLUMN IF NOT EXISTS twitter text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS discord text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS telegram text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS legal_email text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS whitepaper_url text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS bounty_policy_url text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS developer_docs_url text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS status_page_url text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS reddit_url text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS blog_url text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS coingecko_id text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS market_cap_rank integer;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS auditors jsonb;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS audit_report_urls jsonb;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_protocols_twitter ON protocols(twitter) WHERE twitter IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_protocols_coingecko ON protocols(coingecko_id) WHERE coingecko_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_protocols_market_rank ON protocols(market_cap_rank) WHERE market_cap_rank IS NOT NULL;
