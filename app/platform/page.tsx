import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'
import { platformFeatures } from '@/lib/data/constants'

export default function PlatformPage() {
  return (
    <>
      <Nav />
      <div className="section">
        <div className="sh">
          <h2>Platform</h2>
        </div>
        <p className="sd-text">
          Every security tool your protocol needs — unified, automated, and built for agents.
        </p>
        <div className="pg">
          {platformFeatures.map((f) => (
            <div key={f.name} className="pi">
              <span className="pi-ic">{f.icon}</span>
              <div className="pi-nm">{f.name}</div>
              <div className="pi-ds">{f.description}</div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}
