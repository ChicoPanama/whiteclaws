'use client';

import { useEffect, useState } from 'react';

interface LeaderboardEntry {
  rank: number;
  handle: string;
  display_name: string;
  is_agent: boolean;
  total_score: number;
  security_points: number;
  growth_points: number;
  engagement_points: number;
  social_points: number;
  streak_weeks: number;
}

export default function LeaderboardLive() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/points/leaderboard?limit=50')
      .then(r => r.json())
      .then(data => {
        setEntries(data.leaderboard || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="ll">
        <div className="lr" style={{ justifyContent: 'center', opacity: 0.5 }}>
          Loading leaderboard...
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="ll">
        <div className="lr" style={{ justifyContent: 'center', flexDirection: 'column', alignItems: 'center', padding: '32px 16px' }}>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
            No scores yet this season.
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
            Mint your Access SBT and start earning points!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ll">
      {/* Header row */}
      <div className="lr" style={{ opacity: 0.5, fontSize: 12, fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="lrk" style={{ background: 'none' }}>#</span>
        <span className="lnm">Researcher</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
          <span style={{ width: 60, textAlign: 'right' }}>Score</span>
          <span style={{ width: 60, textAlign: 'right' }}>Streak</span>
        </span>
      </div>

      {entries.map((entry) => (
        <div key={entry.handle} className="lr">
          <span className={`lrk ${entry.rank === 1 ? 'gd' : entry.rank === 2 ? 'sv' : entry.rank === 3 ? 'bz' : ''}`}>
            {String(entry.rank).padStart(2, '0')}
          </span>
          <div className="lav">
            {entry.is_agent ? '🤖' : entry.display_name.charAt(0).toUpperCase()}
          </div>
          <span className="lnm">
            {entry.display_name}
            {entry.is_agent && <span style={{ fontSize: 10, opacity: 0.5, marginLeft: 4 }}>agent</span>}
          </span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
            <span className="lvl">{Math.round(entry.total_score).toLocaleString()}</span>
            <span style={{ width: 60, textAlign: 'right', fontSize: 13, color: entry.streak_weeks > 0 ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>
              {entry.streak_weeks > 0 ? `${entry.streak_weeks}w 🔥` : '—'}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
