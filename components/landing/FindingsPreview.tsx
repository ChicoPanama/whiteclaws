'use client'

import Link from 'next/link'
import { findings } from '@/lib/data/constants'
import { Finding } from '@/lib/data/types'

export default function FindingsPreview() {
  const severityColors = {
    critical: 'text-red',
    high: 'text-orange',
    medium: 'text-yellow',
    low: 'text-dim',
  }

  const severityBgs = {
    critical: 'bg-red/10',
    high: 'bg-orange/10',
    medium: 'bg-yellow/10',
    low: 'bg-dim/10',
  }

  return (
    <div className="section">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <h2 className="text-display font-bold text-3xl md:text-4xl mb-2">
              🔍 Recent Findings
            </h2>
            <p className="text-lg text-ink-2">
              Latest vulnerabilities discovered by our agents and researchers
            </p>
          </div>
          <Link
            href="/findings"
            className="btn bg-surface border border-border-2 text-ink font-semibold px-6 py-3 rounded-lg hover:bg-surface-3 transition-colors inline-flex items-center gap-2"
          >
            View All Findings →
          </Link>
        </div>

        {/* Findings List */}
        <div className="fl">
          {findings.map((finding: Finding, index: number) => (
            <div
              key={finding.id}
              className="fr group hover:bg-surface-2 transition-colors animate-slideUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Severity Badge */}
              <div className={`w-3 h-3 rounded-full ${severityColors[finding.severity]}`} />
              
              {/* Severity Label */}
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${severityBgs[finding.severity]} ${severityColors[finding.severity]}`}>
                {finding.severity.toUpperCase()}
              </div>

              {/* Description */}
              <div className="flex-1 min-w-0">
                <div className="font-medium">{finding.description}</div>
                <div className="text-xs text-dim mt-1">
                  {finding.severity === 'critical' && 'Funds at risk · Immediate action required'}
                  {finding.severity === 'high' && 'Significant impact · Requires patching'}
                  {finding.severity === 'medium' && 'Moderate risk · Should be addressed'}
                  {finding.severity === 'low' && 'Minor issue · Optimization opportunity'}
                </div>
              </div>

              {/* Time & Actions */}
              <div className="flex items-center gap-4">
                <div className="text-sm text-dim">{finding.timeAgo}</div>
                <div className="text-dim group-hover:text-green transition-colors opacity-0 group-hover:opacity-100">
                  →
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Severity Distribution */}
        <div className="mt-12 pt-8 border-t border-border">
          <h3 className="font-semibold text-lg mb-6">Severity Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-4 h-4 rounded-full bg-red" />
                <div className="font-semibold">Critical</div>
              </div>
              <div className="text-3xl font-bold text-red font-mono">42</div>
              <div className="text-sm text-dim mt-2">Findings this month</div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-4 h-4 rounded-full bg-orange" />
                <div className="font-semibold">High</div>
              </div>
              <div className="text-3xl font-bold text-orange font-mono">128</div>
              <div className="text-sm text-dim mt-2">Findings this month</div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-4 h-4 rounded-full bg-yellow" />
                <div className="font-semibold">Medium</div>
              </div>
              <div className="text-3xl font-bold text-yellow font-mono">347</div>
              <div className="text-sm text-dim mt-2">Findings this month</div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-4 h-4 rounded-full bg-dim" />
                <div className="font-semibold">Low</div>
              </div>
              <div className="text-3xl font-bold text-dim font-mono">330</div>
              <div className="text-sm text-dim mt-2">Findings this month</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-green-dim border border-green-mid rounded-xl p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-display font-bold text-2xl mb-2">
                Submit Your Finding
              </h3>
              <p className="text-lg text-ink-2">
                Found a vulnerability? Submit it for verification and earn rewards.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/submit"
                className="btn bg-green text-bg font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-opacity text-center"
              >
                Submit Finding
              </Link>
              <Link
                href="/learn"
                className="btn bg-surface border border-border-2 text-ink font-semibold px-8 py-4 rounded-xl hover:bg-surface-3 transition-colors text-center"
              >
                Learn Guidelines
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}