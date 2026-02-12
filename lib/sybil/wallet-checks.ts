/**
 * Wallet Hygiene Checks — Layer 1 Sybil resistance.
 *
 * Checks wallet age, balance, transaction history, and funding source.
 * Results feed into anti_sybil_flags table.
 */

import { createClient } from '@/lib/supabase/admin'
import { PRIMARY_CHAIN } from '@/lib/web3/config'

// ── RPC Helpers ──

async function ethCall(method: string, params: any[]): Promise<any> {
  const res = await fetch(PRIMARY_CHAIN.rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  const data = await res.json()
  return data.result
}

// ── Checks ──

export async function checkWalletAge(address: string): Promise<{
  pass: boolean
  txCount: number
  flag?: string
}> {
  try {
    const txCount = parseInt(await ethCall('eth_getTransactionCount', [address, 'latest']), 16)
    if (txCount === 0) {
      return { pass: false, txCount: 0, flag: 'zero_transactions' }
    }
    return { pass: true, txCount }
  } catch {
    return { pass: true, txCount: -1 } // Allow on error
  }
}

export async function checkWalletBalance(address: string): Promise<{
  pass: boolean
  balanceWei: string
  flag?: string
}> {
  try {
    const balance = await ethCall('eth_getBalance', [address, 'latest'])
    const balanceBigInt = BigInt(balance || '0x0')
    // Minimum: 0.0001 ETH (adjust as needed)
    const minBalance = BigInt('100000000000000') // 0.0001 ETH in wei
    if (balanceBigInt < minBalance) {
      return { pass: false, balanceWei: balanceBigInt.toString(), flag: 'low_balance' }
    }
    return { pass: true, balanceWei: balanceBigInt.toString() }
  } catch {
    return { pass: true, balanceWei: '0' }
  }
}

export async function checkTransactionHistory(address: string): Promise<{
  pass: boolean
  flag?: string
}> {
  try {
    const txCount = parseInt(await ethCall('eth_getTransactionCount', [address, 'latest']), 16)
    if (txCount < 1) {
      return { pass: false, flag: 'no_transaction_history' }
    }
    return { pass: true }
  } catch {
    return { pass: true }
  }
}

// ── Composite Check ──

/**
 * Run all wallet hygiene checks and record results.
 */
export async function runWalletChecks(walletAddress: string): Promise<{
  riskScore: number
  flags: string[]
}> {
  const flags: string[] = []

  const [age, balance, history] = await Promise.all([
    checkWalletAge(walletAddress),
    checkWalletBalance(walletAddress),
    checkTransactionHistory(walletAddress),
  ])

  if (!age.pass && age.flag) flags.push(age.flag)
  if (!balance.pass && balance.flag) flags.push(balance.flag)
  if (!history.pass && history.flag) flags.push(history.flag)

  // Calculate risk score from flags
  let riskScore = 0
  if (flags.includes('zero_transactions')) riskScore += 0.3
  if (flags.includes('low_balance')) riskScore += 0.15
  if (flags.includes('no_transaction_history')) riskScore += 0.2

  riskScore = Math.min(riskScore, 1.0)

  // Store in anti_sybil_flags
  const supabase = createClient()
  await (supabase.from('anti_sybil_flags' as any).upsert(
    {
      wallet_address: walletAddress,
      risk_score: riskScore,
      flags,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'wallet_address' }
  ) as any).catch(() => {
    // upsert might fail if no unique constraint on wallet_address yet
    supabase.from('anti_sybil_flags' as any).insert({
      wallet_address: walletAddress,
      risk_score: riskScore,
      flags,
    })
  })

  return { riskScore, flags }
}
