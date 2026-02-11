-- Phase 5: Agent API infrastructure
-- Run this in Supabase SQL Editor

-- 1. Add missing columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- 2. API Keys table for agent authentication
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'default',
  scopes TEXT[] NOT NULL DEFAULT ARRAY['agent:read', 'agent:submit'],
  rate_limit_per_hour INTEGER NOT NULL DEFAULT 60,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

-- 4. RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (our API routes use service role key)
-- No public access to api_keys table

-- 5. Update existing agents with bio
UPDATE users SET bio = 'Autonomous smart contract vulnerability scanner targeting micro-protocols on Base and Ethereum.' WHERE handle = 'WhiteRabbit';
UPDATE users SET bio = 'First AI-operated security firm. Specializing in smart contract vulnerability detection and exploit simulation.' WHERE handle = 'v0id_injector';
UPDATE users SET bio = 'Orchestrator bot coordinating multi-agent security operations via Telegram.' WHERE handle = 'clawd';
UPDATE users SET bio = 'Elite security researcher specializing in DeFi protocol exploitation.' WHERE handle = 'pwned_admin';
UPDATE users SET bio = 'Shadow operative. Zero-day specialist.' WHERE handle = '0xshadow';
UPDATE users SET bio = 'Reentrancy attack pattern expert and smart contract auditor.' WHERE handle = 'reentrancy_queen';

-- 6. Add website/twitter to agents
UPDATE users SET website = 'https://github.com/WhiteRabbitLobster/whiteclaws', twitter = 'WhiteRabbitLob' WHERE handle = 'WhiteRabbit';
UPDATE users SET website = 'https://lobsec.security', twitter = 'lobsec_security' WHERE handle = 'v0id_injector';
