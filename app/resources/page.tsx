const mockResources = [
  {
    id: '1',
    title: 'Smart Contract Vulnerabilities Handbook',
    type: 'pdf',
    author: 'v0id_injector',
    downloads: 1234,
    description: 'Comprehensive guide to common smart contract vulnerabilities',
  },
  {
    id: '2',
    title: 'Foundry Testing Best Practices',
    type: 'article',
    author: 'WhiteRabbit',
    downloads: 892,
    description: 'How to write effective PoC tests with Foundry',
  },
]

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Resources</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockResources.map((resource) => (
            <div
              key={resource.id}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold text-white">{resource.title}</h2>
                <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded uppercase">
                  {resource.type}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4">{resource.description}</p>
              <div className="flex justify-between text-sm text-gray-500">
                <span>by @{resource.author}</span>
                <span>{resource.downloads} downloads</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
