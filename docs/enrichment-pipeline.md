# WhiteClaws Enrichment Pipeline

## Run order

```bash
npx tsx scripts/extract_whiteclaws_protocol_index.ts
npx tsx scripts/build_protocol_domains.ts
npx tsx scripts/enrich_protocol_contacts.ts
npx tsx scripts/enrich_protocol_contracts.ts
npx tsx scripts/validate_enrichment.ts
```

Or all at once: `pnpm enrich:all`

### Contract enrichment scripts (run separately)

```bash
# 1. Parse Immunefi explorer URLs into protocol JSONs (safe to run, no API keys needed)
node scripts/enrich-contracts-from-immunefi.cjs

# 2. Discover deployer contracts via Etherscan APIs (requires API keys)
#    Set: ETHERSCAN_API_KEY, ARBISCAN_API_KEY, OPTIMISTIC_API_KEY, etc.
node scripts/discover-deployer-contracts.cjs

# 3. Merge deployer-discovered contracts into protocol JSONs (requires step 2 output)
node scripts/merge-all-contracts.cjs
```

## Domain Resolution Strategy

1. **DefiLlama exact slug** — highest confidence (0.95)
2. **DefiLlama exact name** — match by protocol name (0.9)
3. **DefiLlama prefix** — `aave` matches `aave-v3`, picks highest TVL (0.85)
4. **DefiLlama normalized** — fuzzy string match after stripping non-alphanumeric (0.8)
5. **Curated fallback** — manually verified in `data/curated_domains.json` (0.85)

CDN/asset hosts are blocked via `data/domain_denylist.json`.

## Contact Enrichment

Fetches `/.well-known/security.txt` and `/security.txt` for all resolved domains.
**Validates response content** — rejects HTML/SPA pages that return 200 for any path.
Only records security.txt URL when response contains valid RFC 9116 `Contact:` fields.

## Contract Scope

Extracts contract addresses from seeded `public/protocols/*.json` files.
All addresses verified on-chain via `eth_getCode` before inclusion.
Fabricated or non-contract addresses are removed and replaced with verified alternatives.

## Outputs

| File | Contents |
|------|----------|
| `data/protocol_domains.json` | Domain resolution for all protocols |
| `data/curated_domains.json` | Manually verified domain fallbacks |
| `data/domain_denylist.json` | Blocked CDN/asset hosts |
| `data/protocol_contacts.json` | Contact/disclosure data per protocol |
| `data/protocol_contacts_sources.json` | Per-field provenance for contacts |
| `data/protocol_contacts.csv` | CSV export of contacts |
| `data/protocol_contracts.json` | Verified contract addresses |
| `data/protocol_contracts_sources.json` | Per-address provenance |
| `data/protocol_contracts.csv` | CSV export of contracts (includes type) |
| `data/deployer_discovered_contracts.json` | Deployer-discovered contracts (Phase 2 output) |
| `reports/enrichment-report.md` | Validation summary + CI gate |

## Optional env vars

- `CONTACT_ENRICH_LIMIT` — max protocols to fetch security.txt for (default: all)
