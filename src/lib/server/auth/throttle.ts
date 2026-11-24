/**
 * Login failure throttling utilities.
 * 
 * Tracks failed login attempts per user/IP and enforces temporary lockouts.
 * Uses the auth_throttle table (persistent, survives restarts - no Redis needed).
 * 
 * SPEC.md §5.2: auth_throttle table for durable password-login failure counters.
 */

import { db } from '../db/client';
import { authThrottle } from '../db/schema';
import { eq } from 'drizzle-orm';

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

export interface ThrottleStatus {
  locked: boolean;
  retryAfterSeconds: number;
}

export async function getThrottleStatus(key: string): Promise<ThrottleStatus> {
  const rows = await db
    .select({ lockedUntil: authThrottle.lockedUntil })
    .from(authThrottle)
    .where(eq(authThrottle.key, key))
    .limit(1);

  if (rows.length === 0) {
    return { locked: false, retryAfterSeconds: 0 };
  }

  const lockedUntil = rows[0].lockedUntil;
  if (!lockedUntil || lockedUntil.getTime() <= Date.now()) {
    return { locked: false, retryAfterSeconds: 0 };
  }

  return {
    locked: true,
    retryAfterSeconds: Math.ceil((lockedUntil.getTime() - Date.now()) / 1000),
  };
}

export async function recordLoginFailure(key: string): Promise<void> {
  const now = new Date();
  const rows = await db
    .select({
      failures: authThrottle.failures,
      windowStartedAt: authThrottle.windowStartedAt,
    })
    .from(authThrottle)
    .where(eq(authThrottle.key, key))
    .limit(1);

  if (rows.length === 0) {
    await db.insert(authThrottle).values({
      key,
      failures: 1,
      windowStartedAt: now,
      lockedUntil: null,
    });
    return;
  }

  const row = rows[0];
  const windowExpired = now.getTime() - row.windowStartedAt.getTime() > WINDOW_MS;
  const failures = windowExpired ? 1 : row.failures + 1;
  const windowStartedAt = windowExpired ? now : row.windowStartedAt;
  const lockedUntil = failures >= MAX_FAILURES ? new Date(now.getTime() + LOCK_MS) : null;

  await db
    .update(authThrottle)
    .set({ failures, windowStartedAt, lockedUntil })
    .where(eq(authThrottle.key, key));
}

export async function clearLoginFailures(key: string): Promise<void> {
  await db.delete(authThrottle).where(eq(authThrottle.key, key));
}
