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

          {/* ── Context panel (left on desktop, top on mobile) ── */}
          <div className="st-context">
            <div className="st-ey">
              <span className="dot" /> for security researchers
            </div>
            <h1 className="st-title">
              Find vulnerabilities.<br />
              <span className="st-accent">Earn bounties.</span>
            </h1>
            <p className="st-desc">
              WhiteClaws is a decentralized bug bounty marketplace with 457+ protocols.
              Submit verified vulnerability reports, earn USDC directly from protocol teams,
              and accumulate $WC tokens proportional to the security value you create.
            </p>

            {/* Journey steps — what happens after sign-in */}
            <div className="st-journey">
              <h2 className="st-journey-title">After you sign in</h2>

              <div className="st-step">
                <span className="st-step-num">1</span>
                <div>
                  <strong>Mint your Access Badge (Soulbound NFT)</strong>
                  <p>
                    You&apos;ll receive a non-transferable token on Base chain — your permanent
                    researcher ID. It can&apos;t be sold or faked, and it proves you&apos;re a
                    verified unique participant. This protects the reward system from bot farms.
                  </p>
                  <details className="st-details">
                    <summary>What is a Soulbound NFT?</summary>
                    <p>
                      A normal NFT can be bought and sold. A &ldquo;soulbound&rdquo; NFT is locked
                      to your wallet permanently — think of it as a non-transferable membership
                      badge. WhiteClaws uses it as proof of identity so that each researcher is
                      counted once.
                    </p>
                  </details>
                </div>
              </div>

              <div className="st-step">
                <span className="st-step-num">2</span>
                <div>
                  <strong>Verify your X/Twitter</strong>
                  <p>
                    Quick OAuth + a verification tweet linking your X handle to your wallet.
                    This is not engagement farming — we will never ask you to like or retweet
                    anything. It&apos;s purely a Sybil gate (blocks bot accounts) and enables
                    organic social proof when you share accepted findings.
                  </p>
                </div>
              </div>

              <div className="st-step">
                <span className="st-step-num">3</span>
                <div>
                  <strong>Browse bounties &amp; submit findings</strong>
                  <p>
                    457+ programs with scope, contract addresses, docs, and security contacts.
                    Submit encrypted reports — your findings are visible only to the protocol
                    team until they accept or decline.
                  </p>
                </div>
              </div>

              <div className="st-step">
                <span className="st-step-num">4</span>
                <div>
                  <strong>Earn on two tracks</strong>
                  <p>
                    <em>USDC bounties</em> — paid directly by protocols for accepted findings,
                    up to $10M for critical vulnerabilities.
                    <br />
                    <em>$WC tokens</em> — every accepted finding, streak week, and referral earns
                    points. Points convert to $WC at season end. Security findings carry the
                    highest weight — not tweets, not check-ins, not social follows.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick facts */}
            <div className="st-facts">
              <div className="st-fact">
                <span className="st-fact-val">457+</span>
                <span className="st-fact-label">Bounty programs</span>
              </div>
              <div className="st-fact">
                <span className="st-fact-val">$10M</span>
                <span className="st-fact-label">Max single bounty</span>
              </div>
              <div className="st-fact">
                <span className="st-fact-val">Base</span>
                <span className="st-fact-label">Primary chain</span>
              </div>
            </div>

            <div className="st-fine">
              <p>
                <strong>Your dashboard</strong> shows points breakdown, season rank, submission
                history, referral code &amp; stats, streak progress, and X verification status
                — all in one place.
              </p>
            </div>
          </div>

          {/* ── Sign-in panel (right on desktop, below on mobile) ── */}
          <div className="st-signin">
            <div className="st-signin-card">
              <h2 className="st-signin-title">Get started</h2>
              <p className="st-signin-sub">
                Connect your wallet or sign in with a social account.
                No applications. No waiting list.
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
