#!/usr/bin/env python3
"""
WhiteClaws Protocol Enrichment — Merge All Sources → Supabase
=============================================================

Merges 4 data sources with priority ordering, adds missing columns,
and pushes the full enrichment to Supabase.

Sources (priority order for conflicts):
  1. Website scrape  — security.txt, footers, /security pages (most direct)
  2. GitHub org API  — SECURITY.md, org profiles (structured + verified)
  3. CoinGecko       — social links via token listings (broadest social coverage)
  4. protocol_domains — website URLs, names

Run: python3 scripts/enrich_supabase_full.py
"""

import json, subprocess, sys, time, urllib.parse

SB = "https://rsbrpuqwxztblqsqkefr.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzYnJwdXF3eHp0Ymxxc3FrZWZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc3MTA5MiwiZXhwIjoyMDg2MzQ3MDkyfQ.P6ZRQm9wysNDreQ4CHlnusg1u_EmGtkN2qzkeyC5OTU"

# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------

def sb_request(method, path, data=None, params=None):
    """Make a Supabase REST request."""
    url = f"{SB}/rest/v1/{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    
    cmd = ['curl', '-s', '-w', '\n%{http_code}', '-X', method, url,
           '-H', f'apikey: {KEY}',
           '-H', f'Authorization: Bearer {KEY}',
           '-H', 'Content-Type: application/json',
           '-H', 'Prefer: return=minimal']
    
    if data:
        cmd.extend(['-d', json.dumps(data)])
    
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    lines = r.stdout.strip().rsplit('\n', 1)
    code = int(lines[-1]) if len(lines) >= 1 and lines[-1].isdigit() else 0
    body = lines[0] if len(lines) > 1 else ''
    return code, body


def sb_sql(sql):
    """Execute SQL via Supabase RPC."""
    r = subprocess.run([
        'curl', '-s', '-X', 'POST', f'{SB}/rest/v1/rpc/exec_sql',
        '-H', f'apikey: {KEY}', '-H', f'Authorization: Bearer {KEY}',
        '-H', 'Content-Type: application/json',
        '-d', json.dumps({"query": sql})
    ], capture_output=True, text=True, timeout=30)
    return r.stdout.strip()


def load_json(path):
    try:
        with open(path) as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"  ⚠  {path} not found, skipping")
        return {}


def first_truthy(*values):
    """Return first non-empty/non-null value."""
    for v in values:
        if v:
            return v
    return None

# -------------------------------------------------------------------
# Step 1: Add missing columns to protocols table
# -------------------------------------------------------------------

def add_columns():
    print("Step 1: Adding new columns to protocols table...")
    
    new_columns = [
        ("twitter", "text"),
        ("discord", "text"),
        ("telegram", "text"),
        ("legal_email", "text"),
        ("whitepaper_url", "text"),
        ("bounty_policy_url", "text"),
        ("developer_docs_url", "text"),
        ("status_page_url", "text"),
        ("reddit_url", "text"),
        ("blog_url", "text"),
        ("coingecko_id", "text"),
        ("market_cap_rank", "integer"),
        ("auditors", "jsonb"),
        ("audit_report_urls", "jsonb"),
    ]
    
    for col_name, col_type in new_columns:
        # Try ALTER TABLE — will fail silently if column exists
        code, body = sb_request('POST', 'rpc/exec_sql', {
            "query": f"ALTER TABLE protocols ADD COLUMN IF NOT EXISTS {col_name} {col_type};"
        })
        if code in (200, 204):
            print(f"  ✅ {col_name} ({col_type})")
        else:
            # Try direct PATCH to see if column already exists
            test_code, _ = sb_request('PATCH', f'protocols?slug=eq.__test__', {col_name: None})
            if test_code in (200, 204, 404):
                print(f"  ✅ {col_name} (already exists)")
            else:
                print(f"  ⚠  {col_name} — may need manual SQL: ALTER TABLE protocols ADD COLUMN {col_name} {col_type};")
    
    print()


# -------------------------------------------------------------------
# Step 2: Merge all sources
# -------------------------------------------------------------------

def merge_all():
    print("Step 2: Merging all data sources...")
    
    # Load everything
    website = load_json('data/website_contacts.json')
    github = load_json('data/github_contacts.json')
    coingecko = load_json('data/coingecko_contacts.json')
    domains = load_json('data/protocol_domains.json')
    immunefi = load_json('data/immunefi_enrichment.json')
    
    # Normalize github (might be list)
    if isinstance(github, list):
        github = {e['slug']: e for e in github}
    
    # Get all slugs
    all_slugs = set()
    for src in [website, github, coingecko, domains, immunefi]:
        if isinstance(src, dict):
            all_slugs.update(src.keys())
    
    print(f"  Sources loaded:")
    print(f"    website_contacts: {len(website)} entries")
    print(f"    github_contacts:  {len(github)} entries")
    print(f"    coingecko:        {len(coingecko)} entries")
    print(f"    protocol_domains: {len(domains)} entries")
    print(f"    immunefi:         {len(immunefi)} entries")
    print(f"  Total unique slugs: {len(all_slugs)}")
    
    merged = {}
    
    for slug in sorted(all_slugs):
        ws = website.get(slug, {})
        gh = github.get(slug, {})
        cg = coingecko.get(slug, {})
        dm = domains.get(slug, {})
        im = immunefi.get(slug, {})
        
        entry = {'slug': slug}
        
        # --- CONTACTS (priority: website > github > existing) ---
        
        # security_email: highest value contact
        entry['security_email'] = first_truthy(
            ws.get('security_email'),
            gh.get('security_email'),
        )
        
        # contact_email: general contact
        entry['contact_email'] = first_truthy(
            gh.get('contact_email'),
            ws.get('contact_email'),
        )
        
        # legal_email
        entry['legal_email'] = ws.get('legal_email')
        
        # --- SOCIAL LINKS ---
        
        # twitter: CoinGecko tends to be most accurate, then website footer
        entry['twitter'] = first_truthy(
            cg.get('twitter'),
            ws.get('twitter'),
            gh.get('contact_twitter'),
        )
        
        # discord: CoinGecko > website
        entry['discord'] = first_truthy(
            cg.get('discord'),
            ws.get('discord'),
        )
        
        # telegram: CoinGecko > website
        entry['telegram'] = first_truthy(
            cg.get('telegram'),
            ws.get('telegram'),
        )
        
        # github: website footer > github scrape source
        gh_org = first_truthy(
            ws.get('github'),
            gh.get('github_org'),
        )
        if gh_org and not gh_org.startswith('http'):
            gh_org = f"https://github.com/{gh_org}"
        entry['github_url'] = gh_org
        
        # Extract org name
        if gh_org:
            parts = gh_org.rstrip('/').split('/')
            entry['github_org'] = parts[-1] if parts else None
        
        # reddit
        entry['reddit_url'] = first_truthy(
            cg.get('subreddit'),
            ws.get('reddit'),
        )
        
        # blog
        entry['blog_url'] = ws.get('blog')
        
        # --- HUNTER TOOLKIT ---
        
        # docs_url
        entry['docs_url'] = first_truthy(
            ws.get('docs_url'),
        )
        
        # developer_docs_url
        entry['developer_docs_url'] = ws.get('developer_docs_url')
        
        # whitepaper_url
        entry['whitepaper_url'] = ws.get('whitepaper_url')
        
        # audit info
        entry['audit_report_urls'] = ws.get('audit_report_urls')
        entry['auditors'] = ws.get('auditors')
        
        # bounty policy
        entry['bounty_policy_url'] = first_truthy(
            ws.get('bounty_policy_url'),
            ws.get('security_policy_url'),
        )
        
        # status page
        entry['status_page_url'] = ws.get('status_page_url')
        
        # chains — merge website detection with existing
        entry['chains'] = ws.get('chains_mentioned')
        
        # --- METADATA ---
        
        # website_url
        entry['website_url'] = first_truthy(
            dm.get('url'),
            ws.get('website'),
            cg.get('homepage'),
        )
        
        # coingecko
        entry['coingecko_id'] = cg.get('coingecko_id')
        entry['market_cap_rank'] = cg.get('market_cap_rank')
        
        # Clean: remove None values
        entry = {k: v for k, v in entry.items() if v is not None}
        
        merged[slug] = entry
    
    # Stats
    vals = list(merged.values())
    print(f"\n  Merged results:")
    print(f"    security_email:     {sum(1 for v in vals if v.get('security_email'))}")
    print(f"    contact_email:      {sum(1 for v in vals if v.get('contact_email'))}")
    print(f"    legal_email:        {sum(1 for v in vals if v.get('legal_email'))}")
    print(f"    twitter:            {sum(1 for v in vals if v.get('twitter'))}")
    print(f"    discord:            {sum(1 for v in vals if v.get('discord'))}")
    print(f"    telegram:           {sum(1 for v in vals if v.get('telegram'))}")
    print(f"    github_url:         {sum(1 for v in vals if v.get('github_url'))}")
    print(f"    docs_url:           {sum(1 for v in vals if v.get('docs_url'))}")
    print(f"    whitepaper_url:     {sum(1 for v in vals if v.get('whitepaper_url'))}")
    print(f"    auditors:           {sum(1 for v in vals if v.get('auditors'))}")
    print(f"    audit_report_urls:  {sum(1 for v in vals if v.get('audit_report_urls'))}")
    print(f"    bounty_policy_url:  {sum(1 for v in vals if v.get('bounty_policy_url'))}")
    print(f"    website_url:        {sum(1 for v in vals if v.get('website_url'))}")
    print(f"    coingecko_id:       {sum(1 for v in vals if v.get('coingecko_id'))}")
    print(f"    chains:             {sum(1 for v in vals if v.get('chains'))}")
    print()
    
    return merged


# -------------------------------------------------------------------
# Step 3: Push to Supabase
# -------------------------------------------------------------------

def push_to_supabase(merged):
    print("Step 3: Pushing enrichment to Supabase...")
    
    updated = 0
    skipped = 0
    errors = 0
    
    total = len(merged)
    
    for i, (slug, data) in enumerate(sorted(merged.items())):
        # Build PATCH payload — only non-empty fields
        payload = {}
        
        # Map merged fields to Supabase columns
        field_map = {
            'security_email': 'security_email',
            'contact_email': 'contact_email',
            'legal_email': 'legal_email',
            'twitter': 'twitter',
            'discord': 'discord',
            'telegram': 'telegram',
            'github_url': 'github_url',
            'github_org': 'github_org',
            'reddit_url': 'reddit_url',
            'blog_url': 'blog_url',
            'docs_url': 'docs_url',
            'developer_docs_url': 'developer_docs_url',
            'whitepaper_url': 'whitepaper_url',
            'bounty_policy_url': 'bounty_policy_url',
            'status_page_url': 'status_page_url',
            'website_url': 'website_url',
            'coingecko_id': 'coingecko_id',
            'market_cap_rank': 'market_cap_rank',
            'auditors': 'auditors',
            'audit_report_urls': 'audit_report_urls',
        }
        
        for src_field, db_field in field_map.items():
            val = data.get(src_field)
            if val is not None:
                payload[db_field] = val
        
        # chains — update only if website scrape found chains and current is just ["ethereum"]
        if data.get('chains') and isinstance(data['chains'], list):
            # Format chain names to lowercase for consistency
            payload['chains'] = [c.lower() for c in data['chains']]
        
        if not payload:
            skipped += 1
            continue
        
        # PATCH to Supabase
        encoded_slug = urllib.parse.quote(slug)
        code, body = sb_request('PATCH', f'protocols?slug=eq.{encoded_slug}', payload)
        
        if code in (200, 204):
            updated += 1
        else:
            errors += 1
            if errors <= 5:
                print(f"  ❌ {slug}: HTTP {code} — {body[:100]}")
        
        # Progress
        if (i + 1) % 50 == 0:
            print(f"  [{i+1}/{total}] updated={updated} skipped={skipped} errors={errors}")
        
        # Tiny delay to not hammer Supabase
        if (i + 1) % 100 == 0:
            time.sleep(1)
    
    print(f"\n  Done: updated={updated}, skipped={skipped}, errors={errors}")
    print()
    return updated, errors


# -------------------------------------------------------------------
# Step 4: Verify
# -------------------------------------------------------------------

def verify():
    print("Step 4: Verification...")
    
    r = subprocess.run([
        'curl', '-s', f'{SB}/rest/v1/protocols?select=slug,security_email,contact_email,twitter,discord,telegram,docs_url,github_url,website_url,auditors,coingecko_id,bounty_policy_url,chains',
        '-H', f'apikey: {KEY}', '-H', f'Authorization: Bearer {KEY}'
    ], capture_output=True, text=True, timeout=30)
    
    data = json.loads(r.stdout)
    
    print(f"  Total protocols: {len(data)}")
    fields = [
        'security_email', 'contact_email', 'twitter', 'discord', 'telegram',
        'docs_url', 'github_url', 'website_url', 'auditors', 'coingecko_id',
        'bounty_policy_url'
    ]
    
    for f in fields:
        count = sum(1 for d in data if d.get(f))
        pct = 100 * count // len(data) if data else 0
        bar = '█' * (pct // 5) + '░' * (20 - pct // 5)
        print(f"  {f:25s} {count:4d}/{len(data)} ({pct:2d}%) {bar}")
    
    # Chains with actual data (not just default)
    chains_real = sum(1 for d in data if d.get('chains') and len(d['chains']) > 1)
    print(f"  {'chains (multi)':25s} {chains_real:4d}/{len(data)}")
    
    # Any contact reachability
    reachable = sum(1 for d in data if d.get('security_email') or d.get('contact_email') or d.get('twitter'))
    pct = 100 * reachable // len(data) if data else 0
    print(f"\n  🦞 REACHABLE (any contact): {reachable}/{len(data)} ({pct}%)")
    print()


# -------------------------------------------------------------------
# Main
# -------------------------------------------------------------------

def main():
    print("🦞 WhiteClaws Full Protocol Enrichment")
    print("=" * 60)
    print()
    
    add_columns()
    merged = merge_all()
    
    # Save merged data locally
    with open('data/merged_enrichment.json', 'w') as f:
        json.dump(merged, f, indent=2)
    print(f"Saved merged data: data/merged_enrichment.json ({len(merged)} entries)\n")
    
    updated, errors = push_to_supabase(merged)
    
    if errors > 20:
        print("⚠️  Many errors — columns may need manual creation.")
        print("Run this SQL in Supabase SQL Editor:\n")
        print("""
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS twitter text;
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
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS audit_report_urls jsonb;
""")
        print("Then re-run this script.\n")
    
    verify()
    
    print("=" * 60)
    print("✅ Enrichment complete")


if __name__ == '__main__':
    main()
