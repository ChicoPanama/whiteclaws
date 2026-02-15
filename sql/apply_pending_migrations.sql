-- Apply these via Supabase SQL Editor (https://supabase.com/dashboard/project/rsbrpuqwxztblqsqkefr/sql)
-- Run in order if not already applied

-- 1. Check which migrations are already applied
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('access_sbt', 'participation_events', 'contribution_scores', 'rate_limit_buckets');

-- 2. If access_sbt is missing, run migration 006_airdrop_system.sql content
-- Copy/paste from: supabase/migrations/006_airdrop_system.sql

-- 3. Apply RLS policies (007_rls_airdrop_policies.sql)
-- Copy/paste from: supabase/migrations/007_rls_airdrop_policies.sql

-- 4. Apply rate limit buckets (008_rate_limit_buckets.sql)
-- Copy/paste from: supabase/migrations/008_rate_limit_buckets.sql

-- 5. Backfill protocol_members for protocols with owner_id
INSERT INTO protocol_members (protocol_id, user_id, role, created_at)
SELECT id, owner_id, 'owner', NOW()
FROM protocols
WHERE owner_id IS NOT NULL
AND id NOT IN (SELECT protocol_id FROM protocol_members WHERE role = 'owner')
ON CONFLICT DO NOTHING;
