import fc from 'fast-check';
import { encrypt, decrypt } from '../../src/utils/encryption';

/**
 * Property 2: Encryption round-trip preserves password
 *
 * For any non-empty string used as an SMTP password, encrypting it with the
 * configured encryption key and then decrypting the result SHALL produce the
 * original string.
 *
 * **Validates: Requirements 4.2, 7.3, 7.4**
 */
describe('Encryption Property Tests', () => {
  it('Property 2: decrypt(encrypt(password, key), key) === password for all inputs', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (password, key) => {
          const ciphertext = encrypt(password, key);
          const decrypted = decrypt(ciphertext, key);
          return decrypted === password;
        }
      ),
      { numRuns: 100 }
    );
  });
});
