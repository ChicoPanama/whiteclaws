# WhiteClaws Gap Analysis Matrix (Vision vs Reality)

Legend: `Y` = implemented, `P` = partial, `N` = missing.

| Promised Capability | Status | Where It Exists | Missing / Gap | Evidence |
|---|---|---|---|---|
| Three-sided marketplace (agents, protocols, humans) | P | APIs + many UI routes exist | Several surfaces still demo/localStorage-driven and not fully connected to secure identity model | `README.md`, `app/app/protocol/dashboard/page.tsx:25`, `app/app/agents/page.tsx:11` |
| 459 bounty programs live | P | Static JSON protocol corpus + bounties UI | Supabase-driven dynamic lifecycle only for subset; mixed static vs DB surfaces | `public/protocols/*`, `lib/data/bounties.ts:30`, `app/bounties/page.tsx:9` |
| End-to-end encrypted submissions | P | NaCl helpers + encrypted payload fields + submit route | Inconsistent submission paths (`/api/findings` vs `/api/agents/submit`), browser-managed encryption keys, report storage path split | `lib/crypto.ts:1`, `app/api/agents/submit/route.ts:118`, `app/api/findings/route.ts:11`, `app/submit/page.tsx:154` |
| Protocol dashboard for triage/payout/scope | P | `/app/protocol/*` pages + protocol APIs | Uses localStorage API keys, weak role UX, no server session for protocol operators | `app/app/protocol/findings/page.tsx:33`, `app/app/protocol/settings/page.tsx:19`, `app/api/protocols/[slug]/findings/route.ts:7` |
| Agent leaderboard and rankings | Y/P | `/leaderboard`, `/api/points/leaderboard`, `agent_rankings` | Mixed scoring models (legacy rankings + contribution_scores); no unified canonical metric docs in UI | `app/leaderboard/page.tsx:3`, `app/api/points/leaderboard/route.ts:12`, `lib/supabase/database.types.ts:368` |
| Wall of Heroes | Y | Hero components + data | Mostly static data pipeline, limited direct tie-in to live contribution system | `app/heroes/page.tsx:3`, `public/data/immunefi-heroes.json` |
| OpenClaw compatibility (skill/heartbeat/rules) | Y | `skill.md`, `heartbeat.md`, `rules.md` routes and public files | Operational orchestration around these files not visible in app UI | `app/skill.md/route.ts`, `app/heartbeat.md/route.ts`, `app/rules.md/route.ts` |
| API auth methods: API key + wallet signature + SIWE | P | API key + wallet sig + SIWE utilities present | Most routes only accept API keys; SIWE/session usage uneven | `lib/auth/api-key.ts:1`, `lib/auth/wallet-signature.ts:1`, `lib/auth/siwe.ts:1`, `app/api/agents/submit/route.ts:18` |
| Rate limiting and abuse controls | P | Submission quality/spam logic exists | No central request limiter across API key traffic; README overstates enforcement | `lib/services/points-engine.ts:272`, `README.md` rate limiting section |
| Protocol lifecycle (register -> program -> scope -> findings -> pay) | P | Endpoints exist | Not fully exposed cleanly in public UX and onboarding; auth model is API-key heavy | `app/api/protocols/register/route.ts:14`, `app/api/protocols/[slug]/program/route.ts:37`, `app/api/findings/[id]/pay/route.ts:9` |
| Token-gated access | P | Access APIs + access SBT table | Mint/check flow is DB-first and currently bypassable; no onchain proof enforcement | `app/api/access/mint/route.ts:8`, `lib/web3/config.ts:15`, `lib/web3/contracts/access-sbt.ts:49` |
| $WC token integration | N | Config placeholders only | No token contract code, no ABI wiring, no deployed addresses | `lib/web3/config.ts:15`, `docs/CONTRACT_WIRING.md:1` |
| Airdrop claim system | P | Claim APIs + merkle helper + UI page | Contract absent; proof generation placeholders; claim action is stub UI | `app/claim/page.tsx:136`, `app/api/claims/proof/route.ts:6`, `lib/claims/merkle.ts:257` |
| Trustless wallet for agents | N/P | Placeholder agent wallet helper | No custody boundary, no signer policy, no MPC/smart-account integration | `lib/web3/wallet.ts:23`, `app/app/agents/page.tsx:20` |
| Coinbase Developer Platform integration | N | No implementation found | Missing wallets/paymaster/onramp/agent kit integrations and architecture | Repo-wide search: no CDP/coinbase references |
| X/Twitter verification for social scoring | P | OAuth + verification endpoints and tables | Verification does not validate tweet content proof yet | `app/api/x/auth/route.ts:7`, `lib/x/verification.ts:196` |
| Admin operations (weekly points, sybil review, retention) | P | Admin API routes exist | No admin UI surfaces and likely no operational runbook in product UI | `app/api/admin/points/weekly/route.ts:10`, `app/api/admin/sybil/review/route.ts:6` |
| CLI support for agents | P | `cli/` package exists | Not integrated into web onboarding flow; docs exist but no runtime checks | `cli/bin/whiteclaws.mjs`, `cli/README.md` |

## Promises Not Fully Realized (from README/docs)
- “Vaults & Escrow” -> missing runtime code and contract integration.
- “Onchain monitoring” -> no monitoring service in app runtime.
- “$WC token participation rewards” -> points exist, token contract and claim settlement are incomplete.
- “Wallet connect as primary login” -> login still shows wallet as coming soon.

## Additional Disconnected Items
- `components/dashboard/XShareButton.tsx` calls non-existent endpoint `/api/points/record-share` and is not mounted.
- `components/PrivyProvider.tsx` is deprecated and unused.
- `/bounties/[slug]` detail exists but main `BountyGrid` links to `/protocols/[id]`, splitting product narrative and leaving `/bounties/[slug]` underutilized.

