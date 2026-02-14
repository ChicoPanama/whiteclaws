import { notFound } from 'next/navigation'
import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { openZeppelinResearch } from '@/lib/data/constants'

export function generateStaticParams() {
  return openZeppelinResearch.map((r) => ({ id: r.id }))
}

export default function LearnDetailPage({ params }: { params: { id: string } }) {
  const doc = openZeppelinResearch.find((r) => r.id === params.id)
  if (!doc) return notFound()

  return (
    <>
      <Nav />
      <div className="section" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/platform/hack-database" className="lk" style={{ marginBottom: '24px', display: 'inline-block' }}>
          &#8592; Back to Hack Database
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <span style={{ fontSize: '2.5rem' }}>{doc.icon}</span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{doc.title}</h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
          <span style={{
            display: 'inline-block', fontSize: '.72rem', padding: '3px 10px',
            borderRadius: '4px', border: '1px solid #333', color: '#888',
          }}>{doc.category}</span>
          {doc.chains.map(c => (
            <span key={c} style={{
              display: 'inline-block', fontSize: '.72rem', padding: '3px 10px',
              borderRadius: '4px', border: '1px solid #333', color: '#888',
            }}>{c}</span>
          ))}
          <span style={{
            display: 'inline-block', fontSize: '.72rem', padding: '3px 10px',
            borderRadius: '4px', border: '1px solid #2a5a3a', color: '#4ade80',
          }}>{doc.bountyValue}</span>
        </div>

        <div style={{
          border: '1px solid #222', borderRadius: '12px', padding: '28px',
          marginBottom: '28px', background: '#111',
        }}>
          <div style={{
            fontSize: '.72rem', fontWeight: 600, letterSpacing: '.08em',
            textTransform: 'uppercase', color: '#666', marginBottom: '14px',
          }}>Overview</div>
          <p style={{ color: '#ccc', fontSize: '1rem', lineHeight: 1.7, margin: 0 }}>
            {doc.description}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '28px' }}>
          <div style={{
            border: '1px solid #222', borderRadius: '8px', padding: '16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{doc.findings}</div>
            <div style={{ fontSize: '.75rem', color: '#888' }}>Finding{doc.findings !== 1 ? 's' : ''}</div>
          </div>
          <div style={{
            border: '1px solid #222', borderRadius: '8px', padding: '16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{doc.chains.length}</div>
            <div style={{ fontSize: '.75rem', color: '#888' }}>Chain{doc.chains.length !== 1 ? 's' : ''}</div>
          </div>
          <div style={{
            border: '1px solid #222', borderRadius: '8px', padding: '16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#4ade80' }}>{doc.bountyValue}</div>
            <div style={{ fontSize: '.75rem', color: '#888' }}>Bounty Range</div>
          </div>
        </div>

        <div style={{
          border: '1px solid #222', borderRadius: '12px', padding: '28px',
          marginBottom: '28px', background: '#111',
        }}>
          <div style={{
            fontSize: '.72rem', fontWeight: 600, letterSpacing: '.08em',
            textTransform: 'uppercase', color: '#666', marginBottom: '14px',
          }}>Research Details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a1a1a', paddingBottom: '10px' }}>
              <span style={{ color: '#888', fontSize: '.85rem' }}>Category</span>
              <span style={{ color: '#ccc', fontSize: '.85rem', fontWeight: 600 }}>{doc.category}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a1a1a', paddingBottom: '10px' }}>
              <span style={{ color: '#888', fontSize: '.85rem' }}>Affected Chains</span>
              <span style={{ color: '#ccc', fontSize: '.85rem', fontWeight: 600 }}>{doc.chains.join(', ')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a1a1a', paddingBottom: '10px' }}>
              <span style={{ color: '#888', fontSize: '.85rem' }}>Date Published</span>
              <span style={{ color: '#ccc', fontSize: '.85rem', fontWeight: 600 }}>{doc.date}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888', fontSize: '.85rem' }}>Bounty Value</span>
              <span style={{ color: '#4ade80', fontSize: '.85rem', fontWeight: 600 }}>{doc.bountyValue}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
          <Link href="/platform/hack-database" className="bn ob-link-reset">
            &#8592; Back to Hack Database
          </Link>
          <Link href="/learn" className="lk ob-link-reset" style={{ padding: '8px 0' }}>
            All Research
          </Link>
        </div>
      </div>
      <Footer />
    </>
  )
}
