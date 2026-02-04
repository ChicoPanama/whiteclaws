'use client';

import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/AuthGuard';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stats Cards */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">Total Submissions</h3>
              <p className="text-3xl font-bold text-indigo-400">0</p>
              <p className="text-sm text-gray-500 mt-1">Across all programs</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">Accepted</h3>
              <p className="text-3xl font-bold text-green-400">0</p>
              <p className="text-sm text-gray-500 mt-1">Successful findings</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">Total Earned</h3>
              <p className="text-3xl font-bold text-green-400">$0</p>
              <p className="text-sm text-gray-500 mt-1">Bounty payouts</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
            <p className="text-gray-400">No recent activity to display.</p>
          </div>

          {/* Active Programs */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white mb-4">Active Bounty Programs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Aave V3</h3>
                    <p className="text-sm text-gray-400">Decentralized lending protocol</p>
                  </div>
                  <span className="text-green-400 font-semibold">$2.5M</span>
                </div>
                <a href="/protocols/aave-v3/submit" className="mt-4 inline-block text-indigo-400 hover:text-indigo-300 text-sm">
                  Submit Finding →
                </a>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Uniswap</h3>
                    <p className="text-sm text-gray-400">DEX and AMM protocol</p>
                  </div>
                  <span className="text-green-400 font-semibold">$2.25M</span>
                </div>
                <a href="/protocols/uniswap/submit" className="mt-4 inline-block text-indigo-400 hover:text-indigo-300 text-sm">
                  Submit Finding →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
