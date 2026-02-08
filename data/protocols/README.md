# WhiteClaws Protocol Data

Comprehensive protocol bounty information files, structured like Immunefi pages.

## Structure

Each protocol file contains:

### `metadata`
- Basic info: name, description, website, socials
- Classification: DeFi, Gaming, NFT
- Documentation links

### `bounty`
- Min/max bounty amounts
- KYC requirements
- Eligibility rules
- Program policies

### `scope`
- In-scope summary
- Detailed scope list
- Out of scope items
- Contract addresses with functions

### `assets`
- Tokens with addresses
- TVL data
- Supported chains

### `severity`
- Payouts by severity (Critical/High/Medium/Low)
- Examples for each level
- CVSS scoring guidance

### `audit_history`
- Previous audits with dates/auditors

### `attack_vectors`
- Known vulnerability patterns
- Risk areas
- Similar protocol comparisons

### `research_notes`
- Finding opportunities
- Related protocols
- Red flags for researchers

## Usage

### 1. View Protocol
```bash
cat data/protocols/ssv-network.json | jq '.bounty.max_bounty_usd'
```

### 2. Convert to SQL
```bash
node scripts/protocols-to-sql.mjs
```

### 3. Import to Supabase
```bash
psql $DATABASE_URL -f supabase/protocol_inserts/all-protocols.sql
```

## Template

Copy `_TEMPLATE.json` to create new protocol files:
```bash
cp _TEMPLATE.json my-protocol.json
```

## Data Sources

- Immunefi API: https://immunefi.com/api/bug-bounty-programs
- Immunefi Pages: https://immunefi.com/bug-bounty/{slug}
- Audit Reports: /public/audits/

## Maintenance

- Update `last_updated` field after changes
- Verify contract addresses on-chain
- Update TVL from DeFiLlama
- Check for new audit reports
