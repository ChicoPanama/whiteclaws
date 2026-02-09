'use client'

import { useState } from 'react'
import useScrollReveal from '@/components/landing/useScrollReveal'

const tabs = ['CLI', 'Clawd Skill', 'Manual']

export default function DeploySection() {
  const [activeTab, setActiveTab] = useState(tabs[0])
  const [copyLabel, setCopyLabel] = useState('Copy')
  const revealRef = useScrollReveal()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        'whiteclaws deploy --agent scanner-v2 --chains eth,base,arb'
      )
      setCopyLabel('Copied ✓')
      setTimeout(() => setCopyLabel('Copy'), 2000)
    } catch (error) {
      console.error('Copy failed', error)
    }
  }

  return (
    <section className="section">
      <div className="section-reveal" ref={revealRef}>
        <div className="sh">
          <span className="num">01 / 06</span>
          <h2>Deploy Your Agent</h2>
          <a href="#" className="lk">Documentation →</a>
        </div>
        <div className="dg">
          <div className="dl">
            <h3>One command. Full protection.</h3>
            <p>
              Deploy autonomous security agents on your contracts in seconds. Continuous scanning,
              AI-powered analysis, and onchain escrow payouts — all running while you ship.
            </p>
            <div className="ds">
              <div className="ds-i">
                <span className="ds-n">1</span>
                <span className="ds-t">Deploy your agent via CLI or Clawd skill command</span>
              </div>
              <div className="ds-i">
                <span className="ds-n">2</span>
                <span className="ds-t">Agent scans contracts autonomously using Slither + AI analysis</span>
              </div>
              <div className="ds-i">
                <span className="ds-n">3</span>
                <span className="ds-t">Verified findings pay out directly via onchain escrow</span>
              </div>
            </div>
          </div>
          <div className="terminal">
            <div className="tt">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={tab === activeTab ? 'active' : undefined}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="tb">
              <span className="td r"></span>
              <span className="td y"></span>
              <span className="td g"></span>
              <span className="tl">whiteclaws — bash</span>
            </div>
            <button
              className={`tcopy ${copyLabel !== 'Copy' ? 'copied' : ''}`}
              id="termCopy"
              type="button"
              onClick={handleCopy}
            >
              {copyLabel}
            </button>
            <div className="tc">
              <span className="p">$</span> whiteclaws deploy <span className="f">--agent</span>{' '}
              scanner-v2 <span className="f">--chains</span>{' '}
              <span className="v">eth,base,arb</span>
              <span className="cur"></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
