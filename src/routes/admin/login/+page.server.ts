/**
 * Admin login page server handlers.
 * 
 * Handles password-based authentication for admin users.
 * Includes login failure throttling, timing-safe password verification,
 * and session cookie creation on successful login.
 * 
 * SPEC.md §4.3: Check Admin permissions on the server, not just by hiding navigation links.
 */

import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '$lib/server/auth/password';
import {
  createSession,
  deleteSession,
  validateSession,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from '$lib/server/auth/sessions';
import { getAuthContext, canAccessAdmin } from '$lib/server/auth/permissions';
import {
  getThrottleStatus,
  recordLoginFailure,
  clearLoginFailures,
} from '$lib/server/auth/throttle';
import type { Actions, PageServerLoad } from './$types';

const GENERIC_ERROR = 'Invalid credentials';

let dummyHashPromise: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  dummyHashPromise ??= hashPassword('invalid-password-0000');
  return dummyHashPromise;
}

export const load: PageServerLoad = async ({ cookies }) => {
  const sessionToken = cookies.get(SESSION_COOKIE_NAME);
  if (sessionToken) {
    const userId = await validateSession(sessionToken);
    if (userId) {
      const context = await getAuthContext(userId);
      if (context && canAccessAdmin(context)) {
        throw redirect(303, '/admin');
      }
    }
  }
  return {};
};

export const actions: Actions = {
  password: async ({ request, cookies }) => {
    const formData = await request.formData();
    const identifier = formData.get('identifier')?.toString().trim().toLowerCase() ?? '';
    const password = formData.get('password')?.toString() ?? '';

    if (!identifier || !password) {
      return fail(400, { error: 'Username/email and password are required' });
    }

    const throttleKey = `admin-login:${identifier}`;
    const throttle = await getThrottleStatus(throttleKey);
    if (throttle.locked) {
      const minutes = Math.max(1, Math.ceil(throttle.retryAfterSeconds / 60));
      return fail(429, { error: `Too many failed attempts. Try again in ${minutes} minute(s).` });
    }

    if (password.length > 128) {
      await recordLoginFailure(throttleKey);
      return fail(401, { error: GENERIC_ERROR });
    }

    const userResult = await db
      .select({
        id: users.id,
        passwordHash: users.passwordHash,
        isAdmin: users.isAdmin,
        isActive: users.isActive,
      })
      .from(users)
      .where(identifier.includes('@') ? eq(users.email, identifier) : eq(users.username, identifier))
      .limit(1);

    if (userResult.length === 0) {
      // Spend comparable time on unknown accounts to limit timing-based enumeration.
      await verifyPassword(password, await getDummyHash()).catch(() => false);
      await recordLoginFailure(throttleKey);
      return fail(401, { error: GENERIC_ERROR });
    }

    const user = userResult[0];
    if (!user.isActive || !user.isAdmin || !user.passwordHash) {
      await verifyPassword(password, user.passwordHash ?? (await getDummyHash())).catch(() => false);
      await recordLoginFailure(throttleKey);
      return fail(401, { error: GENERIC_ERROR });
    }

    const valid = await verifyPassword(password, user.passwordHash).catch(() => false);
    if (!valid) {
      await recordLoginFailure(throttleKey);
      return fail(401, { error: GENERIC_ERROR });
    }

    if (!user.id) {
      return fail(500, { error: 'Unable to start a session' });
    }

    await clearLoginFailures(throttleKey);
    const token = await createSession(user.id);
    cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);

    throw redirect(303, '/admin');
  },

  logout: async ({ cookies }) => {
    const token = cookies.get(SESSION_COOKIE_NAME);
    if (token) {
      await deleteSession(token);
    }
    cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
    throw redirect(303, '/admin/login');
  },
};
