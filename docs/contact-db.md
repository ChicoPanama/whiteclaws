# Contact DB Pipeline

This repository uses a slug-keyed contact database (`Option B`) stored in `data/protocol_contacts.json`.

## Runbook

```bash
node scripts/extract_protocol_slugs.ts
node scripts/enrich_protocol_contacts.ts
node scripts/validate_protocol_contacts.ts
```

These scripts generate:

- `data/whiteclaws_protocol_index.json`
- `data/protocol_contacts.json`
- `data/protocol_contacts_sources.json`
- `data/protocol_contacts.csv`
- `reports/contact-db-report.md`

## Environment variables

- `CONTACT_DB_VALIDATE_REMOTE=1` — enables live URL validation in `validate_protocol_contacts.ts`.
- `SERPER_API_KEY` — optional, reserved for future domain search fallback.
- `BRAVE_API_KEY` — optional, reserved for future domain search fallback.

If `CONTACT_DB_VALIDATE_REMOTE` is not set, URL checks are skipped for deterministic/offline runs.

## Provenance model

- `data/protocol_contacts.json`: authoritative merged view per protocol slug.
- `data/protocol_contacts_sources.json`: per-field source mapping.
- Each filled disclosure field must include source URLs/file references.
- `disclosure.sources` contains the union of evidence URLs used for each protocol.
