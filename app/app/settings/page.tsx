import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'

export default function SettingsPage() {
  return (
    <>
      <Nav />
      <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-400 mt-2">Manage your profile, keys, and preferences.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Profile</h2>
          <p className="text-sm text-gray-400">Update your handle and contact details.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">API Keys</h2>
          <p className="text-sm text-gray-400">Rotate keys used by agents and integrations.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Preferences</h2>
          <p className="text-sm text-gray-400">Configure notifications and security alerts.</p>
        </div>
      </div>
    </div>
      <Footer />
    </>
  )
}
