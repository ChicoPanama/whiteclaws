import { NextRequest, NextResponse } from 'next/server'
import type { Row } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/admin'
import { generateKeyPair } from '@/lib/crypto'
import { requireProtocolOwner, requireSessionUserId } from '@/lib/auth/protocol-guards'

export const dynamic = 'force-dynamic'

/**
 * POST /api/protocols/[slug]/rotate-key
 * Generate a new encryption keypair. Old findings remain readable with the old key.
 * Returns the new private key (shown once).
 */
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await requireSessionUserId()
    if (!session.ok) return session.res

    const supabase = createClient()

    const { data: protocol } = await supabase
      .from('protocols')
      .select('id')
      .eq('slug', params.slug!)
      .returns<Row<'protocols'>[]>().single()

    if (!protocol) return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })

    // Owner only: rotating encryption keys returns a private key (shown once).
    const authz = await requireProtocolOwner(session.userId, protocol.id)
    if (!authz.ok) return authz.res

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
