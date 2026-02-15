/**
 * Jest Configuration for WhiteClaws Tests
 */

import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  // Path to Next.js app
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'node',
  
  // Test patterns
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.test.tsx',
  ],
  
  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Coverage
  collectCoverageFrom: [
    'lib/services/referral-tree.ts',
    'lib/services/referral-bonuses.ts',
    'lib/services/anti-sybil.ts',
    'lib/services/pyramid-detection.ts',
    'lib/services/rate-limiting.ts',
    'lib/services/quality-gates.ts',
    'app/api/agents/register/route.ts',
    'app/api/referral/**/route.ts',
  ],
  
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Timeouts
  testTimeout: 30000,  // 30 seconds for integration tests
  
  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
}

export default createJestConfig(config)
