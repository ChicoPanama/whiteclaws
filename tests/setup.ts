/**
 * Jest Test Setup
 * Runs before all tests
 */

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// Verify required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

// Set test environment flags
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// Global test timeout
jest.setTimeout(30000)

// Suppress console logs in tests (optional)
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  }
}

console.log('🧪 WhiteClaws Test Suite Initialized')
console.log(`📍 API URL: ${process.env.NEXT_PUBLIC_API_URL}`)
console.log(`📊 Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
