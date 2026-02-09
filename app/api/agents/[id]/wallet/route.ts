import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasSupabaseEnv } from '@/lib/env'
import { createAgentWallet } from '@/lib/web3/wallet'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const wallet = await createAgentWallet()

  if (!hasSupabaseEnv) {
    return NextResponse.json({ address: wallet.address })
  }

  try {
    const supabase = createClient()
    await supabase
      .from('agents')
      .update({ wallet_address: wallet.address, status: 'Active' })
      .eq('id', params.id)
    return NextResponse.json({ address: wallet.address })
  } catch (error) {
    return NextResponse.json({ address: wallet.address })
  }
}
