-- 013_missing_tables.sql
-- Create tables that are defined in database.types.ts and used in API routes
-- but were never created via migration: protocol_members, programs,
-- program_scopes, api_keys, finding_comments.
-- All statements use IF NOT EXISTS — safe to re-run.

-- ══════════════════════════════════════════════════════════════
-- 1. protocol_members — Protocol team membership & RBAC
-- Used by: lib/auth/protocol-guards.ts, /api/protocols/register
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS protocol_members (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id     uuid NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            text NOT NULL DEFAULT 'viewer'
                    CHECK (role IN ('owner', 'admin', 'triager', 'viewer')),
    invited_by      uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at      timestamptz DEFAULT now(),
    UNIQUE(protocol_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_pm_protocol ON protocol_members(protocol_id);
CREATE INDEX IF NOT EXISTS idx_pm_user ON protocol_members(user_id);

ALTER TABLE protocol_members ENABLE ROW LEVEL SECURITY;

-- Protocol members can view their own membership
DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='protocol_members'
      AND policyname='pm_own_membership'
  ) THEN
    CREATE POLICY "pm_own_membership"
      ON public.protocol_members FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $block$;

-- Protocol owners/admins can manage members
DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='protocol_members'
      AND policyname='pm_admin_manage'
  ) THEN
    CREATE POLICY "pm_admin_manage"
      ON public.protocol_members FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM protocol_members pm
          WHERE pm.protocol_id = protocol_members.protocol_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('owner', 'admin')
        )
      );
  END IF;
END $block$;

-- Service role can insert (for registration flow)
DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='protocol_members'
      AND policyname='pm_service_insert'
  ) THEN
    CREATE POLICY "pm_service_insert"
      ON public.protocol_members FOR INSERT
      WITH CHECK (true);
  END IF;
END $block$;


-- ══════════════════════════════════════════════════════════════
-- 2. programs — Bounty program configuration per protocol
-- Used by: /api/protocols/register, /api/bounties, /api/protocols/[slug]/program
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS programs (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id             uuid NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
    status                  text DEFAULT 'draft'
                            CHECK (status IN ('draft', 'active', 'paused', 'closed')),
    scope_version           integer DEFAULT 1,
    duplicate_policy        text DEFAULT 'first-reporter',
    response_sla_hours      integer DEFAULT 72,
    poc_required            boolean DEFAULT true,
    kyc_required            boolean DEFAULT true,
    payout_currency         text DEFAULT 'USDC',
    min_payout              numeric DEFAULT 500,
    max_payout              numeric DEFAULT 100000,
    encryption_public_key   text,
    payout_wallet           text,
    exclusions              text[] DEFAULT '{}',
    cooldown_hours          integer DEFAULT 24,
    created_at              timestamptz DEFAULT now(),
    updated_at              timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_programs_protocol ON programs(protocol_id);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- Public read for bounty browsing
DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='programs'
      AND policyname='programs_public_read'
  ) THEN
    CREATE POLICY "programs_public_read"
      ON public.programs FOR SELECT USING (true);
  END IF;
END $block$;

-- Protocol admins can manage their programs
DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='programs'
      AND policyname='programs_admin_manage'
  ) THEN
    CREATE POLICY "programs_admin_manage"
      ON public.programs FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM protocol_members pm
          WHERE pm.protocol_id = programs.protocol_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('owner', 'admin')
        )
      );
  END IF;
END $block$;


-- ══════════════════════════════════════════════════════════════
-- 3. program_scopes — Versioned scope definitions per program
-- Used by: /api/protocols/register, /api/bounties, /api/protocols/[slug]/scope
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS program_scopes (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id              uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    version                 integer NOT NULL DEFAULT 1,
    contracts               jsonb DEFAULT '[]',
    in_scope                text[] DEFAULT '{}',
    out_of_scope            text[] DEFAULT '{}',
    severity_definitions    jsonb DEFAULT '{}',
    created_at              timestamptz DEFAULT now(),
    UNIQUE(program_id, version)
);

CREATE INDEX IF NOT EXISTS idx_scopes_program ON program_scopes(program_id);

ALTER TABLE program_scopes ENABLE ROW LEVEL SECURITY;

-- Public read for bounty browsing
DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='program_scopes'
      AND policyname='program_scopes_public_read'
  ) THEN
    CREATE POLICY "program_scopes_public_read"
      ON public.program_scopes FOR SELECT USING (true);
  END IF;
END $block$;


-- ══════════════════════════════════════════════════════════════
-- 4. api_keys — Agent/protocol API key management
-- Used by: lib/auth/api-key.ts, /api/agents/keys
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS api_keys (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash            text NOT NULL UNIQUE,
    key_prefix          text NOT NULL,
    name                text DEFAULT 'default',
    scopes              text[] DEFAULT '{agent:read,agent:submit}',
    rate_limit_per_hour integer DEFAULT 100,
    last_used_at        timestamptz,
    expires_at          timestamptz,
    revoked_at          timestamptz,
    created_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apikeys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_apikeys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_apikeys_prefix ON api_keys(key_prefix);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users can view their own keys
DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='api_keys'
      AND policyname='apikeys_own_read'
  ) THEN
    CREATE POLICY "apikeys_own_read"
      ON public.api_keys FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $block$;

-- Users can manage their own keys
DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='api_keys'
      AND policyname='apikeys_own_manage'
  ) THEN
    CREATE POLICY "apikeys_own_manage"
      ON public.api_keys FOR ALL
      USING (user_id = auth.uid());
  END IF;
END $block$;


-- ══════════════════════════════════════════════════════════════
-- 5. finding_comments — Comments on findings (public + internal)
-- Used by: /api/findings/[id]/comment, /api/agents/findings/[id]
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS finding_comments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id      uuid NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content         text NOT NULL,
    is_internal     boolean DEFAULT false,
    created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fc_finding ON finding_comments(finding_id);
CREATE INDEX IF NOT EXISTS idx_fc_user ON finding_comments(user_id);

ALTER TABLE finding_comments ENABLE ROW LEVEL SECURITY;

-- Researchers can see public comments on their own findings
DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='finding_comments'
      AND policyname='fc_researcher_public'
  ) THEN
    CREATE POLICY "fc_researcher_public"
      ON public.finding_comments FOR SELECT
      USING (
        is_internal = false
        AND EXISTS (
          SELECT 1 FROM findings f
          WHERE f.id = finding_comments.finding_id
            AND f.researcher_id = auth.uid()
        )
      );
  END IF;
END $block$;

-- Protocol members can see all comments (including internal)
DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='finding_comments'
      AND policyname='fc_protocol_all'
  ) THEN
    CREATE POLICY "fc_protocol_all"
      ON public.finding_comments FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM findings f
          JOIN protocol_members pm ON pm.protocol_id = f.protocol_id::uuid
          WHERE f.id = finding_comments.finding_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('owner', 'admin', 'triager')
        )
      );
  END IF;
END $block$;

-- Authenticated users can insert comments (auth checked in API layer)
DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='finding_comments'
      AND policyname='fc_insert'
  ) THEN
    CREATE POLICY "fc_insert"
      ON public.finding_comments FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END $block$;


-- ══════════════════════════════════════════════════════════════
-- 6. Add FK from findings to programs (if not exists)
-- ══════════════════════════════════════════════════════════════
DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'findings_program_id_fkey'
      AND table_name = 'findings'
  ) THEN
    -- Ensure findings has program_id column
    ALTER TABLE findings ADD COLUMN IF NOT EXISTS program_id uuid;
    ALTER TABLE findings ADD COLUMN IF NOT EXISTS scope_version integer;
    ALTER TABLE findings ADD CONSTRAINT findings_program_id_fkey
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;
  END IF;
END $block$;
