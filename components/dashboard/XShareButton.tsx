'use client'

import { useState, useCallback } from 'react'

interface XShareButtonProps {
  /** What kind of thing is being shared */
  variant: 'finding' | 'bounty' | 'milestone'
  /** Data for the share template */
  data: {
    protocolName?: string
    severity?: string
    referralCode?: string
    streakWeeks?: number
    submissions?: number
    accepted?: number
    bountyMax?: string
    bountySlug?: string
  }
  /** Is user X-verified? */
  isVerified?: boolean
  /** Compact button style */
  compact?: boolean
}

function buildTweetText(variant: string, data: XShareButtonProps['data']): string {
  const ref = data.referralCode ? `\nJoin → whiteclaws.xyz/ref/${data.referralCode}` : ''

  switch (variant) {
    case 'finding':
      return `🦞 Vulnerability accepted on @WhiteClawsSec\nProtocol: ${data.protocolName || 'Unknown'} | Severity: ${data.severity || 'N/A'} | Status: Accepted ✅${ref}\n#WhiteClaws #BugBounty #DeFiSecurity`

    case 'bounty':
      return `🦞 New bounty live on @WhiteClawsSec\n${data.protocolName || 'Protocol'} | Max: ${data.bountyMax || 'TBD'}\nFind vulnerabilities → whiteclaws.xyz/bounties/${data.bountySlug || ''}${ref}\n#WhiteClaws #BugBounty`

    case 'milestone':
      return `🦞 ${data.streakWeeks || 0} week streak on @WhiteClawsSec\n${data.submissions || 0} findings submitted | ${data.accepted || 0} accepted${ref}\n#WhiteClaws`

    default:
      return `🦞 Securing DeFi on @WhiteClawsSec${ref}\n#WhiteClaws #BugBounty`
  }
}

export default function XShareButton({ variant, data, isVerified, compact }: XShareButtonProps) {
  const [shared, setShared] = useState(false)

  const handleShare = useCallback(() => {
    const text = buildTweetText(variant, data)
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'width=550,height=420')
    setShared(true)

    // Fire share event (non-blocking) — only if we have a referral code (means user is registered)
    if (data.referralCode) {
      fetch('/api/points/record-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant, metadata: data }),
      }).catch(() => {})
    }
  }, [variant, data])

  if (!isVerified) {
    return null // Don't show share button if X not verified
  }

  return (
    <button
      onClick={handleShare}
      className="pr-cta-primary"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: compact ? 12 : 14,
        padding: compact ? '4px 10px' : '8px 16px',
        opacity: shared ? 0.7 : 1,
      }}
    >
      <span style={{ fontSize: compact ? 14 : 16 }}>𝕏</span>
      {shared ? 'Shared' : 'Share on X'}
    </button>
  )
}
