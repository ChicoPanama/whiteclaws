import { cn, formatDate, shortenAddress, slugify, generateId } from '@/lib/utils'

describe('Utils Module', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('class1', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      const condition = true
      const result = cn('base', condition && 'conditional')
      expect(result).toBe('base conditional')
    })

    it('should handle falsy values', () => {
      const result = cn('class1', null, undefined, false, '', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should merge tailwind classes correctly', () => {
      const result = cn('px-2 py-1', 'px-4')
      expect(result).toBe('py-1 px-4')
    })

    it('should handle array inputs', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('should handle object inputs', () => {
      const result = cn({ class1: true, class2: false, class3: true })
      expect(result).toBe('class1 class3')
    })
  })

  describe('formatDate', () => {
    it('should format date string correctly', () => {
      const date = '2024-01-15'
      const result = formatDate(date)
      expect(result).toContain('Jan')
      expect(result).toContain('15')
      expect(result).toContain('2024')
    })

    it('should format Date object correctly', () => {
      const date = new Date('2024-06-20')
      const result = formatDate(date)
      expect(result).toContain('Jun')
      expect(result).toContain('20')
      expect(result).toContain('2024')
    })

    it('should handle ISO date strings', () => {
      const date = '2024-12-25T10:30:00.000Z'
      const result = formatDate(date)
      expect(result).toContain('Dec')
      expect(result).toContain('2024')
    })

    it('should handle different date formats', () => {
      const date1 = formatDate('2024-03-01')
      const date2 = formatDate('2024-07-15')
      
      expect(date1).toContain('Mar')
      expect(date2).toContain('Jul')
    })
  })

  describe('shortenAddress', () => {
    it('should shorten Ethereum address correctly', () => {
      const address = '0x1234567890123456789012345678901234567890'
      const result = shortenAddress(address)
      expect(result).toBe('0x1234...7890')
    })

    it('should handle empty string', () => {
      const result = shortenAddress('')
      expect(result).toBe('')
    })

    it('should handle short addresses', () => {
      const address = '0x1234'
      const result = shortenAddress(address)
      expect(result).toBe('0x1234...1234')
    })

    it('should handle addresses with lowercase', () => {
      const address = '0xabcdef1234567890abcdef1234567890abcdef12'
      const result = shortenAddress(address)
      expect(result).toBe('0xabcd...ef12')
    })

    it('should handle addresses with uppercase', () => {
      const address = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12'
      const result = shortenAddress(address)
      expect(result).toBe('0xABCD...EF12')
    })

    it('should handle null/undefined gracefully', () => {
      expect(shortenAddress(null as unknown as string)).toBe('')
      expect(shortenAddress(undefined as unknown as string)).toBe('')
    })
  })

  describe('slugify', () => {
    it('should convert string to slug', () => {
      const result = slugify('Hello World')
      expect(result).toBe('hello-world')
    })

    it('should handle multiple spaces', () => {
      const result = slugify('Hello    World')
      expect(result).toBe('hello-world')
    })

    it('should handle special characters', () => {
      const result = slugify('Hello @#$% World!')
      expect(result).toBe('hello-world')
    })

    it('should handle leading and trailing dashes', () => {
      const result = slugify('-Hello World-')
      expect(result).toBe('hello-world')
    })

    it('should handle empty string', () => {
      const result = slugify('')
      expect(result).toBe('')
    })

    it('should handle numbers', () => {
      const result = slugify('Test 123')
      expect(result).toBe('test-123')
    })

    it('should handle mixed case', () => {
      const result = slugify('HeLLo WoRLd')
      expect(result).toBe('hello-world')
    })

    it('should handle protocol names', () => {
      const result1 = slugify('SSV Network')
      expect(result1).toBe('ssv-network')
      
      const result2 = slugify('Uniswap V3')
      expect(result2).toBe('uniswap-v3')
    })
  })

  describe('generateId', () => {
    it('should generate a string', () => {
      const result = generateId()
      expect(typeof result).toBe('string')
    })

    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })

    it('should generate alphanumeric strings', () => {
      const result = generateId()
      expect(result).toMatch(/^[a-z0-9]+$/)
    })

    it('should generate IDs of reasonable length', () => {
      const result = generateId()
      expect(result.length).toBeGreaterThan(5)
      expect(result.length).toBeLessThan(20)
    })

    it('should not contain decimal points', () => {
      const result = generateId()
      expect(result).not.toContain('.')
    })
  })
})
