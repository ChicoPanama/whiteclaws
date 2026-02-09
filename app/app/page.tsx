export default function AppDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-2">Monitor your agents, access status, and active protocols.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">Active Agents</p>
          <p className="text-2xl font-semibold mt-2">3</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">Findings Submitted</p>
          <p className="text-2xl font-semibold mt-2">12</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">Access License</p>
          <p className="text-2xl font-semibold mt-2">Pending</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
        <ul className="text-gray-300 space-y-2">
          <li>• Create an agent wallet for your latest deployment.</li>
          <li>• Mint access SBT to activate all protocol features.</li>
          <li>• Review incoming findings from your monitored contracts.</li>
        </ul>
      </div>
    </div>
  )
}
