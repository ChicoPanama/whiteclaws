#!/usr/bin/env python3
"""
Phase B: Push twitter, discord, telegram, auditors, etc. to new columns.
Run AFTER the SQL migration adds the columns.

Usage: python3 scripts/enrich_phase_b.py
"""

import json, subprocess, urllib.parse, time

SB = "https://rsbrpuqwxztblqsqkefr.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzYnJwdXF3eHp0Ymxxc3FrZWZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc3MTA5MiwiZXhwIjoyMDg2MzQ3MDkyfQ.P6ZRQm9wysNDreQ4CHlnusg1u_EmGtkN2qzkeyC5OTU"

def patch(slug, payload):
    es = urllib.parse.quote(slug)
    r = subprocess.run([
        'curl', '-s', '-o', '/dev/null', '-w', '%{http_code}',
        '-X', 'PATCH', f'{SB}/rest/v1/protocols?slug=eq.{es}',
        '-H', f'apikey: {KEY}', '-H', f'Authorization: Bearer {KEY}',
        '-H', 'Content-Type: application/json', '-H', 'Prefer: return=minimal',
        '-d', json.dumps(payload)
    ], capture_output=True, text=True, timeout=15)
    return r.stdout.strip()

# Test if new columns exist
print("Testing if new columns exist...")
test = patch('__nonexistent__', {'twitter': '@test'})
if test == '400':
    print("❌ Column 'twitter' not found. Run this SQL in Supabase SQL Editor first:\n")
    print("""ALTER TABLE protocols ADD COLUMN IF NOT EXISTS twitter text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS discord text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS telegram text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS legal_email text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS whitepaper_url text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS bounty_policy_url text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS developer_docs_url text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS status_page_url text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS reddit_url text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS blog_url text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS coingecko_id text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS market_cap_rank integer;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS auditors jsonb;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS audit_report_urls jsonb;""")
    exit(1)

print("✅ Columns exist. Pushing Phase B data...\n")

# Load merged enrichment
with open('data/merged_enrichment.json') as f:
    merged = json.load(f)

# Phase B fields (new columns only)
phase_b_fields = [
    'twitter', 'discord', 'telegram', 'legal_email',
    'whitepaper_url', 'bounty_policy_url', 'developer_docs_url',
    'status_page_url', 'reddit_url', 'blog_url',
    'coingecko_id', 'market_cap_rank', 'auditors', 'audit_report_urls',
]

updated = 0
skipped = 0
errors = 0
total = len(merged)

for i, (slug, data) in enumerate(sorted(merged.items())):
    payload = {}
    for field in phase_b_fields:
        val = data.get(field)
        if val is not None:
            payload[field] = val
    
    if not payload:
        skipped += 1
        continue
    
    code = patch(slug, payload)
    if code in ('200', '204'):
        updated += 1
    else:
        errors += 1
        if errors <= 3:
            print(f"  ❌ {slug}: HTTP {code}")
    
    if (i + 1) % 100 == 0:
        print(f"  [{i+1}/{total}] updated={updated} skipped={skipped} errors={errors}")
        time.sleep(0.5)

print(f"\n{'=' * 60}")
print(f"Phase B done: updated={updated}, skipped={skipped}, errors={errors}")

# Verify
r = subprocess.run([
    'curl', '-s', f'{SB}/rest/v1/protocols?select=slug,twitter,discord,telegram,docs_url,auditors,bounty_policy_url,coingecko_id,website_url,security_email,contact_email,github_url',
    '-H', f'apikey: {KEY}', '-H', f'Authorization: Bearer {KEY}'
], capture_output=True, text=True, timeout=30)

data = json.loads(r.stdout)
print(f"\n{'=' * 60}")
print("FINAL STATE — SUPABASE PROTOCOLS")
print(f"{'=' * 60}")
print(f"Total: {len(data)}")
for f in ['security_email','contact_email','twitter','discord','telegram',
          'docs_url','github_url','website_url','auditors','bounty_policy_url','coingecko_id']:
    c = sum(1 for d in data if d.get(f))
    pct = 100 * c // len(data)
    bar = '█' * (pct // 5) + '░' * (20 - pct // 5)
    print(f"  {f:25s} {c:4d}/{len(data)} ({pct:2d}%) {bar}")

reachable = sum(1 for d in data if d.get('security_email') or d.get('contact_email') or d.get('twitter'))
pct = 100 * reachable // len(data)
print(f"\n  🦞 REACHABLE (email or twitter): {reachable}/{len(data)} ({pct}%)")
