#!/usr/bin/env node
/**
 * Run the enrichment column migration directly against Supabase.
 * 
 * Usage: 
 *   SUPABASE_DB_URL="postgresql://postgres.rsbrpuqwxztblqsqkefr:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres" node scripts/migrate-add-enrichment-columns.cjs
 *
 * Or set SUPABASE_DB_URL in .env
 */

const { Client } = require('pg');

const DB_URL = process.env.SUPABASE_DB_URL;
if (!DB_URL) {
  console.error('ERROR: Set SUPABASE_DB_URL environment variable');
  console.error('Example: SUPABASE_DB_URL="postgresql://postgres.rsbrpuqwxztblqsqkefr:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres" node scripts/migrate-add-enrichment-columns.cjs');
  process.exit(1);
}

const MIGRATIONS = [
  `ALTER TABLE protocols ADD COLUMN IF NOT EXISTS twitter text`,
  `ALTER TABLE protocols ADD COLUMN IF NOT EXISTS discord text`,
  `ALTER TABLE protocols ADD COLUMN IF NOT EXISTS telegram text`,
  `ALTER TABLE protocols ADD COLUMN IF NOT EXISTS legal_email text`,
  `ALTER TABLE protocols ADD COLUMN IF NOT EXISTS whitepaper_url text`,
  `ALTER TABLE protocols ADD COLUMN IF NOT EXISTS bounty_policy_url text`,
  `ALTER TABLE protocols ADD COLUMN IF NOT EXISTS developer_docs_url text`,
  `ALTER TABLE protocols ADD COLUMN IF NOT EXISTS status_page_url text`,
  `ALTER TABLE protocols ADD COLUMN IF NOT EXISTS reddit_url text`,
  `ALTER TABLE protocols ADD COLUMN IF NOT EXISTS blog_url text`,
  `ALTER TABLE protocols ADD COLUMN IF NOT EXISTS coingecko_id text`,
  `ALTER TABLE protocols ADD COLUMN IF NOT EXISTS market_cap_rank integer`,
  `ALTER TABLE protocols ADD COLUMN IF NOT EXISTS auditors jsonb`,
  `ALTER TABLE protocols ADD COLUMN IF NOT EXISTS audit_report_urls jsonb`,
  `CREATE INDEX IF NOT EXISTS idx_protocols_twitter ON protocols(twitter) WHERE twitter IS NOT NULL`,
  `CREATE INDEX IF NOT EXISTS idx_protocols_coingecko ON protocols(coingecko_id) WHERE coingecko_id IS NOT NULL`,
];

async function main() {
  console.log('🦞 WhiteClaws Enrichment Migration');
  console.log('='.repeat(50));

  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase\n');

    for (const sql of MIGRATIONS) {
      const col = sql.match(/(?:ADD COLUMN IF NOT EXISTS|INDEX IF NOT EXISTS idx_protocols_)(\w+)/)?.[1] || sql.slice(0, 40);
      try {
        await client.query(sql);
        console.log(`  ✅ ${col}`);
      } catch (err) {
        console.log(`  ❌ ${col}: ${err.message}`);
      }
    }

    // Verify
    const { rows } = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'protocols' AND column_name IN (
        'twitter','discord','telegram','legal_email','whitepaper_url',
        'bounty_policy_url','developer_docs_url','status_page_url',
        'reddit_url','blog_url','coingecko_id','market_cap_rank',
        'auditors','audit_report_urls'
      ) ORDER BY column_name
    `);

    console.log(`\n✅ Verified: ${rows.length}/14 columns exist`);
    for (const r of rows) {
      console.log(`  ${r.column_name}: ${r.data_type}`);
    }
  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    await client.end();
  }
}

main();
