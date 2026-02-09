'use client'

import Link from 'next/link'
import { platformFeatures } from '@/lib/data/constants'
import { PlatformFeature } from '@/lib/data/types'

export default function PlatformGrid() {
  return (
    <div className="section bg-surface-2">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-display font-bold text-3xl md:text-4xl mb-4">
            🛠️ Complete Security Platform
          </h2>
          <p className="text-lg text-ink-2 max-w-3xl mx-auto">
            Everything you need to secure your protocols, from autonomous AI agents
            to managed bug bounty programs.
          </p>
        </div>

        {/* Grid */}
        <div className="pg">
          {platformFeatures.map((feature: PlatformFeature, index: number) => (
            <div
              key={feature.name}
              className="pi group animate-slideUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="text-2xl">{feature.icon}</div>
                <h3 className="font-semibold text-lg">{feature.name}</h3>
              </div>
              <p className="text-sm text-ink-2 mb-6">
                {feature.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="text-xs text-dim">
                  {index === 0 && '12,000+ researchers'}
                  {index === 1 && '24/7 autonomous scanning'}
                  {index === 2 && 'Real-time alerts'}
                  {index === 3 && 'Competitive audits'}
                  {index === 4 && 'Legal protection'}
                  {index === 5 && 'Trustless escrow'}
                  {index === 6 && 'Expert triage'}
                  {index === 7 && 'PR security reviews'}
                </div>
                <div className="text-dim group-hover:text-green transition-colors">
                  →
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 pt-12 border-t border-border">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="text-display font-bold text-2xl mb-4">
                Start Securing Your Protocol
              </h3>
              <p className="text-lg text-ink-2 max-w-2xl">
                Whether you're launching a new protocol or securing an existing one,
                WhiteClaws provides end-to-end security coverage.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/platform"
                className="btn bg-green text-bg font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-opacity text-center"
              >
                Explore Platform
              </Link>
              <Link
                href="/contact"
                className="btn bg-surface border border-border-2 text-ink font-semibold px-8 py-4 rounded-xl hover:bg-surface-3 transition-colors text-center"
              >
                Request Demo
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            <div className="text-center p-6 bg-surface border border-border rounded-xl">
              <div className="text-2xl font-bold text-green font-mono">24/7</div>
              <div className="text-sm text-dim mt-2">Monitoring</div>
            </div>
            <div className="text-center p-6 bg-surface border border-border rounded-xl">
              <div className="text-2xl font-bold text-green font-mono">100+</div>
              <div className="text-sm text-dim mt-2">EVM Chains</div>
            </div>
            <div className="text-center p-6 bg-surface border border-border rounded-xl">
              <div className="text-2xl font-bold text-green font-mono">AI</div>
              <div className="text-sm text-dim mt-2">Reasoning Engine</div>
            </div>
            <div className="text-center p-6 bg-surface border border-border rounded-xl">
              <div className="text-2xl font-bold text-green font-mono">$0</div>
              <div className="text-sm text-dim mt-2">Setup Cost</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}