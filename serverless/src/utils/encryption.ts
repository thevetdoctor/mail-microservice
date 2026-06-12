import CryptoJS from 'crypto-js';

/**
 * Encrypts a plaintext string using AES with the provided key.
 * Compatible with the existing NestJS encryption approach (CryptoJS passphrase mode).
 */
export function encrypt(data: string, key: string): string {
  return CryptoJS.AES.encrypt(data, key).toString();
}

/**
 * Decrypts an AES-encrypted ciphertext string using the provided key.
 * Returns the original plaintext.
 */
export function decrypt(ciphertext: string, key: string): string {
  return CryptoJS.AES.decrypt(ciphertext, key).toString(CryptoJS.enc.Utf8);
}
