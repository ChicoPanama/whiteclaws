'use client'

import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'
import SignInBlock from '@/components/start/SignInBlock'

export default function StartResearcher() {
  return (
    <>
      <Nav />
      <div className="st-page">
        <div className="st-wrap">

          {/* ── Left: everything a researcher needs to know ── */}
          <div className="st-context">
            <div className="st-ey">
              <span className="dot" /> for security researchers
            </div>
            <h1 className="st-title">
              Find vulnerabilities.<br />
              <span className="st-accent">Get paid directly.</span>
            </h1>
            <p className="st-desc">
              WhiteClaws is a decentralized bug bounty marketplace. 457 protocols
              listed with contract addresses, scope definitions, docs, and security
              contacts. You submit findings. Protocols pay you. No middleman triaging
              or routing your work.
            </p>

            {/* ─── The journey ─── */}
            <div className="st-journey">
              <h2 className="st-journey-title">What happens after you sign in</h2>

              <div className="st-step">
                <span className="st-step-num">1</span>
                <div>
                  <strong>Your account is created immediately</strong>
                  <p>
                    Sign in with your wallet (MetaMask, Coinbase Wallet, or any EVM wallet),
                    X/Twitter, GitHub, or email. If you use a wallet, it becomes your identity
                    and payout address. If you use email or social, you can link a wallet later
                    in Settings.
                  </p>
                  <details className="st-details">
                    <summary>I don&apos;t have a crypto wallet</summary>
                    <p>
                      Click &ldquo;Connect Wallet&rdquo; on the right — our provider
                      (Coinbase OnchainKit) lets you create one in about 30 seconds. A wallet is
                      just a digital address where you receive payouts. You don&apos;t need to
                      buy any crypto to start.
                    </p>
                  </details>
                </div>
              </div>

              <div className="st-step">
                <span className="st-step-num">2</span>
                <div>
                  <strong>Mint your Access Badge (Soulbound NFT on Base)</strong>
                  <p>
                    After sign-in, you&apos;ll mint a non-transferable token on Base chain.
                    This is your permanent researcher ID — it can&apos;t be sold, traded, or
                    faked. Early minters before Season 1 opens are flagged as early supporters.
                  </p>
                  <details className="st-details">
                    <summary>What is a Soulbound NFT?</summary>
                    <p>
                      A regular NFT can be bought and sold on marketplaces. A &ldquo;soulbound&rdquo;
                      NFT is locked to your wallet permanently — it&apos;s a membership badge, not
                      a speculative asset. WhiteClaws uses it to ensure each researcher is counted
                      once, protecting the airdrop from bot farms.
                    </p>
                  </details>
                  <details className="st-details">
                    <summary>What is Base chain?</summary>
                    <p>
                      Base is a Layer 2 network built on Ethereum by Coinbase. Transactions are
                      fast and gas is fractions of a cent. Your wallet works on Base automatically.
                    </p>
                  </details>
                </div>
              </div>

              <div className="st-step">
                <span className="st-step-num">3</span>
                <div>
                  <strong>Verify your X/Twitter (optional, recommended)</strong>
                  <p>
                    Quick OAuth flow + a verification tweet linking your X handle to your wallet.
                    Creates a permanent 1-to-1 binding: one X account per wallet, one wallet per
                    X account.
                  </p>
                  <details className="st-details">
                    <summary>Why do you need my X account?</summary>
                    <p>
                      Two reasons — neither is engagement farming. First, <em>Sybil resistance</em>:
                      requiring a real X account (minimum age + followers) blocks bot armies. Second,
                      <em> social proof</em>: when you share an accepted finding, your referral link
                      is included — growing the platform through real security wins. We never ask you
                      to like, retweet, follow, or shill anything.
                    </p>
                  </details>
                </div>
              </div>

              <div className="st-step">
                <span className="st-step-num">4</span>
                <div>
                  <strong>Browse bounties and start hunting</strong>
                  <p>
                    The <code>/bounties</code> page lists all 457 programs. Each shows: protocol
                    name, category, chains, max bounty, and whether a PoC is required. Click into
                    any program for the full scope — in-scope contracts with addresses and chains,
                    severity definitions with payout ranges, exclusions, documentation links, and
                    the protocol&apos;s encryption public key for secure report submission.
                  </p>
                  <p>
                    Filter by chain, bounty range, category, or whether contracts are published.
                  </p>
                </div>
              </div>

              <div className="st-step">
                <span className="st-step-num">5</span>
                <div>
                  <strong>Submit a finding</strong>
                  <p>
                    Submit with: title, severity (critical / high / medium / low), description,
                    and optionally a proof-of-concept URL. You can encrypt your report with the
                    protocol&apos;s NaCl public key — only they can read it. Encrypted
                    submissions earn bonus $WC points.
                  </p>
                  <p>
                    After submission, the protocol is notified via email directly. If no direct
                    contact exists, WhiteClaws routes to Immunefi as fallback. Track your
                    finding in real time: submitted → triaged → accepted/rejected → paid.
                  </p>
                  <p>
                    Quality matters: repeated low-quality or spam submissions result in point
                    deductions. Rejected findings carry a penalty. Duplicates are detected.
                    There&apos;s a cooldown period between submissions to the same protocol
                    (default 24h).
                  </p>
                </div>
              </div>
            </div>

            {/* ─── Payments ─── */}
            <div className="st-journey">
              <h2 className="st-journey-title">How you get paid</h2>

              <div className="st-step">
                <span className="st-step-num">💰</span>
                <div>
                  <strong>Bounty payouts — USDC, ETH, or native tokens</strong>
                  <p>
                    When a protocol accepts your finding, they pay you directly on Base. The
                    default currency is USDC, but protocols can pay in ETH or their native
                    token — it&apos;s set per program. Payout ranges are defined by severity:
                    critical findings on major protocols can pay up to $10M. The transaction
                    hash is recorded on WhiteClaws so everything is verifiable onchain.
                  </p>
                  <p>
                    Your payout wallet can be different from your sign-in wallet — configure
                    it in <code>/app/settings</code>.
                  </p>
                </div>
              </div>

              <div className="st-step">
                <span className="st-step-num">🦞</span>
                <div>
                  <strong>$WC token airdrop (seasonal)</strong>
                  <p>
                    Every meaningful action earns points. Points convert to $WC tokens at season
                    end. Your allocation = your share of total points across all participants.
                  </p>
                  <p>Points are weighted by impact — security findings dominate:</p>
                  <div className="st-tier-list">
                    <div className="st-tier-item">
                      <span className="st-tier-dot st-tier-1" />
                      <div>
                        <strong>Security (highest)</strong> — Accepted findings, paid bounties,
                        critical severity bonus, PoC bonus, encrypted report bonus
                      </div>
                    </div>
                    <div className="st-tier-item">
                      <span className="st-tier-dot st-tier-2" />
                      <div>
                        <strong>Growth (medium)</strong> — Onboarding protocols, creating bounty programs
                      </div>
                    </div>
                    <div className="st-tier-item">
                      <span className="st-tier-dot st-tier-3" />
                      <div>
                        <strong>Engagement (low)</strong> — Weekly submissions, consecutive streaks
                      </div>
                    </div>
                    <div className="st-tier-item">
                      <span className="st-tier-dot st-tier-4" />
                      <div>
                        <strong>Social (minimal)</strong> — X verification, sharing accepted findings.
                        Zero points for empty tweets or follows.
                      </div>
                    </div>
                  </div>
                  <p>
                    Weekly cap per wallet prevents domination. Inactive accounts lose points over
                    time (decay). Claim is via Merkle proof with partial vesting.
                  </p>
                </div>
              </div>
            </div>

            {/* ─── Referrals ─── */}
            <div className="st-journey">
              <h2 className="st-journey-title">Referral program</h2>
              <div className="st-step">
                <span className="st-step-num">🔗</span>
                <div>
                  <strong>Earn when your referrals do real work</strong>
                  <p>
                    You get a unique referral code (<code>wc-xxxxx</code>) tied to your wallet.
                    When someone signs up via your code, the referral is tracked but earns
                    nothing — until they complete a qualifying action (submit a finding, register
                    a protocol, or fund escrow). Then you earn a percentage of their security +
                    growth points. Single level only. Same-wallet detection and circular referral
                    blocking are enforced.
                  </p>
                </div>
              </div>
            </div>

            {/* ─── Dashboard ─── */}
            <div className="st-fine">
              <p><strong>Your researcher dashboard includes:</strong></p>
              <p>
                Points breakdown by tier (security / growth / engagement / social) · Season rank
                and estimated $WC allocation · Full submission history with live status tracking ·
                Referral code, qualified count, and bonus earned · Active streak and next
                milestone · X verification status · SBT badge status · Payout wallet settings
              </p>
            </div>

            <div className="st-facts">
              <div className="st-fact">
                <span className="st-fact-val">457</span>
                <span className="st-fact-label">Bounty programs</span>
              </div>
              <div className="st-fact">
                <span className="st-fact-val">USDC / ETH</span>
                <span className="st-fact-label">Payout currencies</span>
              </div>
              <div className="st-fact">
                <span className="st-fact-val">Base</span>
                <span className="st-fact-label">Primary chain</span>
              </div>
            </div>
          </div>

          {/* ── Right: sign-in form ── */}
          <div className="st-signin">
            <div className="st-signin-card">
              <h2 className="st-signin-title">Create your account</h2>
              <p className="st-signin-sub">
                No applications. No waiting list. Sign in and you&apos;re live.
              </p>
              <SignInBlock persona="researcher" callbackUrl="/app/access" />
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}
