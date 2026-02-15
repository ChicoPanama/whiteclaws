import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/me/protocol
 * Returns the protocol(s) the current user owns or is a member of.
 * Uses session cookie for authentication.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Look up user's protocol memberships (owner or admin roles)
    const { data: memberships, error: memberError } = await supabase
      .from('protocol_members')
      .select('protocol_id, role, protocols:protocol_id(id, slug, name, status, max_bounty)')
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .order('created_at', { ascending: false })

    if (memberError) {
      console.error('Protocol membership lookup error:', memberError)
      return NextResponse.json({ error: 'Failed to load protocols' }, { status: 500 })
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ protocols: [] }, { status: 200 })
    }

    // Flatten the nested protocol data
    const protocols = memberships.map((m: any) => ({
      id: m.protocols?.id,
      slug: m.protocols?.slug,
      name: m.protocols?.name,
      status: m.protocols?.status,
      max_bounty: m.protocols?.max_bounty,
      role: m.role,
    })).filter((p: any) => p.id)

    return NextResponse.json({ protocols }, { status: 200 })
  } catch (error) {
    console.error('Protocol me endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
