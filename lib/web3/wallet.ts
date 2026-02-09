import type { AgentWallet } from './types'

const ADDRESS_LENGTH = 40

function randomHex(size: number) {
  const bytes = new Uint8Array(size)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < size; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function createAgentWallet(): Promise<AgentWallet> {
  const address = `0x${randomHex(ADDRESS_LENGTH / 2)}`

  // TODO: Store private keys in a secure KMS/HSM. Never persist plaintext keys.
  return { address }
}
