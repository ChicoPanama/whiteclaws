-- Extended Protocol Details for WhiteClaws
-- Stores comprehensive bounty scope information from Immunefi

-- Add detailed fields to protocols table
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS min_bounty numeric;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS severity_payouts jsonb DEFAULT '{}'; -- {critical: 1000000, high: 100000, ...}
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS kyc_required boolean DEFAULT false;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS scope_details jsonb DEFAULT '{}'; -- { in_scope: [...], out_of_scope: [...] }
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS contracts_detailed jsonb DEFAULT '[]'; -- [{address: "0x...", network: "ethereum", functions: [...], lines: n}]
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS assets jsonb DEFAULT '[]'; -- [{type: "token", address: "0x...", symbol: "...", network: "..."}]
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS known_issues text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS program_rules text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS documentation_urls text[] DEFAULT '{}';
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}'; -- solidity, rust, move, etc
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS audit_history jsonb DEFAULT '[]'; -- [{auditor: "...", date: "...", url: "..."}]
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS previous_hacks jsonb DEFAULT '[]'; -- [{date: "...", amount: n, description: "..."}]
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS launch_date date;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS tvl_verified boolean DEFAULT false;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS last_synced_at timestamp with time zone;

-- New table for contract-level scope details
CREATE TABLE IF NOT EXISTS protocol_contracts (
    id uuid primary key default uuid_generate_v4(),
    protocol_id uuid references protocols(id) on delete cascade,
    network varchar, -- ethereum, base, arbitrum, etc
    address varchar(42), -- 0x... contract address
    name varchar, -- Contract name if known
    description text, -- What this contract does
    in_scope boolean default true,
    lines_of_code integer,
    functions jsonb DEFAULT '[]', -- Array of function signatures
    modifiers jsonb DEFAULT '[]', -- Array of access modifiers
    is_upgradeable boolean DEFAULT false,
    proxy_implementation text, -- Implementation address if proxy
    created_at timestamp with time zone default now()
);

-- New table for bounty program rules/eligibility
CREATE TABLE IF NOT EXISTS protocol_rules (
    id uuid primary key default uuid_generate_v4(),
    protocol_id uuid references protocols(id) on delete cascade,
    rule_type varchar, -- eligibility, scope, disclosure, etc
    title varchar,
    description text,
    is_critical boolean DEFAULT false,
    created_at timestamp with time zone default now()
);

-- New table for severityclassification with examples
CREATE TABLE IF NOT EXISTS severity_criteria (
    id uuid primary key default uuid_generate_v4(),
    protocol_id uuid references protocols(id) on delete cascade,
    severity varchar check (severity in ('critical', 'high', 'medium', 'low', 'none')),
    min_amount numeric,
    max_amount numeric,
    percentage_tvl numeric, -- e.g., 10% for critical
    description text, -- What counts as this severity
    examples jsonb DEFAULT '[]', -- Example vulnerabilities
    created_at timestamp with time zone default now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_protocol_contracts_protocol ON protocol_contracts(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_contracts_address ON protocol_contracts(address);
CREATE INDEX IF NOT EXISTS idx_protocol_contracts_network ON protocol_contracts(network);
CREATE INDEX IF NOT EXISTS idx_severity_criteria_protocol ON severity_criteria(protocol_id);

-- RLS Policies
ALTER TABLE protocol_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE severity_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Protocol contracts viewable by all" ON protocol_contracts FOR SELECT USING (true);
CREATE POLICY "Protocol rules viewable by all" ON protocol_rules FOR SELECT USING (true);
CREATE POLICY "Severity criteria viewable by all" ON severity_criteria FOR SELECT USING (true);

-- Add GIN indexes for JSONB searching
CREATE INDEX IF NOT EXISTS idx_protocols_scope_details ON protocols USING GIN(scope_details);
CREATE INDEX IF NOT EXISTS idx_protocols_contracts_detailed ON protocols USING GIN(contracts_detailed);
CREATE INDEX IF NOT EXISTS idx_protocols_assets ON protocols USING GIN(assets);
