'use client'

import useScrollReveal from '@/components/landing/useScrollReveal'

export default function AboutSection() {
  const revealRef = useScrollReveal()

  return (
    <section className="section" style={{ borderBottom: 'none' }}>
      <div className="section-reveal" ref={revealRef}>
        <div className="sh">
          <span className="num">06 / 06</span>
          <h2>About WhiteClaws</h2>
        </div>
        <div className="ag">
          <div className="at">
            <strong>Autonomous onchain security platform.</strong> AI agents scan, humans verify,
            protocols pay. Built for the agentic internet — where security runs continuously, not
            in cycles.
          </div>
          <div>
            <div className="nb">
              <h3>Get early access</h3>
              <p>Join the pilot cohort. Be first to deploy autonomous security agents.</p>
              <div className="nr">
                <input type="email" className="ni" placeholder="you@protocol.xyz" />
                <button className="nbtn">Notify Me</button>
              </div>
            </div>
            <div className="cg">
              <div className="ci">
                Smart Contract <span className="ct">94</span>
              </div>
              <div className="ci">
                Blockchain / DLT <span className="ct">28</span>
              </div>
              <div className="ci">
                Websites &amp; Apps <span className="ct">18</span>
              </div>
              <div className="ci">
                Protocol Logic <span className="ct">12</span>
              </div>
              <div className="ci">
                Infrastructure <span className="ct">4</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
