import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * ONE-SHOT migration endpoint. Deploy → call → delete.
 * Protected by secret token.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  if (body.token !== 'wc-migrate-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { Client } = await import('pg' as any)
  
  const client = new Client({
    host: 'db.rsbrpuqwxztblqsqkefr.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'allieaura13!!',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  })

  try {
    await client.connect()

    const statements = [
      // 1. Extend protocols
      `ALTER TABLE protocols ADD COLUMN IF NOT EXISTS claimed boolean DEFAULT false`,
      `ALTER TABLE protocols ADD COLUMN IF NOT EXISTS claimed_at timestamptz`,
      `ALTER TABLE protocols ADD COLUMN IF NOT EXISTS immunefi_slug text`,
      `ALTER TABLE protocols ADD COLUMN IF NOT EXISTS immunefi_url text`,
      `ALTER TABLE protocols ADD COLUMN IF NOT EXISTS security_email text`,
      `ALTER TABLE protocols ADD COLUMN IF NOT EXISTS github_org text`,

      // 2. Finding notifications
      `CREATE TABLE IF NOT EXISTS finding_notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        finding_id uuid REFERENCES findings(id) ON DELETE CASCADE,
        protocol_id uuid REFERENCES protocols(id) ON DELETE CASCADE,
        channel text NOT NULL CHECK (channel IN ('email', 'immunefi_route', 'github')),
        recipient text NOT NULL,
        sent_at timestamptz DEFAULT now(),
        status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'bounced', 'failed')),
        error text,
        created_at timestamptz DEFAULT now()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_notif_finding ON finding_notifications(finding_id)`,
      `CREATE INDEX IF NOT EXISTS idx_notif_protocol ON finding_notifications(protocol_id)`,

      // 3. Points engine
      `CREATE TABLE IF NOT EXISTS participation_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_type text NOT NULL,
        points integer NOT NULL DEFAULT 0,
        metadata jsonb DEFAULT '{}',
        wallet_address text,
        verified boolean DEFAULT false,
        season integer NOT NULL DEFAULT 1,
        week integer NOT NULL,
        created_at timestamptz DEFAULT now()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_events_user_season ON participation_events(user_id, season)`,
      `CREATE INDEX IF NOT EXISTS idx_events_type ON participation_events(event_type)`,
      `CREATE INDEX IF NOT EXISTS idx_events_week ON participation_events(season, week)`,
      `CREATE INDEX IF NOT EXISTS idx_events_wallet ON participation_events(wallet_address)`,

      // Contribution scores
      `CREATE TABLE IF NOT EXISTS contribution_scores (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        season integer NOT NULL DEFAULT 1,
        security_points integer DEFAULT 0,
        growth_points integer DEFAULT 0,
        engagement_points integer DEFAULT 0,
        social_points integer DEFAULT 0,
        penalty_points integer DEFAULT 0,
        total_score float DEFAULT 0,
        rank integer,
        streak_weeks integer DEFAULT 0,
        last_active_at timestamptz,
        sybil_multiplier float DEFAULT 1.0,
        updated_at timestamptz DEFAULT now(),
        UNIQUE(user_id, season)
      )`,
      `CREATE INDEX IF NOT EXISTS idx_scores_season_rank ON contribution_scores(season, rank)`,

      // 4. Anti-spam
      `CREATE TABLE IF NOT EXISTS spam_flags (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        flag_type text NOT NULL CHECK (flag_type IN (
          'rejected_finding', 'duplicate_finding', 'low_quality',
          'rate_limit_hit', 'copy_paste_detected', 'sybil_cluster', 'farming_pattern'
        )),
        severity text DEFAULT 'warning' CHECK (severity IN ('warning', 'strike', 'ban')),
        points_deducted integer DEFAULT 0,
        metadata jsonb DEFAULT '{}',
        finding_id uuid REFERENCES findings(id),
        reviewed boolean DEFAULT false,
        reviewed_by text,
        created_at timestamptz DEFAULT now()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_spam_user ON spam_flags(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_spam_type ON spam_flags(flag_type)`,

      // Anti-sybil
      `CREATE TABLE IF NOT EXISTS anti_sybil_flags (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_address text NOT NULL,
        risk_score float DEFAULT 0.0 CHECK (risk_score >= 0 AND risk_score <= 1),
        flags jsonb DEFAULT '[]',
        cluster_id text,
        reviewed boolean DEFAULT false,
        reviewed_by text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_sybil_wallet ON anti_sybil_flags(wallet_address)`,

      // 5. Extend findings
      `ALTER TABLE findings ADD COLUMN IF NOT EXISTS quality_score float`,
      `ALTER TABLE findings ADD COLUMN IF NOT EXISTS similarity_hash text`,
      `ALTER TABLE findings ADD COLUMN IF NOT EXISTS submission_source text DEFAULT 'whiteclaws'`,
      `ALTER TABLE findings ADD COLUMN IF NOT EXISTS immunefi_routed boolean DEFAULT false`,
      `ALTER TABLE findings ADD COLUMN IF NOT EXISTS immunefi_routed_at timestamptz`,
      `ALTER TABLE findings ADD COLUMN IF NOT EXISTS notification_sent boolean DEFAULT false`,
    ]

    const results: Array<{ stmt: string; status: string }> = []

    for (const stmt of statements) {
      try {
        await client.query(stmt)
        results.push({ stmt: stmt.slice(0, 80) + '...', status: '✅' })
      } catch (e: any) {
        if (e.message.includes('already exists') || e.message.includes('duplicate')) {
          results.push({ stmt: stmt.slice(0, 80) + '...', status: '⏭️ exists' })
        } else {
          results.push({ stmt: stmt.slice(0, 80) + '...', status: `❌ ${e.message.slice(0, 100)}` })
        }
      }
    }

    // Verify
    const { rows: tables } = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `)

    await client.end()

    return NextResponse.json({
      migration: 'complete',
      results,
      tables: tables.map((r: any) => r.table_name),
    })
  } catch (e: any) {
    try { await client.end() } catch {}
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
