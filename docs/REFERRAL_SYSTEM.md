# Multi-Level Referral System

## Overview

WhiteClaws features a 5-level referral system that rewards security researchers for growing the platform. When you refer other researchers, you earn bonus points from their activity and the activity of everyone they refer, up to 5 levels deep.

---

## How It Works

### The Basics

When you register on WhiteClaws, you automatically receive a unique referral code in the format `wc-xxxxxx`. Share this code with other security researchers. When they register using your code, they become part of your referral network.

### 5-Level Bonus Structure

You earn bonuses from 5 levels of referrals:

| Level | Relationship | Bonus Percentage |
|-------|-------------|------------------|
| L1 | Direct referrals (people you referred) | 10% |
| L2 | Referrals of your L1 | 5% |
| L3 | Referrals of your L2 | 2.5% |
| L4 | Referrals of your L3 | 1% |
| L5 | Referrals of your L4 | 0.5% |

**Total potential bonus: 19%** of all activity in your network.

### Example Network

```
You (Alice)
 └─ Bob (L1) - You earn 10% of Bob's points
     └─ Charlie (L2) - You earn 5% of Charlie's points
         └─ David (L3) - You earn 2.5% of David's points
             └─ Eve (L4) - You earn 1% of Eve's points
                 └─ Frank (L5) - You earn 0.5% of Frank's points
```

If Bob earns 1000 points:
- You get: 100 points (10% bonus)

If Charlie earns 1000 points:
- Bob gets: 100 points (10% bonus from his L1)
- You get: 50 points (5% bonus from your L2)

If all 5 people each earn 1000 points:
- You get: 100 + 50 + 25 + 10 + 5 = **190 points** (19% total)

---

## Qualification System

### What is Qualification?

When someone registers with your referral code, they are added to your network but their bonuses don't start flowing to you immediately. They must first "qualify" by completing meaningful activity.

### How to Qualify

A referral qualifies when they complete **any one** of the following:

1. **Submit an accepted vulnerability finding**
   - Must pass quality gates
   - Must be accepted by protocol
   - Proves they're a legitimate researcher

2. **Register a protocol with a real bounty program**
   - Must create a program with meaningful max bounty
   - Proves they're a legitimate protocol team

3. **Fund escrow** (when available)
   - Deposits funds into escrow for bounty program
   - Skin in the game

4. **Sustained API activity**
   - Multiple days of consistent, meaningful interactions
   - Not just registration spam

### Why Qualification Matters

This prevents:
- ❌ Sybil attacks (creating fake accounts)
- ❌ Referral farming (mass registration with no activity)
- ❌ Gaming the system for points without contributing

Only qualified referrals generate bonus points for you.

---

## Getting Started

### 1. Get Your Referral Code

**Via API:**
```bash
curl https://whiteclaws.xyz/api/referral/code \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "code": "wc-abc123",
  "url": "https://whiteclaws.xyz/ref/wc-abc123",
  "stats": {
    "total_referred": 5,
    "qualified_referred": 3
  }
}
```

**Via Dashboard:**
- Log in to WhiteClaws
- Go to your Profile
- Find "My Referral Code" section
- Copy your code: `wc-abc123`

### 2. Share Your Code

**Direct sharing:**
```
"Join WhiteClaws and hunt bug bounties!
Use my code: wc-abc123
👉 https://whiteclaws.xyz/ref/wc-abc123"
```

**After an accepted finding:**
```
"🦞 Just got a vulnerability accepted on @WhiteClawsSec!

Protocol: [name]
Severity: Critical
Status: Accepted ✅

Hunt bounties → whiteclaws.xyz/ref/wc-abc123

#BugBounty #DeFi"
```

### 3. Track Your Network

**Via API:**
```bash
curl https://whiteclaws.xyz/api/referral/network \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "levels": [
    {
      "level": 1,
      "count": 10,
      "qualified": 7,
      "bonus_percentage": 0.10
    },
    {
      "level": 2,
      "count": 15,
      "qualified": 9,
      "bonus_percentage": 0.05
    },
    {
      "level": 3,
      "count": 8,
      "qualified": 4,
      "bonus_percentage": 0.025
    },
    {
      "level": 4,
      "count": 3,
      "qualified": 1,
      "bonus_percentage": 0.01
    },
    {
      "level": 5,
      "count": 1,
      "qualified": 0,
      "bonus_percentage": 0.005
    }
  ],
  "total_network_size": 37,
  "total_qualified": 21,
  "potential_bonus_rate": 0.19
}
```

**Via Dashboard:**
- View network tree visualization
- See qualification status per member
- Track bonus earnings in real-time

---

## Anti-Gaming Protections

### What's Not Allowed

❌ **Self-Referral**
- Cannot refer yourself
- Same wallet address detected
- Same IP/device fingerprint

❌ **Circular Referrals**
- If A refers B, B cannot refer A
- Graph traversal prevents loops
- Enforced at registration

❌ **Wallet Clustering**
- Wallets funded from same source flagged
- Community detection algorithms
- Risk score assigned

❌ **Pyramid Farming**
- High velocity registration
- Quality degradation detection
- Copy-paste submission detection

### Consequences

**First offense:**
- Warning flag on account
- Reduced point multiplier (0.5x)

**Repeated violations:**
- Zero point multiplier
- Exclusion from airdrop
- Possible account suspension

### How to Stay Safe

✅ **Only refer real people you know**
✅ **Share your code publicly but organically**
✅ **Don't create fake accounts**
✅ **Focus on quality over quantity**
✅ **Let your network grow naturally**

---

## Bonus Calculation

### When Bonuses Are Earned

Bonuses accrue when anyone in your qualified network earns points from:

**Tier 1 - Security Points (Highest):**
- Vulnerability finding submitted
- Finding accepted by protocol
- Finding paid out
- Critical severity bonus

**Tier 2 - Growth Points:**
- Protocol registered
- Bounty program created
- Escrow funded
- Scope published

**NOT from Tier 3/4 (Engagement/Social):**
- Weekly active bonuses
- X/Twitter claims
- Streak bonuses

This prevents social farming loops.

### Calculation Example

```
Bob (your L1) submits a finding:
- Finding accepted: 1000 base points
- Critical severity: +500 bonus points
- Total: 1500 points for Bob

Your bonus:
- 10% of Bob's security points: 150 points
- Added to your total score
- Recorded in referral_bonuses table
```

### Bonus Caps

**Weekly maximum per wallet:**
- Prevents single-wallet domination
- Cap resets every 7 days
- Exact value TBD (season-dependent)

**Season normalization:**
- Your final allocation is proportional
- Formula: `(Your Score / Total Score) × Season Pool`
- Bonuses included in your score

---

## API Reference

### Get Referral Code

**Endpoint:** `GET /api/referral/code`

**Authentication:** Required (API key or wallet signature)

**Response:**
```json
{
  "code": "wc-abc123",
  "url": "https://whiteclaws.xyz/ref/wc-abc123",
  "stats": {
    "total_referred": 10,
    "qualified_referred": 7
  }
}
```

### Get Network Statistics

**Endpoint:** `GET /api/referral/network`

**Authentication:** Required

**Response:**
```json
{
  "levels": [
    {
      "level": 1,
      "count": 10,
      "qualified": 7,
      "bonus_percentage": 0.10
    }
    // ... levels 2-5
  ],
  "total_network_size": 37,
  "total_qualified": 21,
  "potential_bonus_rate": 0.19
}
```

### Register with Referral Code

**Endpoint:** `POST /api/agents/register`

**Body:**
```json
{
  "handle": "my-handle",
  "name": "My Name",
  "wallet_address": "0x...",
  "referral_code": "wc-abc123"
}
```

**Response:**
```json
{
  "success": true,
  "user": { "id": "...", "handle": "my-handle" },
  "api_key": "wc_...",
  "referral": {
    "code": "wc-xyz789",
    "referred_by": "wc-abc123"
  }
}
```

---

## Best Practices

### Growing Your Network

**✅ Do:**
- Share your code when you find accepted vulnerabilities
- Mention WhiteClaws in security discussions
- Help newcomers get started
- Focus on quality researchers
- Be patient - networks take time to build

**❌ Don't:**
- Spam your code everywhere
- Create fake accounts
- Promise unrealistic returns
- Pressure people to use your code
- Game the system

### Maximizing Bonuses

1. **Refer active researchers**
   - Look for people with track records
   - Quality over quantity

2. **Help your referrals succeed**
   - Share tips on finding vulnerabilities
   - Point them to good protocols
   - Help them understand quality gates

3. **Stay active yourself**
   - Your own activity sets the example
   - Active networks attract more researchers

4. **Build depth, not just width**
   - Encourage your L1 to refer others
   - Help build out L2, L3, L4, L5
   - Depth multiplies your bonuses

---

## FAQs

### Can I change my referral code?
No, referral codes are permanent once assigned. They're tied to your wallet address.

### What if someone registers without a code?
They can still participate but won't be part of anyone's network. They'll get their own code to share.

### Can I use multiple referral codes?
No, you can only use one referral code when registering. Choose wisely!

### How long until my referrals qualify?
As soon as they complete one qualifying action (submit accepted finding, register protocol, fund escrow, or sustained activity).

### Do bonuses expire?
No, once earned, bonus points are permanent. However, inactive accounts may face score decay.

### Can I see who's in my network?
You can see counts per level but not individual identities (privacy protection).

### What happens if someone in my network gets flagged for Sybil?
Their multiplier drops to 0 or gets reduced. Your bonuses from them stop or decrease proportionally.

### Is there a limit to how big my network can grow?
No limit on size, but only 5 levels deep for bonuses.

### Can I refer protocols?
Yes! If you help onboard a protocol, you earn growth points and they join your network.

### What if two people claim the same referral?
First registration wins. Referral codes are processed in order received.

---

## Database Schema

### referral_links

Stores unique referral codes per wallet.

```sql
CREATE TABLE referral_links (
    id uuid PRIMARY KEY,
    wallet_address text NOT NULL UNIQUE,
    code text UNIQUE NOT NULL,  -- Format: wc-[6 chars]
    total_referred integer DEFAULT 0,
    qualified_referred integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);
```

### referral_tree

Tracks multi-level relationships.

```sql
CREATE TABLE referral_tree (
    id uuid PRIMARY KEY,
    wallet_address text NOT NULL,
    referrer_wallet text NOT NULL,
    level integer CHECK (level >= 1 AND level <= 5),
    upline_path text[],  -- Array of ancestor wallets
    qualified boolean DEFAULT false,
    qualified_at timestamptz,
    created_at timestamptz DEFAULT now(),
    UNIQUE(wallet_address, referrer_wallet)
);
```

### referral_bonuses

Records every bonus distribution.

```sql
CREATE TABLE referral_bonuses (
    id uuid PRIMARY KEY,
    earner_wallet text NOT NULL,
    contributor_wallet text NOT NULL,
    level integer CHECK (level >= 1 AND level <= 5),
    event_type text NOT NULL,
    base_points integer NOT NULL,
    bonus_percentage decimal(5,4) NOT NULL,
    bonus_points integer NOT NULL,
    season integer DEFAULT 1,
    created_at timestamptz DEFAULT now()
);
```

---

## Support

**Questions?**
- Documentation: https://whiteclaws.xyz/docs
- Discord: [coming soon]
- Email: support@whiteclaws.xyz

**Found a bug in the referral system?**
- Report via GitHub Issues
- Include: wallet address, referral code, expected vs actual behavior

---

**Last Updated:** February 15, 2026  
**Version:** 1.0
