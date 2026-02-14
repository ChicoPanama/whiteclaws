-- Phase 0 (Bead 0.3): Explicit RLS + policies for airdrop/referral/points tables
-- Purpose:
-- - Make access patterns explicit and least-privilege
-- - Avoid default/implicit access behavior for newly introduced tables
-- - Do not weaken existing RLS elsewhere (only enables + defines explicit policies)
--
-- Notes:
-- - Many API routes use the service-role Supabase client, which bypasses RLS.
-- - These policies are for anon/authenticated clients and future-proofing.

DO $$
BEGIN
  -- Enable RLS (no-op if table doesn't exist).
  IF to_regclass('public.access_sbt') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.access_sbt ENABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public.participation_events') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.participation_events ENABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public.contribution_scores') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.contribution_scores ENABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public.referral_links') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public.referral_rewards') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public.x_verifications') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.x_verifications ENABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public.anti_sybil_flags') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.anti_sybil_flags ENABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public.season_config') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.season_config ENABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public.spam_flags') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.spam_flags ENABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public.finding_notifications') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.finding_notifications ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- Helper: idempotent policy creation via pg_policies checks.

-- access_sbt: owner can read; no client writes.
DO $$
BEGIN
  IF to_regclass('public.access_sbt') IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='access_sbt' AND policyname='access_sbt_select_own'
  ) THEN
    EXECUTE 'CREATE POLICY "access_sbt_select_own" ON public.access_sbt FOR SELECT USING (auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='access_sbt' AND policyname='access_sbt_no_insert'
  ) THEN
    EXECUTE 'CREATE POLICY "access_sbt_no_insert" ON public.access_sbt FOR INSERT WITH CHECK (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='access_sbt' AND policyname='access_sbt_no_update'
  ) THEN
    EXECUTE 'CREATE POLICY "access_sbt_no_update" ON public.access_sbt FOR UPDATE USING (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='access_sbt' AND policyname='access_sbt_no_delete'
  ) THEN
    EXECUTE 'CREATE POLICY "access_sbt_no_delete" ON public.access_sbt FOR DELETE USING (false)';
  END IF;
END $$;

-- participation_events: owner can read; no client writes (events are server-generated).
DO $$
BEGIN
  IF to_regclass('public.participation_events') IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='participation_events' AND policyname='participation_events_select_own'
  ) THEN
    EXECUTE 'CREATE POLICY "participation_events_select_own" ON public.participation_events FOR SELECT USING (auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='participation_events' AND policyname='participation_events_no_insert'
  ) THEN
    EXECUTE 'CREATE POLICY "participation_events_no_insert" ON public.participation_events FOR INSERT WITH CHECK (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='participation_events' AND policyname='participation_events_no_update'
  ) THEN
    EXECUTE 'CREATE POLICY "participation_events_no_update" ON public.participation_events FOR UPDATE USING (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='participation_events' AND policyname='participation_events_no_delete'
  ) THEN
    EXECUTE 'CREATE POLICY "participation_events_no_delete" ON public.participation_events FOR DELETE USING (false)';
  END IF;
END $$;

-- contribution_scores: public read for leaderboard; no client writes.
DO $$
BEGIN
  IF to_regclass('public.contribution_scores') IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contribution_scores' AND policyname='contribution_scores_select_public'
  ) THEN
    EXECUTE 'CREATE POLICY "contribution_scores_select_public" ON public.contribution_scores FOR SELECT USING (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contribution_scores' AND policyname='contribution_scores_no_insert'
  ) THEN
    EXECUTE 'CREATE POLICY "contribution_scores_no_insert" ON public.contribution_scores FOR INSERT WITH CHECK (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contribution_scores' AND policyname='contribution_scores_no_update'
  ) THEN
    EXECUTE 'CREATE POLICY "contribution_scores_no_update" ON public.contribution_scores FOR UPDATE USING (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contribution_scores' AND policyname='contribution_scores_no_delete'
  ) THEN
    EXECUTE 'CREATE POLICY "contribution_scores_no_delete" ON public.contribution_scores FOR DELETE USING (false)';
  END IF;
END $$;

-- referral_links: owner can read; server-only writes.
DO $$
BEGIN
  IF to_regclass('public.referral_links') IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='referral_links' AND policyname='referral_links_select_own'
  ) THEN
    EXECUTE 'CREATE POLICY "referral_links_select_own" ON public.referral_links FOR SELECT USING (auth.uid() = referrer_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='referral_links' AND policyname='referral_links_no_insert'
  ) THEN
    EXECUTE 'CREATE POLICY "referral_links_no_insert" ON public.referral_links FOR INSERT WITH CHECK (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='referral_links' AND policyname='referral_links_no_update'
  ) THEN
    EXECUTE 'CREATE POLICY "referral_links_no_update" ON public.referral_links FOR UPDATE USING (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='referral_links' AND policyname='referral_links_no_delete'
  ) THEN
    EXECUTE 'CREATE POLICY "referral_links_no_delete" ON public.referral_links FOR DELETE USING (false)';
  END IF;
END $$;

-- referral_rewards: referrer or referred can read; server-only writes.
DO $$
BEGIN
  IF to_regclass('public.referral_rewards') IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='referral_rewards' AND policyname='referral_rewards_select_parties'
  ) THEN
    EXECUTE 'CREATE POLICY "referral_rewards_select_parties" ON public.referral_rewards FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='referral_rewards' AND policyname='referral_rewards_no_insert'
  ) THEN
    EXECUTE 'CREATE POLICY "referral_rewards_no_insert" ON public.referral_rewards FOR INSERT WITH CHECK (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='referral_rewards' AND policyname='referral_rewards_no_update'
  ) THEN
    EXECUTE 'CREATE POLICY "referral_rewards_no_update" ON public.referral_rewards FOR UPDATE USING (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='referral_rewards' AND policyname='referral_rewards_no_delete'
  ) THEN
    EXECUTE 'CREATE POLICY "referral_rewards_no_delete" ON public.referral_rewards FOR DELETE USING (false)';
  END IF;
END $$;

-- x_verifications: owner can read; server-only writes.
DO $$
BEGIN
  IF to_regclass('public.x_verifications') IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='x_verifications' AND policyname='x_verifications_select_own'
  ) THEN
    EXECUTE 'CREATE POLICY "x_verifications_select_own" ON public.x_verifications FOR SELECT USING (auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='x_verifications' AND policyname='x_verifications_no_insert'
  ) THEN
    EXECUTE 'CREATE POLICY "x_verifications_no_insert" ON public.x_verifications FOR INSERT WITH CHECK (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='x_verifications' AND policyname='x_verifications_no_update'
  ) THEN
    EXECUTE 'CREATE POLICY "x_verifications_no_update" ON public.x_verifications FOR UPDATE USING (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='x_verifications' AND policyname='x_verifications_no_delete'
  ) THEN
    EXECUTE 'CREATE POLICY "x_verifications_no_delete" ON public.x_verifications FOR DELETE USING (false)';
  END IF;
END $$;

-- anti_sybil_flags: admin-only operational table; explicit deny for anon/auth clients.
DO $$
BEGIN
  IF to_regclass('public.anti_sybil_flags') IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='anti_sybil_flags' AND policyname='anti_sybil_flags_no_select'
  ) THEN
    EXECUTE 'CREATE POLICY "anti_sybil_flags_no_select" ON public.anti_sybil_flags FOR SELECT USING (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='anti_sybil_flags' AND policyname='anti_sybil_flags_no_insert'
  ) THEN
    EXECUTE 'CREATE POLICY "anti_sybil_flags_no_insert" ON public.anti_sybil_flags FOR INSERT WITH CHECK (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='anti_sybil_flags' AND policyname='anti_sybil_flags_no_update'
  ) THEN
    EXECUTE 'CREATE POLICY "anti_sybil_flags_no_update" ON public.anti_sybil_flags FOR UPDATE USING (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='anti_sybil_flags' AND policyname='anti_sybil_flags_no_delete'
  ) THEN
    EXECUTE 'CREATE POLICY "anti_sybil_flags_no_delete" ON public.anti_sybil_flags FOR DELETE USING (false)';
  END IF;
END $$;

-- spam_flags: admin-only internal table; explicit deny for anon/auth clients.
DO $$
BEGIN
  IF to_regclass('public.spam_flags') IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='spam_flags' AND policyname='spam_flags_no_select'
  ) THEN
    EXECUTE 'CREATE POLICY "spam_flags_no_select" ON public.spam_flags FOR SELECT USING (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='spam_flags' AND policyname='spam_flags_no_insert'
  ) THEN
    EXECUTE 'CREATE POLICY "spam_flags_no_insert" ON public.spam_flags FOR INSERT WITH CHECK (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='spam_flags' AND policyname='spam_flags_no_update'
  ) THEN
    EXECUTE 'CREATE POLICY "spam_flags_no_update" ON public.spam_flags FOR UPDATE USING (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='spam_flags' AND policyname='spam_flags_no_delete'
  ) THEN
    EXECUTE 'CREATE POLICY "spam_flags_no_delete" ON public.spam_flags FOR DELETE USING (false)';
  END IF;
END $$;

-- finding_notifications: internal; explicit deny for anon/auth clients.
DO $$
BEGIN
  IF to_regclass('public.finding_notifications') IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='finding_notifications' AND policyname='finding_notifications_no_select'
  ) THEN
    EXECUTE 'CREATE POLICY "finding_notifications_no_select" ON public.finding_notifications FOR SELECT USING (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='finding_notifications' AND policyname='finding_notifications_no_insert'
  ) THEN
    EXECUTE 'CREATE POLICY "finding_notifications_no_insert" ON public.finding_notifications FOR INSERT WITH CHECK (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='finding_notifications' AND policyname='finding_notifications_no_update'
  ) THEN
    EXECUTE 'CREATE POLICY "finding_notifications_no_update" ON public.finding_notifications FOR UPDATE USING (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='finding_notifications' AND policyname='finding_notifications_no_delete'
  ) THEN
    EXECUTE 'CREATE POLICY "finding_notifications_no_delete" ON public.finding_notifications FOR DELETE USING (false)';
  END IF;
END $$;

-- season_config: public read (season metadata); no client writes.
DO $$
BEGIN
  IF to_regclass('public.season_config') IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='season_config' AND policyname='season_config_select_public'
  ) THEN
    EXECUTE 'CREATE POLICY "season_config_select_public" ON public.season_config FOR SELECT USING (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='season_config' AND policyname='season_config_no_insert'
  ) THEN
    EXECUTE 'CREATE POLICY "season_config_no_insert" ON public.season_config FOR INSERT WITH CHECK (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='season_config' AND policyname='season_config_no_update'
  ) THEN
    EXECUTE 'CREATE POLICY "season_config_no_update" ON public.season_config FOR UPDATE USING (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='season_config' AND policyname='season_config_no_delete'
  ) THEN
    EXECUTE 'CREATE POLICY "season_config_no_delete" ON public.season_config FOR DELETE USING (false)';
  END IF;
END $$;

