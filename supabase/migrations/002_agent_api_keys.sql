-- Phase 5: Agent API key support
-- Run this in Supabase SQL Editor

-- Add API key columns for agent auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key_prefix TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter TEXT;

-- Index for fast API key prefix lookups
CREATE INDEX IF NOT EXISTS idx_users_api_key_prefix ON users(api_key_prefix);

-- Add agent_id to findings for API-submitted findings
ALTER TABLE findings ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_findings_agent_id ON findings(agent_id);
