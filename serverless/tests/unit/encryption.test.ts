import { encrypt, decrypt } from '../../src/utils/encryption';

describe('Encryption Module', () => {
  const testKey = 'my-secret-encryption-key';

  describe('encrypt', () => {
    it('should return a non-empty string', () => {
      const result = encrypt('hello', testKey);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should produce different ciphertext than the original', () => {
      const plaintext = 'sensitive-password';
      const result = encrypt(plaintext, testKey);
      expect(result).not.toBe(plaintext);
    });

    it('should produce different ciphertext for same input (due to random IV)', () => {
      const plaintext = 'password123';
      const result1 = encrypt(plaintext, testKey);
      const result2 = encrypt(plaintext, testKey);
      // CryptoJS AES uses a random salt each time, so outputs differ
      expect(result1).not.toBe(result2);
    });
  });

  describe('decrypt', () => {
    it('should recover the original plaintext', () => {
      const plaintext = 'my-smtp-password';
      const ciphertext = encrypt(plaintext, testKey);
      const result = decrypt(ciphertext, testKey);
      expect(result).toBe(plaintext);
    });

    it('should handle special characters', () => {
      const plaintext = 'p@$$w0rd!#%^&*()';
      const ciphertext = encrypt(plaintext, testKey);
      const result = decrypt(ciphertext, testKey);
      expect(result).toBe(plaintext);
    });

    it('should handle unicode strings', () => {
      const plaintext = '密码テスト🔐';
      const ciphertext = encrypt(plaintext, testKey);
      const result = decrypt(ciphertext, testKey);
      expect(result).toBe(plaintext);
    });

    it('should not recover plaintext when decrypted with wrong key', () => {
      const plaintext = 'secret';
      const ciphertext = encrypt(plaintext, testKey);
      // CryptoJS may throw "Malformed UTF-8 data" or return garbage with wrong key
      try {
        const result = decrypt(ciphertext, 'wrong-key');
        expect(result).not.toBe(plaintext);
      } catch (e) {
        // Throwing is also acceptable — means decryption failed
        expect(e).toBeDefined();
      }
    });
  });

  describe('round-trip compatibility', () => {
    it('should work with empty-ish keys (passphrase mode)', () => {
      const plaintext = 'data';
      const key = 'k';
      const ciphertext = encrypt(plaintext, key);
      expect(decrypt(ciphertext, key)).toBe(plaintext);
    });

    it('should work with long passwords', () => {
      const plaintext = 'a'.repeat(1000);
      const ciphertext = encrypt(plaintext, testKey);
      expect(decrypt(ciphertext, testKey)).toBe(plaintext);
    });
  });
});
