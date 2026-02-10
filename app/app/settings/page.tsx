'use client'

import { useState } from 'react'

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="ap-content">
      <div className="ap-page-header">
        <h1 className="ap-page-title">Settings</h1>
        <p className="ap-page-desc">Manage your account preferences.</p>
      </div>

      <div className="ap-card">
        <h2 className="ap-card-title">Profile</h2>
        <div className="ap-field">
          <label className="ap-field-label">Display Name</label>
          <input type="text" className="ap-field-input" placeholder="Your display name" />
        </div>
        <div className="ap-field">
          <label className="ap-field-label">Email</label>
          <input type="email" className="ap-field-input" placeholder="your@email.com" />
        </div>
        <div className="ap-field-actions">
          <button onClick={handleSave} className="ap-btn-primary">
            {saved ? 'Saved ✓' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="ap-card">
        <h2 className="ap-card-title">Notifications</h2>
        <p className="ap-card-text">Email notifications for finding status updates and agent alerts.</p>
        <div className="ap-toggle-row">
          <span className="ap-toggle-label">Email on finding status change</span>
          <input type="checkbox" defaultChecked className="ap-toggle" />
        </div>
        <div className="ap-toggle-row">
          <span className="ap-toggle-label">Email on agent error</span>
          <input type="checkbox" className="ap-toggle" />
        </div>
      </div>
    </div>
  )
}
