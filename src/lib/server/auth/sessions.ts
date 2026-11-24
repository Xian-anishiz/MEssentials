import { db } from '../db/client';
import { sessions } from '../db/schema';
import { eq, lt } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { createHash } from 'crypto';

/**
 * Session management for cookie-based authentication.
 * 
 * Handles creation, validation, and deletion of user sessions.
 * Sessions are stored in the database with SHA-256 hashed tokens.
 * Tokens are stored in HTTP-only cookies with 30-day expiry.
 * 
 * SPEC.md §5.2: sessions table with id_hash (sha256 of session token)
 * SECURITY: Tokens are never stored in plaintext - only SHA-256 hashes.
 */

/**
 * Session token byte length
 */
const TOKEN_BYTES = 32;

/**
 * Session expiry in seconds (30 days)
 */
const SESSION_EXPIRY_SECONDS = 30 * 24 * 60 * 60;

/**
 * Generate a secure random session token.
 */
export function generateSessionToken(): string {
  return randomBytes(TOKEN_BYTES).toString('hex');
}

/**
 * Hash a session token using SHA-256 for storage.
 * The database stores the hash, not the raw token.
 */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Create a new session for a user.
 * @param userId - The user's UUID
 * @param userAgent - Optional user agent string
 * @param ip - Optional IP address
 * @returns The plain session token (to be set in cookie)
 */
export async function createSession(
  userId: string,
  userAgent?: string,
  ip?: string
): Promise<string> {
  const token = generateSessionToken();
  const idHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_SECONDS * 1000);

  await db.insert(sessions).values({
    idHash,
    userId,
    expiresAt,
    userAgent,
    ip,
  });

  return token;
}

/**
 * Validate a session token and return the user ID if valid.
 * @param token - The plain session token from the cookie
 * @returns The user ID if session is valid, null otherwise
 */
export async function validateSession(token: string): Promise<string | null> {
  const idHash = hashSessionToken(token);

  const result = await db
    .select({ userId: sessions.userId, expiresAt: sessions.expiresAt })
    .from(sessions)
    .where(eq(sessions.idHash, idHash))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const session = result[0];
  if (session.expiresAt < new Date()) {
    // Session expired, delete it
    await db.delete(sessions).where(eq(sessions.idHash, idHash));
    return null;
  }

  return session.userId;
}

/**
 * Delete a session by token (logout).
 * @param token - The plain session token
 */
export async function deleteSession(token: string): Promise<void> {
  const idHash = hashSessionToken(token);
  await db.delete(sessions).where(eq(sessions.idHash, idHash));
}

/**
 * Delete all sessions for a user (logout from all devices).
 * @param userId - The user's UUID
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/**
 * Delete expired sessions (cleanup).
 */
export async function deleteExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

/**
 * Session cookie options.
 */
export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: SESSION_EXPIRY_SECONDS,
  path: '/',
};

/**
 * Session cookie name.
 */
export const SESSION_COOKIE_NAME = 'messentials_session';