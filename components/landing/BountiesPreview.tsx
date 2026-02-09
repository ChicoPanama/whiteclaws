'use client'

import Link from 'next/link'
import { useState } from 'react'
import useScrollReveal from '@/components/landing/useScrollReveal'

const filters = ['All', 'DeFi', 'L2 / L1', 'Bridge', 'Infra']

export default function BountiesPreview() {
  const [activeFilter, setActiveFilter] = useState(filters[0])
  const revealRef = useScrollReveal()

  return (
    <section className="section">
      <div className="section-reveal" ref={revealRef}>
        <div className="sh">
          <span className="num">02 / 06</span>
          <h2>Active Bounties</h2>
          <Link href="/bounties" className="lk">View All 156 →</Link>
        </div>
        <div className="bfs">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`bf ${filter === activeFilter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
          <span className="bsort">Highest ↓</span>
        </div>
        <div className="bl">
          <div className="br">
            <div className="bi">
              <svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
                <defs>
                  <linearGradient id="uni" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ff007a" />
                    <stop offset="100%" stopColor="#ff78b4" />
                  </linearGradient>
                </defs>
                <circle cx="16" cy="16" r="14" fill="url(#uni)" />
                <path
                  d="M13.2 7.5c-.1 0-.2.1-.2.2 0 .2.2.3.3.2.1 0 .2-.2.1-.3 0-.1-.1-.1-.2-.1zm.8.3c-.1-.2-.3-.3-.4-.1-.1.1-.1.3.1.4.2.1.3 0 .4-.1 0-.1 0-.2-.1-.2zm-2 2.6c-.8-.4-1.5-.4-1.8.1-.2.3-.1.7.2 1.1.1-.3.3-.5.5-.6.3-.1.6-.1 1-.1-.1-.1-.1-.3.1-.5zm7.6 2.1c-1-1.8-2.3-3-3-3.3.3.5.7 1.2.9 1.8.1.2 0 .3-.1.3-.2 0-.3-.1-.3-.2-.3-.8-.8-1.7-1.4-2.2-.5-.4-1-.6-1.4-.6-.2 0-.3 0-.5.1l-.1.1c-.2.1-.2.3 0 .3.5.1 1 .5 1.5 1.1.5.7.8 1.5 1 2.4 0 .2-.1.3-.2.3-.2 0-.3-.1-.3-.2-.2-.8-.5-1.5-.9-2.1-.4-.5-.8-.9-1.2-1 0 .4.1.8.3 1.4.4 1.1 1.1 2.4 1.1 3.9 0 1.2-.3 2.3-.9 3.2-.5.7-1.2 1.3-2 1.7l-.2.1c-.1.1-.1.2 0 .3.1.1.2.1.3 0 1-.5 1.8-1.2 2.4-2 .7-1 1-2.3 1-3.6 0-.7-.1-1.3-.3-1.9 1 .7 2 2.2 2.5 3.4.2.4.3.8.3 1.2 0 1.2-.5 2.3-1.5 3.1-.1.1-.1.2 0 .3.1.1.2.1.3 0 1.1-.9 1.7-2.2 1.7-3.6 0-.5-.1-1-.4-1.5-.2-.4-.5-.9-.9-1.4z"
                  fill="#fff"
                />
              </svg>
            </div>
            <div className="bn-w">
              <div className="bn">Uniswap V4</div>
              <div className="bt">
                <span>DeFi</span>
                <span>·</span>
                <span>AMM</span>
                <span>·</span>
                <span>Solidity</span>
              </div>
            </div>
            <div className="brt">
              <div className="ba">$3,000,000</div>
              <div className="bc">
                <span className="bch">ETH</span>
                <span className="bch">ARB</span>
              </div>
            </div>
          </div>
          <div className="br">
            <div className="bi">
              <svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
                <circle cx="16" cy="16" r="14" fill="#627eea" />
                <path d="M16 4l-.2.6v15.5l.2.2.2-.2V4.6L16 4z" fill="#fff" opacity=".6" />
                <path d="M16 4l-7 10 7 4.1V4z" fill="#fff" opacity=".45" />
                <path d="M16 4v14.1l7-4.1L16 4z" fill="#fff" opacity=".8" />
                <path d="M9 14l7 4.1V4L9 14z" fill="#fff" opacity=".45" />
                <path d="M16 4v14.1l7-4.1L16 4z" fill="#fff" opacity=".8" />
                <path d="M9 15.6l7 9.6v-5.5L9 15.6z" fill="#fff" opacity=".45" />
                <path d="M16 19.7v5.5l7-9.6-7 4.1z" fill="#fff" opacity=".8" />
              </svg>
            </div>
            <div className="bn-w">
              <div className="bn">Ethereum Foundation</div>
              <div className="bt">
                <span>L1</span>
                <span>·</span>
                <span>Core</span>
                <span>·</span>
                <span>Go</span>
              </div>
            </div>
            <div className="brt">
              <div className="ba">$2,000,000</div>
              <div className="bc">
                <span className="bch">ETH</span>
              </div>
            </div>
          </div>
          <div className="br">
            <div className="bi">
              <svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
                <circle cx="16" cy="16" r="14" fill="#0d1117" />
                <circle cx="16" cy="16" r="10" stroke="#7b3fe4" strokeWidth="1.5" fill="none" />
                <circle cx="16" cy="16" r="6.5" stroke="#7b3fe4" strokeWidth="1" fill="none" opacity=".6" />
                <circle cx="16" cy="16" r="1.5" fill="#7b3fe4" />
              </svg>
            </div>
            <div className="bn-w">
              <div className="bn">Wormhole</div>
              <div className="bt">
                <span>Bridge</span>
                <span>·</span>
                <span>Cross-chain</span>
                <span>·</span>
                <span>Rust</span>
              </div>
            </div>
            <div className="brt">
              <div className="ba">$2,500,000</div>
              <div className="bc">
                <span className="bch">Multi</span>
              </div>
            </div>
          </div>
          <div className="br">
            <div className="bi">
              <svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
                <circle cx="16" cy="16" r="14" fill="#ff0420" />
                <path d="M11.5 19.5c-1.9 0-3.3-1.4-3.3-3.5s1.4-3.5 3.3-3.5c1.9 0 3.3 1.4 3.3 3.5s-1.4 3.5-3.3 3.5zm0-1.8c.8 0 1.3-.7 1.3-1.7s-.5-1.7-1.3-1.7c-.8 0-1.3.7-1.3 1.7s.5 1.7 1.3 1.7zm6.1 1.6V13h2.6c1.6 0 2.6.9 2.6 2.2 0 1.3-1 2.2-2.6 2.2h-.8v2h-1.8zm1.8-3.6h.7c.6 0 .9-.3.9-.8s-.3-.8-.9-.8h-.7v1.6z" fill="#fff" />
              </svg>
            </div>
            <div className="bn-w">
              <div className="bn">Optimism</div>
              <div className="bt">
                <span>L2</span>
                <span>·</span>
                <span>Rollup</span>
                <span>·</span>
                <span>Go</span>
              </div>
            </div>
            <div className="brt">
              <div className="ba">$2,000,000</div>
              <div className="bc">
                <span className="bch">OP</span>
              </div>
            </div>
          </div>
          <div className="br">
            <div className="bi">
              <svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
                <rect width="32" height="32" rx="4" fill="#375bd2" />
                <path d="M16 6l2 1.15 4 2.31 2 1.15v2.31l0 4.62 0 2.31-2 1.15-4 2.31-2 1.15-2-1.15-4-2.31-2-1.15v-2.31l0-4.62 0-2.31 2-1.15 4-2.31L16 6z" fill="none" stroke="#fff" strokeWidth="1.8" />
              </svg>
            </div>
            <div className="bn-w">
              <div className="bn">Chainlink CCIP</div>
              <div className="bt">
                <span>Infra</span>
                <span>·</span>
                <span>Oracle</span>
                <span>·</span>
                <span>Solidity</span>
              </div>
            </div>
            <div className="brt">
              <div className="ba">$1,500,000</div>
              <div className="bc">
                <span className="bch">Multi</span>
              </div>
            </div>
          </div>
          <div className="br">
            <div className="bi">
              <svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
                <circle cx="16" cy="16" r="14" fill="#1aab9b" />
                <path d="M8 22V14.5l4.8 3.2V22h1.6v-5.2L8 12v10H8zm16 0V14.5l-4.8 3.2V22h-1.6v-5.2L24 12v10h0z" fill="#fff" />
              </svg>
            </div>
            <div className="bn-w">
              <div className="bn">MakerDAO</div>
              <div className="bt">
                <span>DeFi</span>
                <span>·</span>
                <span>Lending</span>
                <span>·</span>
                <span>Solidity</span>
              </div>
            </div>
            <div className="brt">
              <div className="ba">$1,000,000</div>
              <div className="bc">
                <span className="bch">ETH</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
