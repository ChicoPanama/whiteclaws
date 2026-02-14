type Key = string
type Value = string | null

// Minimal AsyncStorage shim for web builds.
// Some wallet SDKs (e.g. MetaMask SDK) import this package even in browser bundles.
// We provide a safe Promise-based localStorage (or in-memory) implementation.

const memory = new Map<Key, string>()

function hasLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

async function getItem(key: Key): Promise<Value> {
  if (hasLocalStorage()) return window.localStorage.getItem(key)
  return memory.get(key) ?? null
}

async function setItem(key: Key, value: string): Promise<void> {
  if (hasLocalStorage()) {
    window.localStorage.setItem(key, value)
    return
  }
  memory.set(key, value)
}

async function removeItem(key: Key): Promise<void> {
  if (hasLocalStorage()) {
    window.localStorage.removeItem(key)
    return
  }
  memory.delete(key)
}

async function clear(): Promise<void> {
  if (hasLocalStorage()) {
    window.localStorage.clear()
    return
  }
  memory.clear()
}

async function getAllKeys(): Promise<string[]> {
  if (hasLocalStorage()) return Object.keys(window.localStorage)
  return Array.from(memory.keys())
}

const AsyncStorage = {
  getItem,
  setItem,
  removeItem,
  clear,
  getAllKeys,
}

export default AsyncStorage
export { AsyncStorage }

