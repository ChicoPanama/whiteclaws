-- OAuth state and SIWE nonce tables for serverless compatibility.
-- In-memory Maps do not persist across Vercel Function invocations.

-- X OAuth state (replaces in-memory oauthStates Map)
CREATE TABLE IF NOT EXISTS x_oauth_states (
  state       TEXT PRIMARY KEY,
  user_id     UUID NOT NULL,
  code_verifier TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-expire rows older than 10 minutes (cleanup via cron or on read)
CREATE INDEX IF NOT EXISTS idx_x_oauth_states_created ON x_oauth_states (created_at);

ALTER TABLE x_oauth_states ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write (server-side only)
CREATE POLICY "service_role_all" ON x_oauth_states
  FOR ALL USING (auth.role() = 'service_role');

-- SIWE nonce store (replaces in-memory nonceStore Map)
CREATE TABLE IF NOT EXISTS siwe_nonces (
  nonce       TEXT PRIMARY KEY,
  used        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_siwe_nonces_created ON siwe_nonces (created_at);

ALTER TABLE siwe_nonces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON siwe_nonces
  FOR ALL USING (auth.role() = 'service_role');
