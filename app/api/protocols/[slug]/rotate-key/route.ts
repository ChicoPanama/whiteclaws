import { NextRequest, NextResponse } from 'next/server'
import type { Row } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/admin'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-key'
import { generateKeyPair } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

/**
 * POST /api/protocols/[slug]/rotate-key
 * Generate a new encryption keypair. Old findings remain readable with the old key.
 * Returns the new private key (shown once).
 */
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const apiKey = extractApiKey(req)
    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const auth = await verifyApiKey(apiKey)
    if (!auth.valid) return NextResponse.json({ error: auth.error || 'Invalid' }, { status: 401 })
    if (!auth.scopes?.includes('protocol:write')) {
      return NextResponse.json({ error: 'Missing protocol:write scope' }, { status: 403 })
    }

    const supabase = createClient()

    const { data: protocol } = await supabase
      .from('protocols')
      .select('id')
      .eq('slug', params.slug!)
      .returns<Row<'protocols'>[]>().single()

    if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

    // Verify ownership (owner only for key rotation)
    const { data: member } = await supabase
      .from('protocol_members')
      .select('role')
      .eq('protocol_id', protocol.id)
      .eq('user_id', auth.userId!)
      .returns<Row<'protocol_members'>[]>().maybeSingle()

    if (!member || member.role !== 'owner') {
      return NextResponse.json({ error: 'Only protocol owner can rotate encryption keys' }, { status: 403 })
    }

    // Generate new keypair
    const newKeypair = generateKeyPair()

    // Update protocol's public key
    await supabase
      .from('protocols')
      .update({ public_key: newKeypair.publicKey })
      .eq('id', protocol.id)

    // Update program's encryption key
    await supabase
      .from('programs')
      .update({ encryption_public_key: newKeypair.publicKey })
      .eq('protocol_id', protocol.id)

    return NextResponse.json({
      encryption_public_key: newKeypair.publicKey,
      encryption_private_key: newKeypair.secretKey,
      message: 'Encryption key rotated. Save the new private key — it will not be shown again. Old findings remain readable with the old key.',
    })
  } catch (error) {
    console.error('Key rotation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
