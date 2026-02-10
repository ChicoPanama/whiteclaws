'use client'

import useScrollReveal from '@/components/landing/useScrollReveal'
import { findings } from '@/lib/data/constants'

const severityClass: Record<string, string> = {
  critical: 'fc',
  high: 'fh',
  medium: 'fm-sev',
  low: 'flo',
}

export default function FindingsPreview() {
  const revealRef = useScrollReveal()

  return (
    <section className="section">
      <div className="section-reveal" ref={revealRef}>
        <div className="sh">
          <span className="num">05 / 06</span>
          <h2>Recent Findings</h2>
          <a href="#" className="lk">View All →</a>
        </div>
        <div className="fl">
          {findings.map((f) => (
            <div key={f.id} className="fr">
              <div className="fl-l">
                <span className={`fsv ${severityClass[f.severity]}`}>
                  <span className="dot"></span>
                  {f.severity.charAt(0).toUpperCase() + f.severity.slice(1)}
                </span>
                <span className="fd-d">{f.description}</span>
              </div>
              <div className="fl-r">
                <span className="fd-lk">View details →</span>
                <span className="fd-tm">{f.timeAgo}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
