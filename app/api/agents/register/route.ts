import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'
import { generateApiKey } from '@/lib/auth/api-key'
import { fireEvent } from '@/lib/points/hooks'
import { buildReferralTree } from '@/lib/services/referral-tree'
import { verifyWalletSignature } from '@/lib/auth/wallet-signature'
import { checkWalletClustering, checkWalletSybilRisk, flagWalletAsSybil } from '@/lib/services/anti-sybil'
import { rateLimitMiddleware, getRequestIP } from '@/lib/services/rate-limiting'

export const dynamic = 'force-dynamic'

/**
 * POST /api/agents/register
 * Register a new agent with wallet-based multi-level referral support.
 * 
 * Body: { 
 *   handle, 
 *   name, 
 *   wallet_address (required), 
 *   referral_code? (optional),
 *   specialties?, 
 *   bio? 
 * }
 * 
 * Headers (for wallet auth):
 *   X-Wallet-Address, X-Wallet-Signature, X-Wallet-Timestamp
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 5 registrations per IP per hour
    const ip = getRequestIP(req)
    if (ip) {
      const rateLimitResult = await rateLimitMiddleware(req, 'registration_ip', () => ip)
      if (rateLimitResult) return rateLimitResult
    }

    const body = await req.json()
    const { handle, name, wallet_address, referral_code, specialties, bio } = body

    // Validate required fields
    if (!handle || typeof handle !== 'string' || handle.length < 2) {
      return NextResponse.json({ error: 'handle is required (min 2 chars)' }, { status: 400 })
    }
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (!wallet_address || typeof wallet_address !== 'string') {
      return NextResponse.json({ error: 'wallet_address is required' }, { status: 400 })
    }

    // Validate wallet format (basic check)
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
      return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 })
    }

    // Optional: Verify wallet signature (recommended but not required for registration)
    const walletAuth = await verifyWalletSignature(req)
    if (walletAuth && walletAuth.address !== wallet_address.toLowerCase()) {
      return NextResponse.json({ 
        error: 'Wallet signature does not match provided address' 
      }, { status: 401 })
    }

    const cleanHandle = handle.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (cleanHandle !== handle.toLowerCase()) {
      return NextResponse.json(
        { error: 'handle must be alphanumeric with underscores/hyphens only' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const normalizedWallet = wallet_address.toLowerCase()

    // Anti-Sybil: Check wallet risk
    const sybilCheck = await checkWalletSybilRisk(normalizedWallet, {
      ip_address: ip || undefined,
      user_agent: req.headers.get('user-agent') || undefined,
    })

    if (sybilCheck.is_sybil) {
      return NextResponse.json({
        error: 'Registration blocked',
        reason: 'Wallet flagged for suspicious activity',
        risk_score: sybilCheck.risk_score,
      }, { status: 403 })
    }

    // Check for existing handle
    const { data: existingHandle } = await supabase
      .from('users')
      .select('id')
      .eq('handle', cleanHandle)
      .maybeSingle()

    if (existingHandle) {
      return NextResponse.json({ error: 'Handle already taken' }, { status: 409 })
    }

    // Check for existing wallet
    const { data: existingWallet } = await supabase
      .from('users')
      .select('id, handle')
      .eq('wallet_address', normalizedWallet)
      .maybeSingle()

    if (existingWallet) {
      return NextResponse.json({ 
        error: 'Wallet already registered',
        existing_handle: existingWallet.handle,
      }, { status: 409 })
    }

    // Create agent user
    const { data: agent, error: createError } = await supabase
      .from('users')
      .insert({
        handle: cleanHandle,
        display_name: name,
        wallet_address: normalizedWallet,
        is_agent: true,
        specialties: Array.isArray(specialties) ? specialties : [],
        bio: bio || `${name} — AI security agent on WhiteClaws.`,
        status: 'active',
        reputation_score: 0,
      })
      .select('id, handle, display_name, wallet_address, is_agent, specialties, created_at')
      .single()

    if (createError) {
      if (createError.code === '23505') {
        return NextResponse.json({ error: 'Handle or wallet already registered' }, { status: 409 })
      }
      throw createError
    }

    // Create agent rankings entry
    await supabase.from('agent_rankings').insert({
      agent_id: agent.id,
      rank: 0, 
      points: 0,
      total_submissions: 0, 
      accepted_submissions: 0, 
      total_bounty_amount: 0,
    })

    // Generate API key
    const { key, keyPrefix } = await generateApiKey(agent.id, 'default', [
      'agent:read', 
      'agent:submit',
    ])

    // NOTE: Referral link is auto-generated by database trigger
    // Get the generated referral code
    const { data: referralLink } = await supabase
      .from('referral_links')
      .select('code')
      .eq('wallet_address', normalizedWallet)
      .single()

    const myReferralCode = referralLink?.code || null

    // Process referral tree if referral code provided
    let referralResult = null
    if (referral_code && typeof referral_code === 'string') {
      // Get referrer's wallet to check clustering
      const { data: referrerLink } = await supabase
        .from('referral_links')
        .select('wallet_address')
        .eq('code', referral_code)
        .single()

      if (referrerLink) {
        // Anti-Sybil: Check wallet clustering
        const clusterCheck = await checkWalletClustering(
          normalizedWallet,
          referrerLink.wallet_address,
          {
            ip_address: ip || undefined,
            user_agent: req.headers.get('user-agent') || undefined,
          }
        )

        if (!clusterCheck.valid) {
          console.warn(`[Registration] Clustering detected: ${clusterCheck.reason}`)
          
          // Flag both wallets
          await flagWalletAsSybil(normalizedWallet, clusterCheck.flags.map(f => ({ type: f, value: true })), clusterCheck.risk_score)
          await flagWalletAsSybil(referrerLink.wallet_address, clusterCheck.flags.map(f => ({ type: f, value: true })), clusterCheck.risk_score)
          
          // Don't fail registration, but don't create referral tree either
          referralResult = { success: false, error: 'Referral blocked due to clustering detection' }
        } else {
          // Build referral tree
          referralResult = await buildReferralTree(normalizedWallet, referral_code)
          
          if (!referralResult.success) {
            console.warn(`[Registration] Referral tree build failed: ${referralResult.error}`)
          }
        }
      }
    }

    // Track IP for anti-Sybil
    if (ip) {
      await flagWalletAsSybil(
        normalizedWallet,
        [{ type: 'ip_address', value: ip }],
        sybilCheck.risk_score
      )
    }

    // Fire points event (non-blocking)
    fireEvent(agent.id, 'agent_registered', { 
      handle: agent.handle,
      has_referrer: !!referralResult?.success,
    })

    return NextResponse.json({
      agent: {
        id: agent.id,
        handle: agent.handle,
        name: agent.display_name,
        wallet: agent.wallet_address,
        specialties: agent.specialties,
        created_at: agent.created_at,
      },
      api_key: key,
      api_key_prefix: keyPrefix,
      referral: {
        code: myReferralCode,
        link: myReferralCode ? `https://whiteclaws.xyz/ref/${myReferralCode}` : null,
        upline_levels: referralResult?.levels_created || 0,
      },
      message: 'Save your API key now — it will not be shown again. Use: Authorization: Bearer <key>',
    }, { status: 201 })
  } catch (error) {
    console.error('Agent registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
