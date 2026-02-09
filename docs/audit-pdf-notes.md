# Audit PDF size notes

The largest PDFs currently stored in `public/audits/` (measured locally via
`du -h public/audits/* | sort -hr | head -n 10`) are:

- `sdnlist.pdf` (~16 MB)
- `pinto.pdf` (~5.4 MB)
- `003_CC_Protocol.pdf` (~2.7 MB)
- `Clarity Alliance - Zest Protocol v2 Upgrade.pdf` (~2.5 MB)

If any audit reports grow beyond acceptable repo size limits, migrate those files to
Supabase Storage (public bucket) and update or add a `meta.json` entry so the
indexer can point to the hosted URL instead of the local file.
