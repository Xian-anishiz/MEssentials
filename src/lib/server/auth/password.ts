/**
 * Password hashing utilities using Argon2id.
 * 
 * Provides secure password hashing and verification for local password authentication.
 * Uses @node-rs/argon2 with recommended parameters (memory: 19MiB, iterations: 2, parallelism: 1).
 * 
 * SPEC.md §2: Password hashing - argon2id via @node-rs/argon2
 */

import { hash, verify } from '@node-rs/argon2';

/**
 * Password hashing using Argon2id.
 * SPEC.md §2: Password hashing - argon2id via @node-rs/argon2
 */

/**
 * Hash a plain-text password using Argon2id.
 * @param password - The plain-text password to hash
 * @returns The Argon2id hash string (includes algorithm, parameters, salt, and hash)
 */
export async function hashPassword(password: string): Promise<string> {
  // Argon2id with recommended parameters for 2024
  // memory: 19 MiB (19456 KiB), iterations: 2, parallelism: 1
  return hash(password, {
    algorithm: 2, // Argon2id
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
    outputLen: 32,
    secret: undefined,
  });
}

/**
 * Verify a plain-text password against an Argon2id hash.
 * @param password - The plain-text password to verify
 * @param hash - The stored Argon2id hash
 * @returns true if the password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await verify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Check if a password hash needs rehashing (e.g., parameters changed).
 * @param hash - The stored Argon2id hash
 * @returns true if the hash should be updated
 */
export function needsRehash(hash: string): boolean {
  // For now, we don't implement rehashing logic
  // Could be extended to check if hash parameters match current recommendations
  return false;
}