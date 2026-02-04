import {
  generateKeyPair,
  encryptMessage,
  decryptMessage,
  generateSharedSecret,
} from '@/lib/crypto'

describe('Crypto Module', () => {
  describe('generateKeyPair', () => {
    it('should generate a keypair with publicKey and secretKey', () => {
      const keypair = generateKeyPair()
      
      expect(keypair).toHaveProperty('publicKey')
      expect(keypair).toHaveProperty('secretKey')
      expect(typeof keypair.publicKey).toBe('string')
      expect(typeof keypair.secretKey).toBe('string')
      expect(keypair.publicKey.length).toBeGreaterThan(0)
      expect(keypair.secretKey.length).toBeGreaterThan(0)
    })

    it('should generate unique keypairs each time', () => {
      const keypair1 = generateKeyPair()
      const keypair2 = generateKeyPair()
      
      expect(keypair1.publicKey).not.toBe(keypair2.publicKey)
      expect(keypair1.secretKey).not.toBe(keypair2.secretKey)
    })
  })

  describe('encryptMessage and decryptMessage', () => {
    it('should encrypt and decrypt a message successfully', () => {
      const sender = generateKeyPair()
      const recipient = generateKeyPair()
      const message = 'Hello, WhiteClaws!'
      
      const encrypted = encryptMessage(
        message,
        recipient.publicKey,
        sender.secretKey
      )
      
      expect(encrypted).toHaveProperty('ciphertext')
      expect(encrypted).toHaveProperty('nonce')
      expect(typeof encrypted.ciphertext).toBe('string')
      expect(typeof encrypted.nonce).toBe('string')
      
      const decrypted = decryptMessage(
        encrypted.ciphertext,
        encrypted.nonce,
        sender.publicKey,
        recipient.secretKey
      )
      
      expect(decrypted).toBe(message)
    })

    it('should handle empty messages', () => {
      const sender = generateKeyPair()
      const recipient = generateKeyPair()
      const message = ''
      
      const encrypted = encryptMessage(
        message,
        recipient.publicKey,
        sender.secretKey
      )
      
      const decrypted = decryptMessage(
        encrypted.ciphertext,
        encrypted.nonce,
        sender.publicKey,
        recipient.secretKey
      )
      
      expect(decrypted).toBe(message)
    })

    it('should handle special characters and unicode', () => {
      const sender = generateKeyPair()
      const recipient = generateKeyPair()
      const message = '🔐 Security @ WhiteClaws! <script>alert(1)</script> 中文 ñ'
      
      const encrypted = encryptMessage(
        message,
        recipient.publicKey,
        sender.secretKey
      )
      
      const decrypted = decryptMessage(
        encrypted.ciphertext,
        encrypted.nonce,
        sender.publicKey,
        recipient.secretKey
      )
      
      expect(decrypted).toBe(message)
    })

    it('should handle long messages', () => {
      const sender = generateKeyPair()
      const recipient = generateKeyPair()
      const message = 'A'.repeat(10000)
      
      const encrypted = encryptMessage(
        message,
        recipient.publicKey,
        sender.secretKey
      )
      
      const decrypted = decryptMessage(
        encrypted.ciphertext,
        encrypted.nonce,
        sender.publicKey,
        recipient.secretKey
      )
      
      expect(decrypted).toBe(message)
    })

    it('should return null when decrypting with wrong keys', () => {
      const sender = generateKeyPair()
      const recipient = generateKeyPair()
      const wrongRecipient = generateKeyPair()
      const message = 'Secret message'
      
      const encrypted = encryptMessage(
        message,
        recipient.publicKey,
        sender.secretKey
      )
      
      const decrypted = decryptMessage(
        encrypted.ciphertext,
        encrypted.nonce,
        sender.publicKey,
        wrongRecipient.secretKey
      )
      
      expect(decrypted).toBeNull()
    })

    it('should return null with tampered ciphertext', () => {
      const sender = generateKeyPair()
      const recipient = generateKeyPair()
      const message = 'Secret message'
      
      const encrypted = encryptMessage(
        message,
        recipient.publicKey,
        sender.secretKey
      )
      
      // Tamper with ciphertext
      const tamperedCiphertext = encrypted.ciphertext.slice(0, -1) + 'X'
      
      const decrypted = decryptMessage(
        tamperedCiphertext,
        encrypted.nonce,
        sender.publicKey,
        recipient.secretKey
      )
      
      expect(decrypted).toBeNull()
    })
  })

  describe('generateSharedSecret', () => {
    it('should generate consistent shared secrets between two parties', () => {
      const alice = generateKeyPair()
      const bob = generateKeyPair()
      
      const sharedAlice = generateSharedSecret(bob.publicKey, alice.secretKey)
      const sharedBob = generateSharedSecret(alice.publicKey, bob.secretKey)
      
      expect(sharedAlice).toBe(sharedBob)
    })

    it('should generate different shared secrets for different keypairs', () => {
      const alice = generateKeyPair()
      const bob = generateKeyPair()
      const charlie = generateKeyPair()
      
      const sharedAB = generateSharedSecret(bob.publicKey, alice.secretKey)
      const sharedAC = generateSharedSecret(charlie.publicKey, alice.secretKey)
      
      expect(sharedAB).not.toBe(sharedAC)
    })

    it('should generate different shared secrets with different keypairs', () => {
      const alice1 = generateKeyPair()
      const alice2 = generateKeyPair()
      const bob = generateKeyPair()
      
      const shared1 = generateSharedSecret(bob.publicKey, alice1.secretKey)
      const shared2 = generateSharedSecret(bob.publicKey, alice2.secretKey)
      
      expect(shared1).not.toBe(shared2)
    })
  })
})
