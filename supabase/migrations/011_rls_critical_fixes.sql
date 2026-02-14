-- 011_rls_critical_fixes.sql
-- Critical RLS policy fixes for protocol team findings access,
-- agent rankings public read, and programs/scopes public read.
-- All statements use IF NOT EXISTS — safe to re-run.

-- ══════════════════════════════════════════════════════════════
-- 1. Protocol teams can VIEW findings via protocol_members
-- ══════════════════════════════════════════════════════════════
DO $block$
BEGIN
  IF to_regclass('public.protocol_members') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='findings'
        AND policyname='protocol_members_view_findings'
    ) THEN
      CREATE POLICY "protocol_members_view_findings"
        ON public.findings FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM protocol_members
            WHERE protocol_members.protocol_id = findings.protocol_id
              AND protocol_members.user_id = auth.uid()
              AND protocol_members.role IN ('owner', 'admin', 'triager')
          )
        );
    END IF;
  END IF;
END $block$;

-- Fallback: protocol_access table (initial schema)
DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='findings'
      AND policyname='protocol_access_view_findings'
  ) THEN
    CREATE POLICY "protocol_access_view_findings"
      ON public.findings FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM protocol_access
          WHERE protocol_access.protocol_id = findings.protocol_id
            AND protocol_access.user_id = auth.uid()
            AND protocol_access.access_level IN ('admin', 'researcher')
        )
      );
  END IF;
END $block$;

-- ══════════════════════════════════════════════════════════════
-- 2. Protocol admins can TRIAGE findings (UPDATE policy)
-- ══════════════════════════════════════════════════════════════
DO $block$
BEGIN
  IF to_regclass('public.protocol_members') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='findings'
        AND policyname='protocol_members_triage_findings'
    ) THEN
      CREATE POLICY "protocol_members_triage_findings"
        ON public.findings FOR UPDATE
        USING (
          EXISTS (
            SELECT 1 FROM protocol_members
            WHERE protocol_members.protocol_id = findings.protocol_id
              AND protocol_members.user_id = auth.uid()
              AND protocol_members.role IN ('owner', 'admin')
          )
        );
    END IF;
  END IF;
END $block$;

-- ══════════════════════════════════════════════════════════════
-- 3. Agent rankings public read (leaderboard)
-- ══════════════════════════════════════════════════════════════
DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='agent_rankings'
      AND policyname='agent_rankings_public_read'
  ) THEN
    CREATE POLICY "agent_rankings_public_read"
      ON public.agent_rankings FOR SELECT USING (true);
  END IF;
END $block$;

-- ══════════════════════════════════════════════════════════════
-- 4. Programs + scopes public read (bounty browsing)
-- ══════════════════════════════════════════════════════════════
DO $block$
BEGIN
  IF to_regclass('public.programs') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='programs'
        AND policyname='programs_public_read'
    ) THEN
      CREATE POLICY "programs_public_read"
        ON public.programs FOR SELECT USING (true);
    END IF;
  END IF;

  IF to_regclass('public.program_scopes') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.program_scopes ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='program_scopes'
        AND policyname='program_scopes_public_read'
    ) THEN
      CREATE POLICY "program_scopes_public_read"
        ON public.program_scopes FOR SELECT USING (true);
    END IF;
  END IF;
END $block$;
