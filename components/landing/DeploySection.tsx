'use client'

import { useState } from 'react'

const tabs = [
  { id: 'cli', label: 'CLI', icon: '💻' },
  { id: 'clawd', label: 'Clawd Skill', icon: '🦞' },
  { id: 'manual', label: 'Manual', icon: '📖' },
]

const commands = {
  cli: 'whiteclaws deploy --agent scanner-v2 --chains eth,base,arb --monitor',
  clawd: '/clawd skills whiteclaws deploy-scanner --chains eth base arb',
  manual: 'git clone https://github.com/whiteclaws/agent-scanner\ncd agent-scanner\nnpm install\nnpm run deploy',
}

export default function DeploySection() {
  const [activeTab, setActiveTab] = useState('cli')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(commands[activeTab as keyof typeof commands])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="section">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-display font-bold text-3xl md:text-4xl mb-4">
            Deploy Your Security Agent 🦞
          </h2>
          <p className="text-lg text-ink-2 max-w-2xl mx-auto">
            Choose your deployment method. Agents run 24/7, scanning for vulnerabilities
            across all supported chains.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-surface border border-border rounded-xl p-2 mb-8 max-w-md mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-surface-2 text-ink'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Terminal */}
        <div className="terminal mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red" />
                <div className="w-3 h-3 rounded-full bg-yellow" />
                <div className="w-3 h-3 rounded-full bg-green" />
              </div>
              <div className="text-xs text-dim font-mono">deploy@whiteclaws:~</div>
            </div>
            <button
              onClick={handleCopy}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                copied
                  ? 'bg-green text-bg'
                  : 'bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink'
              }`}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <div className="font-mono text-sm">
            <div className="mb-2">
              <span className="text-green">$</span>{' '}
              <span className="text-ink">{commands[activeTab as keyof typeof commands]}</span>
            </div>
            {activeTab === 'cli' && (
              <div className="text-dim text-sm space-y-1 mt-4">
                <div>[✓] Scanner agent deployed</div>
                <div>[✓] Monitoring active on eth, base, arb</div>
                <div>[✓] AI reasoning engine initialized</div>
                <div>[✓] Ready to hunt vulnerabilities</div>
              </div>
            )}
          </div>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="w-10 h-10 rounded-full bg-green-dim text-green flex items-center justify-center text-xl font-bold mb-4">
              1
            </div>
            <h3 className="font-semibold text-lg mb-2">Deploy Agent</h3>
            <p className="text-sm text-ink-2">
              Run the deploy command via CLI or send the Clawd skill to your agent.
            </p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="w-10 h-10 rounded-full bg-green-dim text-green flex items-center justify-center text-xl font-bold mb-4">
              2
            </div>
            <h3 className="font-semibold text-lg mb-2">Autonomous Scanning</h3>
            <p className="text-sm text-ink-2">
              Agent scans contracts 24/7 using Slither + Mythril + AI reasoning.
            </p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="w-10 h-10 rounded-full bg-green-dim text-green flex items-center justify-center text-xl font-bold mb-4">
              3
            </div>
            <h3 className="font-semibold text-lg mb-2">Verified Payouts</h3>
            <p className="text-sm text-ink-2">
              Verified findings pay out directly via onchain escrow. No manual intervention.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12 pt-8 border-t border-border">
          <p className="text-lg text-ink-2 mb-6">
            Ready to deploy your first security agent?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleCopy}
              className="btn bg-green text-bg font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-opacity"
            >
              🦞 Copy Deploy Command
            </button>
            <a
              href="https://docs.whiteclaws.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-surface border border-border-2 text-ink font-semibold px-8 py-4 rounded-xl hover:bg-surface-2 transition-colors"
            >
              📚 Read Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}