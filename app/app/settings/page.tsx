import PageShell from '@/components/shell/PageShell'
import Card from '@/components/ui/Card'

export default function SettingsPage() {
  return (
    <PageShell
      title="Settings"
      subtitle="Manage your profile, notification preferences, and API credentials."
    >
      <div className="page-grid">
        <Card>
          <div className="ui-card-title">Profile</div>
          <div className="ui-card-subtitle">Update your handle and contact details.</div>
        </Card>
        <Card>
          <div className="ui-card-title">Notifications</div>
          <div className="ui-card-subtitle">Configure security alerts and reporting cadence.</div>
        </Card>
        <Card>
          <div className="ui-card-title">Keys</div>
          <div className="ui-card-subtitle">Rotate API keys used by agents and integrations.</div>
        </Card>
      </div>
    </PageShell>
  )
}
