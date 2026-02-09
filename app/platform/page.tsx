import Footer from '@/components/Footer'
import { platformFeatures } from '@/lib/data/constants'

export default function PlatformPage() {
  return (
    <>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '48px 24px 64px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', textAlign: 'center', marginBottom: 8 }}>
          Platform
        </h1>
        <p style={{ fontSize: 15, color: 'var(--g500)', textAlign: 'center', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.6 }}>
          Every security tool your protocol needs — unified, automated, and built for agents.
        </p>

        <div className="platform-grid">
          {platformFeatures.map((f) => (
            <div key={f.name} className="plat-card">
              <div className="plat-card-icon">{f.icon}</div>
              <h4>{f.name}</h4>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}
