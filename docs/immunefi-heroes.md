# Immunefi Heroes Sync Pipeline

This dataset snapshots Immunefi's Hacker Pledging directory and profile pages into:

- `public/data/immunefi-heroes.json`
- `public/data/immunefi-heroes.schema.json`

## Run

```bash
node scripts/sync-immunefi-heroes.js
```

## What is extracted

### Directory (`/hacker-pledging/`)
For each pledged hacker card:

- `handle`
- `rank`
- `bugs_found`
- `total_earned_usd`
- `imu_pledged`
- `pledgers`
- `pledge_url`
- `profile_url`
- `pfp_url` (profile picture URL; profile-specific when available, default avatar fallback otherwise)

Top-level metadata:

- `pledged_hackers_count`
- `total_pledged_imu_raw`
- `total_pledged_imu`
- `active_pledgers`
- `extracted_at`

### Profiles (`/profile/<handle>/`)
For each handle:

- `member_since`
- `all_time_rank` (best-effort from visible rank text)
- `total_earnings_usd_profile`
- `bio_text`
- `bio_links`
- social/site links in `links`

### X/Twitter discovery
Order of precedence:

1. Explicit `@handle` in Immunefi bio => `x_confidence: "high"`
2. Explicit X/Twitter profile URL present in Immunefi profile HTML => `x_confidence: "high"`
3. Best-effort search match (`<handle> Immunefi X` / `site:x.com`) when handle alignment is clear => `x_confidence: "medium"`
4. Otherwise null + `x_confidence: "low"`

## Notes and limitations

- `total_saved_usd` is intentionally `null`.
- `impact_notes` states that "saved" impact is not reliably exposed by pledge/profile pages.
- The script is deterministic over current HTML, but can require selector/regex updates if Immunefi markup changes.
