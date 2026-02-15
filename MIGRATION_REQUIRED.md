# 🚨 MANUAL MIGRATION REQUIRED

## Missing Tables Need to be Created

The following 3 tables need to be created in Supabase manually:
1. `referral_tree`
2. `referral_bonuses`
3. `wallet_signature_nonces`

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Open Supabase SQL Editor
👉 https://supabase.com/dashboard/project/rsbrpuqwxztblqsqkefr/sql

### Step 2: Copy and Execute This SQL

```sql
-- Table: referral_tree (Multi-level referral relationships)
CREATE TABLE IF NOT EXISTS referral_tree (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address text NOT NULL,
    referrer_wallet text NOT NULL,
    level integer NOT NULL CHECK (level >= 1 AND level <= 5),
    upline_path text[] DEFAULT '{}',
    qualified boolean DEFAULT false,
    qualified_at timestamptz,
    created_at timestamptz DEFAULT now(),
    UNIQUE(wallet_address, referrer_wallet)
);

CREATE INDEX idx_referral_tree_wallet ON referral_tree(wallet_address);
CREATE INDEX idx_referral_tree_referrer ON referral_tree(referrer_wallet);
CREATE INDEX idx_referral_tree_level ON referral_tree(level);
CREATE INDEX idx_referral_tree_qualified ON referral_tree(qualified);

-- Table: referral_bonuses (Bonus distribution records)
CREATE TABLE IF NOT EXISTS referral_bonuses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    earner_wallet text NOT NULL,
    contributor_wallet text NOT NULL,
    level integer NOT NULL CHECK (level >= 1 AND level <= 5),
    event_type text NOT NULL,
    base_points integer NOT NULL,
    bonus_percentage decimal(5,4) NOT NULL,
    bonus_points integer NOT NULL,
    season integer DEFAULT 1,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_referral_bonuses_earner ON referral_bonuses(earner_wallet);
CREATE INDEX idx_referral_bonuses_contributor ON referral_bonuses(contributor_wallet);
CREATE INDEX idx_referral_bonuses_season ON referral_bonuses(season);

-- Table: wallet_signature_nonces (Replay attack prevention)
CREATE TABLE IF NOT EXISTS wallet_signature_nonces (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address text NOT NULL,
    nonce text NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(wallet_address, nonce)
);

CREATE INDEX idx_wallet_nonces_wallet ON wallet_signature_nonces(wallet_address);
CREATE INDEX idx_wallet_nonces_expires ON wallet_signature_nonces(expires_at);

-- Enable RLS
ALTER TABLE referral_tree ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_signature_nonces ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role full access - referral_tree"
  ON referral_tree FOR ALL
  USING (true);

CREATE POLICY "Service role full access - referral_bonuses"
  ON referral_bonuses FOR ALL
  USING (true);

CREATE POLICY "Service role full access - wallet_nonces"
  ON wallet_signature_nonces FOR ALL
  USING (true);
```

### Step 3: Click "RUN" ▶️

You should see:
```
Success. No rows returned
```

### Step 4: Verify Tables Created

Run this query to verify:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('referral_tree', 'referral_bonuses', 'wallet_signature_nonces');
```

You should see all 3 tables listed.

---

## ✅ Tables Already Exist

The following tables were already created in previous deployments:
- ✅ `users`
- ✅ `referral_links`
- ✅ `participation_events`
- ✅ `contribution_scores`
- ✅ `anti_sybil_flags`
- ✅ `rate_limit_buckets`

---

## 🔄 After Migration Complete

Once you've run the SQL above, the system will be fully operational!

Test with:
```bash
curl https://whiteclaws.xyz/api/health
```
