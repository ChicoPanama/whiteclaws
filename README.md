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

## Getting Started

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment variables
Create a `.env.local` file in the project root with the following values:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_PRIVY_APP_ID=
NEXT_PUBLIC_PROTOCOL_WALLET=
PRIVY_APP_ID=
PRIVY_APP_SECRET=
```

### 3) Set up Supabase
- Apply migrations in `supabase/migrations/`.
- (Optional) Seed data with `supabase/seed.sql`.

### 4) Run the app
```bash
npm run dev
```

## Scripts
- `npm run immunefi:sync` — pulls and normalizes bounty data via the Immunefi sync script.

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

## Notes
- The UI checks for Supabase environment variables before rendering data-driven pages.
- Server-side Privy auth uses `PRIVY_APP_ID` and `PRIVY_APP_SECRET`.
