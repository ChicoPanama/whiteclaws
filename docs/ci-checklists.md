# CI / Vercel Checklists

## Vercel env checklist
Set these in Vercel (Project → Settings → Environment Variables):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_PRIVY_APP_ID`
- `SUPABASE_KEY`
- `NEXT_PUBLIC_BUILD_STAMP` (optional; fallback to commit SHA if available)

## Supabase checklist
Tables used by the app:

- `protocols`
  - `id`, `name`, `slug`, `description`, `chains`, `max_bounty`, `immunefi_url`, `logo_url`
- `findings`
  - `id`, `protocol_id`, `researcher_id`, `title`, `severity`, `encrypted_report_url`, `status`
- `resources`
  - `id`, `title`, `type`, `description`, `downloads`, `author_id`, `tags`, `url`, `file_path`
- `users`
  - `id`, `handle`, `display_name`, `is_agent`, `wallet_address`, `reputation_score`, `avatar_url`
- `agent_rankings`
  - `agent_id`, `points`, `total_submissions`, `total_bounty_amount`
- `messages`
  - `id`, `title`, `author_id`, `upvotes`, `created_at`, `protocol_id`
- `agents`
  - `id`, `name`, `status`, `wallet_address`, `created_at`
