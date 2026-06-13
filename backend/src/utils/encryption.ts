import crypto from 'crypto';

const algorithm = process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm';
const encryptionKey = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'base64')
  : crypto.randomBytes(32);

/**
 * Encrypts data using AES-256-GCM
 * Returns encrypted data with IV and auth tag
 */
export function encryptField(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = (cipher as any).getAuthTag();

  // Combine IV, auth tag, and encrypted data
  const combined = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  return combined;
}

/**
 * Decrypts data encrypted with encryptField
 */
export function decryptField(encrypted: string): string {
  const parts = encrypted.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedData = parts[2];

  const decipher = crypto.createDecipheriv(algorithm, encryptionKey, iv);
  (decipher as any).setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Hash a passphrase using Argon2
 */
export async function hashPassphrase(passphrase: string): Promise<string> {
  const argon2 = await import('argon2');

  const options = {
    type: argon2.argon2id,
    timeCost: parseInt(process.env.ARGON2_TIME || '3', 10),
    memoryCost: parseInt(process.env.ARGON2_MEMORY || '65536', 10),
    parallelism: parseInt(process.env.ARGON2_PARALLELISM || '4', 10),
  };

  return argon2.hash(passphrase, options);
}

/**
 * Verify a passphrase against its hash
 */
export async function verifyPassphrase(passphrase: string, hash: string): Promise<boolean> {
  const argon2 = await import('argon2');

  try {
    return await argon2.verify(hash, passphrase);
  } catch {
    return false;
  }
}

/**
 * Generate a deterministic encryption key from a passphrase
 * This is for client-side encryption where user provides passphrase
 */
export async function deriveKeyFromPassphrase(passphrase: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(passphrase, salt, 100000, 32, 'sha256', (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}
