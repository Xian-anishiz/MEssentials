import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '$lib/server/auth/password';
import { randomUUID } from 'crypto';
import { requireAdmin, getAuthFromCookies } from '$lib/server/auth/permissions';
import type { RequestHandler } from './$types';

const EMAIL_PATTERN = /^[a-z0-9._%+-]+@up\.edu\.ph$/i;
const NICKNAME_PATTERN = /^[a-z0-9_.]{3,32}$/;

export const POST: RequestHandler = async ({ request, cookies }) => {
  const context = await getAuthFromCookies(cookies);
  requireAdmin(context);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error(400, 'Request body must be valid JSON');
  }

  if (!body || typeof body !== 'object') {
    return error(400, 'Request body must be a JSON object');
  }

  const raw = body as { nickname?: unknown; email?: unknown; password?: unknown };
  const nickname = typeof raw.nickname === 'string' ? raw.nickname.trim().toLowerCase() : '';
  const email = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';
  const password = typeof raw.password === 'string' ? raw.password : '';

  if (!nickname || !email || !password) {
    return error(400, 'Nickname, email, and password are required');
  }

  if (!EMAIL_PATTERN.test(email)) {
    return error(400, 'Email must be a valid @up.edu.ph address');
  }

  if (!NICKNAME_PATTERN.test(nickname)) {
    return error(400, 'Nickname must be 3-32 characters, lowercase letters, numbers, underscore, or dot only');
  }

  if (password.length < 8) {
    return error(400, 'Password must be at least 8 characters long');
  }
  if (password.length > 128) {
    return error(400, 'Password must not exceed 128 characters');
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return error(400, 'Password must contain at least one letter and one number');
  }

  const existingEmail = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existingEmail.length > 0) {
    return error(409, 'Email already in use');
  }

  const existingUsername = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, nickname))
    .limit(1);
  if (existingUsername.length > 0) {
    return error(409, 'Nickname already in use');
  }

  const passwordHash = await hashPassword(password);

  try {
    await db.insert(users).values({
      id: randomUUID(),
      email,
      username: nickname,
      passwordHash,
      googleSub: `local-admin-${randomUUID()}`,
      firstName: 'Admin',
      lastName: nickname,
      isActive: true,
      isEnrolled: true,
      isAdmin: true,
    });
  } catch {
    return error(409, 'An account with that email or nickname already exists');
  }

  return json({ success: true }, { status: 201 });
};

export const GET: RequestHandler = async ({ cookies }) => {
  const context = await getAuthFromCookies(cookies);
  requireAdmin(context);

  return json({ message: 'Use the page endpoint' });
};
