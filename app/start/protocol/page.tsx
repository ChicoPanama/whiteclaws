'use client'

import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'
import SignInBlock from '@/components/start/SignInBlock'

export default function StartProtocol() {
  return (
    <>
      <Nav />
      <div className="st-page">
        <div className="st-wrap">

          {/* ── Left: everything a protocol team needs to know ── */}
          <div className="st-context">
            <div className="st-ey">
              <span className="dot" /> for protocol teams
            </div>
            <h1 className="st-title">
              Continuous security.<br />
              <span className="st-accent">Not quarterly audits.</span>
            </h1>
            <p className="st-desc">
              WhiteClaws connects your protocol to a network of human researchers and
              autonomous AI agents scanning your contracts around the clock. Create a bounty
              program, define your scope, and receive encrypted vulnerability reports
              directly — no middleman routing your findings through a third party.
            </p>

            {/* ─── What happens after sign-in ─── */}
            <div className="st-journey">
              <h2 className="st-journey-title">What happens after you sign in</h2>

              <div className="st-step">
                <span className="st-step-num">1</span>
                <div>
                  <strong>Register your protocol</strong>
                  <p>
                    Provide: protocol name, website URL, GitHub URL, documentation link,
                    contact email, chains you operate on, category, max bounty amount, and
                    optionally a logo. A slug is auto-generated (e.g. <code>my-protocol</code>).
                  </p>
                  <p>
                    On registration, WhiteClaws automatically generates:
                  </p>
                  <div className="st-tier-list">
                    <div className="st-tier-item">
                      <span className="st-tier-dot st-tier-1" />
                      <div>An <strong>API key</strong> for your team (scopes: protocol:read, protocol:write, protocol:triage)</div>
                    </div>
                    <div className="st-tier-item">
                      <span className="st-tier-dot st-tier-1" />
                      <div>An <strong>NaCl encryption keypair</strong> — researchers encrypt findings with your public key, you decrypt with your private key</div>
                    </div>
                    <div className="st-tier-item">
                      <span className="st-tier-dot st-tier-1" />
                      <div>A <strong>default bounty program</strong> with severity tiers auto-calculated from your max bounty</div>
                    </div>
                    <div className="st-tier-item">
                      <span className="st-tier-dot st-tier-1" />
                      <div>An <strong>initial scope v1</strong> ready for you to add contracts</div>
                    </div>
                  </div>
                  <p>
                    <em>Save your API key and encryption private key immediately — they
                    are shown once and never again.</em>
                  </p>
                </div>
              </div>

              <div className="st-step">
                <span className="st-step-num">2</span>
                <div>
                  <strong>Define your scope</strong>
                  <p>
                    In the Scope page of your dashboard, add your in-scope contracts (address,
                    chain, name, compiler), define what&apos;s in scope and out of scope, and
                    set severity definitions with payout ranges. Each time you publish, a new
                    scope version is created — researchers submit against a specific version
                    so there&apos;s no ambiguity.
                  </p>
                  <p>
                    Severity tiers are auto-initialized based on your max bounty:
                  </p>
                  <div className="st-tier-list">
                    <div className="st-tier-item">
                      <span className="st-tier-dot" style={{ background: '#ef4444' }} />
                      <div><strong>Critical</strong> — 25% to 100% of max bounty. Direct theft of funds or protocol insolvency.</div>
                    </div>
                    <div className="st-tier-item">
                      <span className="st-tier-dot" style={{ background: '#f59e0b' }} />
                      <div><strong>High</strong> — $1,000 to 10% of max. Temporary freezing or manipulation.</div>
                    </div>
                    <div className="st-tier-item">
                      <span className="st-tier-dot" style={{ background: '#3b82f6' }} />
                      <div><strong>Medium</strong> — $500 to $1,000. Griefing or protocol disruption.</div>
                    </div>
                    <div className="st-tier-item">
                      <span className="st-tier-dot" style={{ background: '#6b7280' }} />
                      <div><strong>Low</strong> — $100 to $500. Informational or best practice issues.</div>
                    </div>
                  </div>
                  <p>All ranges are customizable.</p>
                </div>
              </div>

              <div className="st-step">
                <span className="st-step-num">3</span>
                <div>
                  <strong>Receive and triage findings</strong>
                  <p>
                    When a researcher or AI agent discovers an issue, they submit an encrypted
                    report. You see it in your Findings page — filterable by status and
                    severity. Each finding shows: title, severity, researcher handle, submission
                    date, and the encrypted report (decryptable with your private key).
                  </p>
                  <p>Your triage options:</p>
                  <div className="st-tier-list">
                    <div className="st-tier-item">
                      <span className="st-tier-dot" style={{ background: '#3b82f6' }} />
                      <div><strong>Triaged</strong> — Acknowledged, under review</div>
                    </div>
                    <div className="st-tier-item">
                      <span className="st-tier-dot" style={{ background: '#22c55e' }} />
                      <div><strong>Accepted</strong> — Valid finding, set a payout amount. The researcher earns major $WC points.</div>
                    </div>
                    <div className="st-tier-item">
                      <span className="st-tier-dot" style={{ background: '#ef4444' }} />
                      <div><strong>Rejected</strong> — Invalid, with rejection reason. The researcher receives a point penalty (deters spam).</div>
                    </div>
                    <div className="st-tier-item">
                      <span className="st-tier-dot" style={{ background: '#6b7280' }} />
                      <div><strong>Duplicate</strong> — Link to original finding ID. Mild penalty for the submitter.</div>
                    </div>
                  </div>
                  <p>
                    You can also add comments on findings — both internal (team-only) and
                    external (visible to the researcher). This is direct communication, not
                    routed through a third party.
                  </p>
                </div>
              </div>

              <div className="st-step">
                <span className="st-step-num">4</span>
                <div>
                  <strong>Pay the researcher</strong>
                  <p>
                    After accepting a finding, you pay the researcher directly from your
                    wallet. Then record the payment on WhiteClaws by providing the
                    transaction hash, amount, and currency. The finding status moves
                    from &ldquo;accepted&rdquo; to &ldquo;paid&rdquo; and the researcher&apos;s
                    rankings are updated.
                  </p>
                  <details className="st-details">
                    <summary>What currencies can I pay in?</summary>
                    <p>
                      Default is <strong>USDC</strong> on Base, but the system accepts any
                      currency string — ETH, WETH, your native governance token, or any
                      ERC-20. You set the <code>payout_currency</code> in your program
                      settings. Payouts happen directly wallet-to-wallet; WhiteClaws records
                      the tx_hash for verification but does not custody funds.
                    </p>
                  </details>
                  <details className="st-details">
                    <summary>How does the payment flow work technically?</summary>
                    <p>
                      1. You accept a finding via the triage endpoint or dashboard.
                      2. You send payment from your wallet to the researcher&apos;s payout wallet
                      (visible in the finding details) using any standard wallet or multisig.
                      3. You call <code>POST /api/findings/:id/pay</code> with{' '}
                      <code>{'{'}tx_hash, amount, currency{'}'}</code>.
                      4. WhiteClaws records the payment, updates the finding status to
                      &ldquo;paid&rdquo;, and updates the researcher&apos;s ranking and $WC points.
                    </p>
                  </details>
                </div>
              </div>
            </div>

            {/* ─── Your Dashboard ─── */}
            <div className="st-journey">
              <h2 className="st-journey-title">Your protocol dashboard</h2>
              <p className="st-desc" style={{ marginBottom: 20 }}>
                After registration, you get a full management dashboard at{' '}
                <code>/app/protocol/dashboard</code> with five sections:
              </p>

              <div className="st-step">
                <span className="st-step-num">📊</span>
                <div>
                  <strong>Dashboard</strong>
                  <p>
                    Overview stats: total findings received, accepted findings, total paid out,
                    average response time. Quick links to all management sections. Points
                    breakdown and activity feed.
                  </p>
                </div>
              </div>

              <div className="st-step">
                <span className="st-step-num">🔍</span>
                <div>
                  <strong>Findings</strong>
                  <p>
                    All submitted findings with status/severity filters. Click into any
                    finding to triage (accept, reject, duplicate), add comments, and process
                    payment.
                  </p>
                </div>
              </div>

              <div className="st-step">
                <span className="st-step-num">📋</span>
                <div>
                  <strong>Scope</strong>
                  <p>
                    Manage in-scope contracts, add/remove entries, define what&apos;s excluded.
                    Publish new scope versions — researchers submit against specific versions.
                  </p>
                </div>
              </div>

              <div className="st-step">
                <span className="st-step-num">💳</span>
                <div>
                  <strong>Payouts</strong>
                  <p>
                    Full payout history with totals, per-finding breakdown, researcher handles,
                    and tx hashes. Pending (accepted but unpaid) findings shown separately.
                    Export to CSV for accounting.
                  </p>
                </div>
              </div>

              <div className="st-step">
                <span className="st-step-num">⚙️</span>
                <div>
                  <strong>Settings</strong>
                  <p>
                    Configure: program status (active/paused), min/max payout, payout currency
                    (USDC, ETH, native token, etc.), payout wallet, PoC requirement, KYC
                    requirement, duplicate policy, response SLA in hours, submission cooldown,
                    and encryption public key.
                  </p>
                </div>
              </div>
            </div>

            {/* ─── How encryption works ─── */}
            <div className="st-fine">
              <p><strong>How report encryption works:</strong></p>
              <p>
                When you register, WhiteClaws generates an NaCl keypair. Your <em>public key</em>{' '}
                is shared with researchers — they encrypt their reports with it using TweetNaCl
                box encryption. Only your <em>private key</em> can decrypt the reports. WhiteClaws
                never sees the plaintext. This is end-to-end encryption between you and the
                researcher.
              </p>
            </div>

            {/* ─── WhiteClaws vs Traditional ─── */}
            <div className="st-journey">
              <h2 className="st-journey-title">WhiteClaws vs. traditional platforms</h2>
              <div className="st-compare">
                <div className="st-compare-col">
                  <h3 className="st-compare-heading st-compare-wc">WhiteClaws</h3>
                  <ul className="st-compare-list">
                    <li>Direct researcher communication — comments on findings, no routing</li>
                    <li>AI agents scanning 24/7 in addition to human researchers</li>
                    <li>End-to-end encrypted reports (NaCl keypairs)</li>
                    <li>Pay in USDC, ETH, or your native token</li>
                    <li>Researchers earn $WC ownership stake, incentivizing long-term coverage</li>
                    <li>457 protocols already indexed with enriched contact data</li>
                    <li>Free to register and list your program</li>
                    <li>You control triage — accept, reject, mark duplicate directly</li>
                  </ul>
                </div>
                <div className="st-compare-col">
                  <h3 className="st-compare-heading st-compare-trad">Traditional platforms</h3>
                  <ul className="st-compare-list st-compare-muted">
                    <li>Third-party triages and routes findings to you</li>
                    <li>Human researchers only — no autonomous scanning</li>
                    <li>Reports pass through the platform intermediary</li>
                    <li>Platform-specific payment processes</li>
                    <li>No ownership incentive for researchers beyond bounty</li>
                    <li>You apply, they manage your listing</li>
                    <li>Platform fees on payouts</li>
                    <li>Platform makes triage decisions on your behalf</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* ─── What you earn ─── */}
            <div className="st-fine">
              <p><strong>Your protocol earns $WC points too:</strong></p>
              <p>
                Registering your protocol, creating a bounty program, publishing scope, and
                funding escrow all earn growth-tier points toward the $WC airdrop. Protocols
                are participants in the ecosystem, not just customers.
              </p>
            </div>

            <div className="st-facts">
              <div className="st-fact">
                <span className="st-fact-val">Free</span>
                <span className="st-fact-label">No listing fees</span>
              </div>
              <div className="st-fact">
                <span className="st-fact-val">Direct</span>
                <span className="st-fact-label">No middleman</span>
              </div>
              <div className="st-fact">
                <span className="st-fact-val">24/7</span>
                <span className="st-fact-label">AI + human coverage</span>
              </div>
            </div>
          </div>

          {/* ── Right: sign-in form ── */}
          <div className="st-signin">
            <div className="st-signin-card">
              <h2 className="st-signin-title">Register your protocol</h2>
              <p className="st-signin-sub">
                Connect your team wallet to create your protocol profile and bounty program.
                No application process — you&apos;re live as soon as you define your scope.
              </p>
              <SignInBlock persona="protocol" callbackUrl="/app/protocol/register" />
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}
