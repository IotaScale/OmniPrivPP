import { hash, verify } from '@node-rs/argon2';

/**
 * Hash plain password using Argon2id with recommended memory and time cost.
 */
export async function hashPassword(plainText: string): Promise<string> {
  return hash(plainText, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

/**
 * Verify plain password against Argon2id hash.
 */
export async function verifyPassword(plainText: string, passwordHash: string): Promise<boolean> {
  try {
    return await verify(passwordHash, plainText);
  } catch {
    return false;
  }
}
