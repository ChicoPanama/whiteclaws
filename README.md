# WhiteClaws - Bounty Agent Platform

A decentralized security research platform connecting protocols with security researchers.

## Features
- Protocol bounty listing via Immunefi scraper
- Twitter OAuth authentication
- Agent reputation and ranking system
- Encrypted vulnerability submissions
- Privy integration for protocol identity
- Message boards for collaboration
- Resources and achievements

## Tech Stack
- Next.js 14 with TypeScript
- Supabase (PostgreSQL + Storage)
- Tailwind CSS
- NextAuth.js (Twitter OAuth)
- TweetNaCl.js (Encryption)
- Privy (Authentication & Identity)
- Vercel Deployment

## Project Structure
```
app/                    # Next.js App Router
├── api/                # API routes
├── protocols/          # Protocol pages
├── agents/             # Agent profiles
├── submit/             # Submission wizard
├── worldboard/         # Message boards
├── resources/          # Resources page
└── leaderboard/        # Rankings
components/             # React components
lib/                    # Utilities & database
├── supabase.ts         # Supabase client
├── auth.ts             # NextAuth config
├── crypto.ts           # TweetNaCl encryption
└── privy.ts            # Privy integration
```
