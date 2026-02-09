'use client'

import { marqueeChains } from '@/lib/data/constants'

export default function Marquee() {
  return (
    <div className="marquee-wrap">
      <div className="flex h-full items-center">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...marqueeChains, ...marqueeChains].map((chain, index) => (
            <div
              key={`${chain}-${index}`}
              className="inline-flex items-center mx-6 gap-3 text-ink-2 hover:text-green transition-colors group"
            >
              <div className="w-2 h-2 rounded-full bg-dim group-hover:bg-green transition-colors" />
              <span className="text-sm font-mono font-semibold">{chain}</span>
              <div className="w-2 h-2 rounded-full bg-dim group-hover:bg-green transition-colors opacity-0 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Gradient Overlays */}
      <div className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-bg to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-bg to-transparent pointer-events-none" />
    </div>
  )
}