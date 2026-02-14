-- 012_enforce_uniqueness.sql
-- Enforce wallet_address and handle uniqueness on the users table.
-- Step 1: Clean up any existing duplicate wallets (suffix duplicates).
-- Step 2: Add partial unique indexes (NULL-safe).

-- ══════════════════════════════════════════════════════════════
-- 1. Clean up duplicate wallet addresses (keep oldest, suffix rest)
-- ══════════════════════════════════════════════════════════════
DO $block$
DECLARE
  dup RECORD;
BEGIN
  FOR dup IN
    SELECT wallet_address, array_agg(id ORDER BY created_at ASC) as ids
    FROM users
    WHERE wallet_address IS NOT NULL AND wallet_address != ''
    GROUP BY wallet_address
    HAVING COUNT(*) > 1
  LOOP
    UPDATE users
    SET wallet_address = wallet_address || '_dup_' || id::text
    WHERE id = ANY(dup.ids[2:]);
  END LOOP;
END $block$;

-- ══════════════════════════════════════════════════════════════
-- 2. Add unique constraints (partial — skip NULL and empty)
-- ══════════════════════════════════════════════════════════════
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_wallet_unique
  ON users(wallet_address) WHERE wallet_address IS NOT NULL AND wallet_address != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_handle_unique
  ON users(handle) WHERE handle IS NOT NULL AND handle != '';
