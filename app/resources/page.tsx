import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'
import type { Row } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/server'

const audits = [
  // Scroll (6 reports)
  { protocol: 'Scroll', name: 'zkTrie Security Review', auditor: 'OpenZeppelin', date: '2023-07', file: '/audits/2023-07-scroll-zktrie-securityreview.pdf' },
  { protocol: 'Scroll', name: 'L2 Geth Initial Security Review', auditor: 'OpenZeppelin', date: '2023-08', file: '/audits/2023-08-scrollL2geth-initial-securityreview.pdf' },
  { protocol: 'Scroll', name: 'L2 Geth Security Review', auditor: 'OpenZeppelin', date: '2023-08', file: '/audits/2023-08-scrollL2geth-securityreview.pdf' },
  { protocol: 'Scroll', name: '4844 Blob Security Review', auditor: 'OpenZeppelin', date: '2024-04', file: '/audits/2024-04-scroll-4844-blob-securityreview.pdf' },
  { protocol: 'Scroll', name: 'Euclid Phase 1 Security Review', auditor: 'OpenZeppelin', date: '2025-04', file: '/audits/2025-04-scroll-euclid-phase1-securityreview.pdf' },
  { protocol: 'Scroll', name: 'Euclid Phase 2 Security Review', auditor: 'OpenZeppelin', date: '2025-04', file: '/audits/2025-04-scroll-euclid-phase2-securityreview.pdf' },
  { protocol: 'Scroll', name: 'Smart Contracts Audit', auditor: 'Zellic', date: '2023-05', file: '/audits/Scroll - 05.26.23 Zellic Audit Report.pdf' },
  { protocol: 'Scroll', name: 'Smart Contracts Audit', auditor: 'Zellic', date: '2023-09', file: '/audits/Scroll - 09.27.23 Zellic Audit Report.pdf' },
  { protocol: 'Scroll', name: 'Lido Gateway Audit', auditor: 'Zellic', date: '2023', file: '/audits/Scroll Lido Gateway - Zellic Audit Report.pdf' },

  // ALEX Protocol (7 reports)
  { protocol: 'ALEX', name: 'Bridge Audit', auditor: 'ALEX', date: '2023-04', file: '/audits/ALEX_Audit_Bridge_2023-04.pdf' },
  { protocol: 'ALEX', name: 'Bridge Audit', auditor: 'CoinFabrik', date: '2022-12', file: '/audits/ALEX_Audit_bridge_coinfabrik_202212.pdf' },
  { protocol: 'ALEX', name: 'Pool Equation Audit', auditor: 'ALEX', date: '2021-11', file: '/audits/AlexGo_Audit_202111_Pool_Equation.pdf' },
  { protocol: 'ALEX', name: 'Launchpad Vault Reserve Audit', auditor: 'ALEX', date: '2022-01', file: '/audits/AlexGo_Audit_202201_Launchpad_Vault_Reserve.pdf' },
  { protocol: 'ALEX', name: 'DAO Audit', auditor: 'ALEX', date: '2022-02', file: '/audits/AlexGo_Audit_202202_DAO.pdf' },
  { protocol: 'ALEX', name: 'Launchpad v1.1 / AutoALEX / CRP Audit', auditor: 'ALEX', date: '2022-04', file: '/audits/AlexGo_Audit_202204_Launchpadv1.1_AutoALEX_CRP.pdf' },
  { protocol: 'ALEX', name: 'Smart Contracts Final Audit', auditor: 'Least Authority', date: '2022', file: '/audits/Least_Authority_ALEX_Protocol_Smart_Contracts_Final_Audit_Report.pdf' },

  // Inverse Finance (6 reports)
  { protocol: 'Inverse Finance', name: 'Security Audit', auditor: 'Ambisafe', date: '2023-07', file: '/audits/ambisafe-2023-07-18.pdf' },
  { protocol: 'Inverse Finance', name: 'Security Audit', auditor: 'Ambisafe', date: '2023-11', file: '/audits/ambisafe-2023-11-10.pdf' },
  { protocol: 'Inverse Finance', name: 'Security Audit', auditor: 'CertiK', date: '2023-05', file: '/audits/certik-2023-05-04.pdf' },
  { protocol: 'Inverse Finance', name: 'Security Audit', auditor: 'Cyfrin', date: '2023-11', file: '/audits/cyfrin-2023-11-10.pdf' },
  { protocol: 'Inverse Finance', name: 'Security Audit', auditor: 'Hacken', date: '2023-05', file: '/audits/hacken-2023-05-22.pdf' },
  { protocol: 'Inverse Finance', name: 'sDOLA Audit', auditor: 'yAudit', date: '2023', file: '/audits/sDOLA-yAudit.pdf' },

  // Zest Protocol (5 reports)
  { protocol: 'Zest Protocol', name: 'v2 Audit', auditor: 'Clarity Alliance', date: '2024', file: '/audits/Clarity Alliance - Zest Protocol v2.pdf' },
  { protocol: 'Zest Protocol', name: 'v2 Upgrade Audit', auditor: 'Clarity Alliance', date: '2024', file: '/audits/Clarity Alliance - Zest Protocol v2 Upgrade.pdf' },
  { protocol: 'Zest Protocol', name: 'v2 Upgrade V2 Audit', auditor: 'Clarity Alliance', date: '2024', file: '/audits/Clarity Alliance - Zest Protocol v2 Upgrade V2.pdf' },
  { protocol: 'Zest Protocol', name: 'Security Audit', auditor: 'Clarity Alliance', date: '2024-11', file: '/audits/ClarityAlliance-2024-11.pdf' },
  { protocol: 'Zest Protocol', name: 'Security Audit', auditor: 'CoinFabrik', date: '2023-11', file: '/audits/CoinFabrik-2023-11.pdf' },

  // Individual protocol audits
  { protocol: 'Alchemix', name: 'v2 Audit', auditor: 'Alchemix', date: '2022', file: '/audits/Alchemix_v2.pdf' },
  { protocol: 'XION', name: 'Passkeys Audit', auditor: 'Zellic', date: '2024', file: '/audits/Xion Passkeys - Zellic Audit Report.pdf' },
  { protocol: 'Ref Finance', name: 'Security Audit', auditor: 'Ref Finance', date: '2023', file: '/audits/spaces -MhIB0bSr6nOBfTiANqT-2910905616 uploads h8mipVuJTakoLC6XmzfU Ref Finance Security Audit-1.pdf' },
  { protocol: 'Pinto', name: 'Security Audit', auditor: 'Pinto', date: '2024', file: '/audits/pinto.pdf' },
  { protocol: 'Vault System', name: 'Internal Vaults System Audit', auditor: 'Community Audit', date: '2023-02', file: '/audits/2023-02-03 - WhiteClaws - Internal Audit of the Vaults system.pdf' },
  { protocol: 'Inverse Finance', name: 'FiRM Audit', auditor: 'Nomoi', date: '2023', file: '/audits/firm-nomoi.pdf' },
  { protocol: 'Sherlock', name: 'Junior Audit', auditor: 'Sherlock', date: '2023', file: '/audits/junior-sherlock.pdf' },

  // Indexed audits (001-008)
  { protocol: 'Oak Network', name: 'PaymentTreasury Audit', auditor: 'Community Audit', date: '2024', file: '/audits/001_Oak_Network.pdf' },
  { protocol: 'XYZ Protocol', name: 'Security Audit', auditor: 'Community Audit', date: '2024', file: '/audits/002_xyz.pdf' },
  { protocol: 'CC Protocol', name: 'Security Audit', auditor: 'Community Audit', date: '2024', file: '/audits/003_CC_Protocol.pdf' },
  { protocol: 'Plume Network', name: 'Security Audit', auditor: 'Community Audit', date: '2024', file: '/audits/004_Plume_Network.pdf' },
  { protocol: 'Plaza Finance', name: 'Security Audit', auditor: 'Community Audit', date: '2024', file: '/audits/005_Plaza_Finance.pdf' },
  { protocol: 'Hoenn', name: 'Security Audit', auditor: 'Community Audit', date: '2024', file: '/audits/006_Hoenn.pdf' },
  { protocol: 'Helios', name: 'Security Audit', auditor: 'Community Audit', date: '2024', file: '/audits/007_Helios.pdf' },
  { protocol: 'Halogen', name: 'Security Audit', auditor: 'Community Audit', date: '2024', file: '/audits/008_Halogen.pdf' },
]

const resources = [
  { icon: '📄', name: 'Smart Contract Vulnerabilities Handbook', description: 'Comprehensive guide to common smart contract vulnerabilities' },
  { icon: '⚗️', name: 'Foundry Testing Best Practices', description: 'How to write effective PoC tests with Foundry' },
]

// Group audits by protocol
const grouped = audits.reduce<Record<string, typeof audits>>((acc, a) => {
  if (!acc[a.protocol]) acc[a.protocol] = []
  acc[a.protocol].push(a)
  return acc
}, {})

export const dynamic = 'force-dynamic'

const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function getResourcesIndex() {
  if (!hasSupabaseConfig) return []

  const supabase = createClient()
  const { data, error } = await supabase
    .from('resources')
    .select('id,title,description,type,downloads,created_at,users(handle)')
    .order('created_at', { ascending: false })
    .limit(50)
    .returns<(Row<'resources'> & { users: { handle: string } | { handle: string }[] | null })[]>()

  if (error) throw error

  return (data ?? []).map((r) => {
    const user = Array.isArray(r.users) ? r.users[0] : r.users
    return {
      id: r.id,
      title: r.title,
      description: r.description ?? '',
      type: r.type ?? 'resource',
      downloads: r.downloads ?? 0,
      author: user?.handle ?? 'unknown',
    }
  })
}

export default async function ResourcesPage() {
  let dbResources: Array<{
    id: string
    title: string
    description: string
    type: string
    downloads: number
    author: string
  }> = []
  try {
    dbResources = await getResourcesIndex()
  } catch {
    dbResources = []
  }

  return (
    <>
      <Nav />
      <div className="section">
        <div className="sh">
          <h2>Resources</h2>
          <span className="lk">{audits.length} audit reports</span>
        </div>
        <p className="sd-text">Security tools, guides, and audit reports for whitehat researchers.</p>

        {dbResources.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 16 }}>Featured Resources</h3>
            <div className="fl">
              {dbResources.map((r) => (
                <Link key={r.id} href={`/resources/${r.id}`} className="ob-link-reset">
                  <div className="fr">
                    <div className="fl-l">
                      <span className="fsv fc">
                        <span className="dot"></span>
                        {r.type}
                      </span>
                      <span className="fd-d">{r.title}</span>
                      {r.description ? (
                        <span className="wc-field-helper" style={{ marginTop: 6, display: 'block' }}>
                          {r.description.length > 120 ? r.description.slice(0, 120) + '…' : r.description}
                        </span>
                      ) : null}
                    </div>
                    <div className="fl-r">
                      <span className="fd-lk">@{r.author}</span>
                      <span className="fd-tm">{r.downloads} downloads</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 16 }}>Audit Reports</h3>
          <div className="fl">
            {Object.entries(grouped).map(([protocol, reports]) => (
              reports.map((a) => (
                <a key={a.file} href={a.file} target="_blank" rel="noopener noreferrer" className="ob-link-reset">
                  <div className="fr">
                    <div className="fl-l">
                      <span className="fsv fc">
                        <span className="dot"></span>
                        {a.protocol}
                      </span>
                      <span className="fd-d">{a.name}</span>
                    </div>
                    <div className="fl-r">
                      <span className="fd-lk">{a.auditor}</span>
                      <span className="fd-tm">{a.date}</span>
                    </div>
                  </div>
                </a>
              ))
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 16 }}>Community Resources</h3>
          <div className="pg">
            {resources.map((r) => (
              <div key={r.name} className="pi">
                <span className="pi-ic">{r.icon}</span>
                <div className="pi-nm">{r.name}</div>
                <div className="pi-ds">{r.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
