# Contracts Database (Tier 1: Official Scope)

Scope Mode: **Official (Tier 1)**.

This pipeline builds WhiteClaws' protocol contract dataset from protocol JSON records and only keeps Tier 1 output active.

## Commands

```bash
node --experimental-strip-types scripts/extract_whiteclaws_protocol_index.ts
node --experimental-strip-types scripts/enrich_protocol_contracts.ts
node --experimental-strip-types scripts/validate_protocol_contracts.ts
```

## Outputs

- `data/whiteclaws_protocol_index.json`: protocol index and discovered source links.
- `data/protocol_contracts_sources.json`: provenance and selected source candidates.
- `data/protocol_contracts.json`: merged authoritative Tier 1 contract view.
- `data/protocol_contracts.csv`: flattened UI-friendly export.
- `reports/contracts-db-report.md`: validation and QA summary.

## Tier 1 Rules

- No guessed addresses.
- Tier 1 contracts are emitted from protocol-declared contract lists only.
- Missing official URL evidence sets `needs_review=true`.
- Tier is always `1` for populated contracts.

## Update Flow

1. Update protocol records under `public/protocols/*.json`.
2. Re-run the three scripts above.
3. Commit generated `data/*` and `reports/*` artifacts.
