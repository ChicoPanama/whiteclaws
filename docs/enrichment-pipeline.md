# WhiteClaws Enrichment Pipeline

## Run order

```bash
npx tsx scripts/extract_whiteclaws_protocol_index.ts
npx tsx scripts/build_protocol_domains.ts
npx tsx scripts/enrich_protocol_contacts.ts
npx tsx scripts/enrich_protocol_contracts.ts
npx tsx scripts/validate_enrichment.ts
```

## Outputs

- `data/domain_denylist.json`
- `data/whiteclaws_protocol_index.json`
- `data/protocol_domains.json`
- `data/protocol_contacts.json`
- `data/protocol_contacts_sources.json`
- `data/protocol_contacts.csv`
- `data/protocol_contracts.json`
- `data/protocol_contracts_sources.json`
- `data/protocol_contracts.csv`
- `reports/enrichment-report.md`

## Optional env vars

- `SERPER_API_KEY` for search fallback (not required in baseline run)
- `BRAVE_API_KEY` for search fallback (not required in baseline run)
