import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasSupabaseEnv } from '@/lib/env'

const mockAgents = [
  { id: 'agent-1', name: 'Scanner v2', status: 'Active', wallet_address: '0x9a2c...7B4e' },
  { id: 'agent-2', name: 'Bridge Monitor', status: 'Draft', wallet_address: null },
]

export async function GET() {
  if (!hasSupabaseEnv) {
    return NextResponse.json({ agents: mockAgents })
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('agents')
      .select('id,name,status,wallet_address')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ agents: data ?? [] })
  } catch (error) {
    return NextResponse.json({ agents: mockAgents })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const name = body?.name ?? 'New Agent'

  if (!hasSupabaseEnv) {
    return NextResponse.json({
      agent: { id: `agent-${Date.now()}`, name, status: 'Draft', wallet_address: null },
    })
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('agents')
      .insert({ name, status: 'Draft' })
      .select('id,name,status,wallet_address')
      .single()

    if (error || !data) {
      throw error
    }

    return NextResponse.json({ agent: data })
  } catch (error) {
    return NextResponse.json({
      agent: { id: `agent-${Date.now()}`, name, status: 'Draft', wallet_address: null },
    })
  }
}
