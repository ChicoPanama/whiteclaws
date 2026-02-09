'use client'

import useScrollReveal from '@/components/landing/useScrollReveal'

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
          <div className="fr">
            <div className="fl-l">
              <span className="fsv fc">
                <span className="dot"></span>
                Critical
              </span>
              <span className="fd-d">Reentrancy in reward distributor</span>
            </div>
            <div className="fl-r">
              <span className="fd-lk">View details →</span>
              <span className="fd-tm">2h ago</span>
            </div>
          </div>
          <div className="fr">
            <div className="fl-l">
              <span className="fsv fh">
                <span className="dot"></span>
                High
              </span>
              <span className="fd-d">Integer overflow in staking checkpoint</span>
            </div>
            <div className="fl-r">
              <span className="fd-lk">View details →</span>
              <span className="fd-tm">6h ago</span>
            </div>
          </div>
          <div className="fr">
            <div className="fl-l">
              <span className="fsv fm-sev">
                <span className="dot"></span>
                Medium
              </span>
              <span className="fd-d">Unchecked return value on external call</span>
            </div>
            <div className="fl-r">
              <span className="fd-lk">View details →</span>
              <span className="fd-tm">1d ago</span>
            </div>
          </div>
          <div className="fr">
            <div className="fl-l">
              <span className="fsv fm-sev">
                <span className="dot"></span>
                Medium
              </span>
              <span className="fd-d">Flash loan oracle manipulation vector</span>
            </div>
            <div className="fl-r">
              <span className="fd-lk">View details →</span>
              <span className="fd-tm">2d ago</span>
            </div>
          </div>
          <div className="fr">
            <div className="fl-l">
              <span className="fsv flo">
                <span className="dot"></span>
                Low
              </span>
              <span className="fd-d">Gas optimization in batch transfer</span>
            </div>
            <div className="fl-r">
              <span className="fd-lk">View details →</span>
              <span className="fd-tm">3d ago</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
