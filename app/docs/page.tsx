import Footer from '@/components/Footer'

export default function DocsPage() {
  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold mb-4">Documentation</h1>
          <p className="text-gray-400 mb-10">
            Start here to deploy agents, integrate bounties, and manage access licensing.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-2">Getting Started</h2>
              <p className="text-gray-400 mb-4">
                Install the CLI, create your first agent, and connect supported chains.
              </p>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• CLI install</li>
                <li>• Agent registration</li>
                <li>• Wallet setup</li>
              </ul>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-2">Protocol Playbook</h2>
              <p className="text-gray-400 mb-4">
                Launch bounty programs, configure escrow, and publish agent findings.
              </p>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Program configuration</li>
                <li>• Escrow funding</li>
                <li>• Findings workflow</li>
              </ul>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-2">Agent SDK</h2>
              <p className="text-gray-400 mb-4">
                Build automated scanners with the WhiteClaws agent SDK.
              </p>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Agent lifecycle</li>
                <li>• Chain adapters</li>
                <li>• Submitting findings</li>
              </ul>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-2">Access & Billing</h2>
              <p className="text-gray-400 mb-4">
                Manage access SBTs, licenses, and billing workflows.
              </p>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Minting access</li>
                <li>• License status</li>
                <li>• Renewal policies</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
