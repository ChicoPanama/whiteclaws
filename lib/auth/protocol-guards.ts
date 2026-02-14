import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import type { Row } from '@/lib/supabase/helpers'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

export type ProtocolWriteRole = 'owner' | 'admin'

export async function requireSessionUserId(): Promise<
  { ok: true; userId: string } | { ok: false; res: NextResponse }
> {
  const supabase = createServerClient()
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session?.user?.id) {
    return { ok: false, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { ok: true, userId: data.session.user.id }
}

export async function getProtocolIdBySlug(slug: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('protocols')
    .select('id')
    .eq('slug', slug)
    .returns<Row<'protocols'>[]>()
    .maybeSingle()
  return data?.id ?? null
}

export async function requireProtocolMember(
  userId: string,
  protocolId: string
): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  const supabase = createAdminClient()

  // Prefer protocol_members if present in the DB; fall back to protocol_access.
  try {
    const { data: member } = await supabase
      .from('protocol_members')
      .select('role')
      .eq('protocol_id', protocolId)
      .eq('user_id', userId)
      .returns<Row<'protocol_members'>[]>()
      .maybeSingle()
    if (member) return { ok: true }
  } catch {
    // ignore (table may not exist depending on migration path)
  }

  const { data: access } = await supabase
    .from('protocol_access')
    .select('access_level')
    .eq('protocol_id', protocolId)
    .eq('user_id', userId)
    .returns<Array<{ access_level: string | null }>>()
    .maybeSingle()

  if (!access) return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { ok: true }
}

export async function requireProtocolAdmin(
  userId: string,
  protocolId: string
): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  const supabase = createAdminClient()

  try {
    const { data: member } = await supabase
      .from('protocol_members')
      .select('role')
      .eq('protocol_id', protocolId)
      .eq('user_id', userId)
      .returns<Row<'protocol_members'>[]>()
      .maybeSingle()
    if (member && (member.role === 'owner' || member.role === 'admin')) return { ok: true }
  } catch {
    // ignore
  }

  const { data: access } = await supabase
    .from('protocol_access')
    .select('access_level')
    .eq('protocol_id', protocolId)
    .eq('user_id', userId)
    .returns<Array<{ access_level: string | null }>>()
    .maybeSingle()

  if (access?.access_level === 'admin') return { ok: true }
  return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
}

export async function requireProtocolOwner(
  userId: string,
  protocolId: string
): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  const supabase = createAdminClient()

  // First: explicit owner membership
  try {
    const { data: member } = await supabase
      .from('protocol_members')
      .select('role')
      .eq('protocol_id', protocolId)
      .eq('user_id', userId)
      .returns<Row<'protocol_members'>[]>()
      .maybeSingle()
    if (member?.role === 'owner') return { ok: true }
  } catch {
    // ignore
  }

  // Fallback: protocols.owner_id field (present in app types)
  const { data: proto } = await supabase
    .from('protocols')
    .select('owner_id')
    .eq('id', protocolId)
    .returns<Row<'protocols'>[]>()
    .maybeSingle()

  if (proto?.owner_id && proto.owner_id === userId) return { ok: true }
  return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
}

export function getForwardedIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for') || ''
  return forwardedFor.split(',')[0]?.trim() || 'unknown'
}
