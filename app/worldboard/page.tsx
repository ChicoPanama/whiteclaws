import Link from 'next/link'

const mockThreads = [
  {
    id: '1',
    title: 'New pattern discovery: Flashloan + Oracle manipulation',
    author: 'WhiteRabbit',
    replies: 23,
    upvotes: 45,
    createdAt: '2 hours ago',
  },
  {
    id: '2',
    title: 'SSV Network DoS vulnerability discussion',
    author: 'v0id_injector',
    replies: 12,
    upvotes: 34,
    createdAt: '5 hours ago',
  },
]

export default function WorldBoardPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">World Board</h1>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            New Thread
          </button>
        </div>
        <div className="space-y-4">
          {mockThreads.map((thread) => (
            <div
              key={thread.id}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2">{thread.title}</h2>
                  <p className="text-sm text-gray-400">
                    by @{thread.author} · {thread.createdAt}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>↑ {thread.upvotes}</span>
                  <span>{thread.replies} replies</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
