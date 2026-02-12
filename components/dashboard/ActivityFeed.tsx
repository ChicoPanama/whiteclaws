'use client';

import { useEffect, useState } from 'react';

interface EventItem {
  id: string;
  event_type: string;
  points: number;
  created_at: string;
  metadata?: Record<string, any>;
}

const EVENT_LABELS: Record<string, { icon: string; label: string }> = {
  finding_submitted: { icon: '🔍', label: 'Finding Submitted' },
  finding_accepted: { icon: '✅', label: 'Finding Accepted' },
  finding_paid: { icon: '💰', label: 'Bounty Paid' },
  encrypted_report: { icon: '🔐', label: 'Encrypted Report' },
  critical_finding: { icon: '🚨', label: 'Critical Finding' },
  poc_provided: { icon: '📋', label: 'PoC Provided' },
  protocol_registered: { icon: '🏗️', label: 'Protocol Registered' },
  bounty_created: { icon: '💎', label: 'Bounty Created' },
  bounty_funded: { icon: '🏦', label: 'Bounty Funded' },
  scope_published: { icon: '📄', label: 'Scope Published' },
  sbt_minted: { icon: '🦞', label: 'SBT Minted' },
  sbt_minted_early: { icon: '⭐', label: 'Early Supporter' },
  agent_registered: { icon: '🤖', label: 'Agent Registered' },
  weekly_active: { icon: '📅', label: 'Weekly Active' },
  weekly_submission: { icon: '📤', label: 'Weekly Submission' },
  streak_bonus: { icon: '🔥', label: 'Streak Bonus' },
  heartbeat_active: { icon: '💓', label: 'Heartbeat' },
  x_claimed: { icon: '𝕏', label: 'X Claimed' },
  x_share_finding: { icon: '📢', label: 'Shared on X' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActivityFeed({ apiKey, limit = 10 }: { apiKey?: string; limit?: number }) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!apiKey) { setLoading(false); return; }
    fetch(`/api/points/history?limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
      .then(r => r.json())
      .then(d => { setEvents(d.events || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [apiKey, limit]);

  if (loading) {
    return (
      <div className="ap-stat-card" style={{ gridColumn: '1 / -1' }}>
        <p className="ap-stat-label">Recent Activity</p>
        <p className="wc-field-helper">Loading...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="ap-stat-card" style={{ gridColumn: '1 / -1' }}>
        <p className="ap-stat-label">Recent Activity</p>
        <p className="wc-field-helper">No activity yet. Submit a finding to start earning points!</p>
      </div>
    );
  }

  return (
    <div className="ap-stat-card" style={{ gridColumn: '1 / -1' }}>
      <p className="ap-stat-label" style={{ marginBottom: 12 }}>Recent Activity</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {events.map((event) => {
          const meta = EVENT_LABELS[event.event_type] || { icon: '•', label: event.event_type };
          return (
            <div
              key={event.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{meta.icon}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{meta.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#22c55e' }}>
                  +{event.points}
                </span>
                <span className="wc-field-helper" style={{ margin: 0, fontSize: 12, minWidth: 50, textAlign: 'right' }}>
                  {timeAgo(event.created_at)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
