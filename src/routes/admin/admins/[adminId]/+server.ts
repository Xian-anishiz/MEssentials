/**
 * Admin PATCH API endpoint - toggle admin active status.
 * 
 * Allows admins to activate/deactivate other admin accounts.
 * Prevents self-deactivation and deactivating the last active admin.
 * Requires admin authorization.
 * 
 * Stage 3: Create Initial Admin Account - Database V2.x
 */

import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { requireAdmin, getAuthFromCookies } from '$lib/server/auth/permissions';
import type { RequestHandler } from './$types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
  const context = await getAuthFromCookies(cookies);
  requireAdmin(context);

  const adminId = params.adminId;
  if (!adminId || !UUID_PATTERN.test(adminId)) {
    return error(400, 'Invalid admin ID');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error(400, 'Request body must be valid JSON');
  }

  if (!body || typeof body !== 'object') {
    return error(400, 'Request body must be a JSON object');
  }

  const isActive = (body as { isActive?: unknown }).isActive;
  if (typeof isActive !== 'boolean') {
    return error(400, 'isActive must be a boolean');
  }

  const targetResult = await db
    .select({ id: users.id, isAdmin: users.isAdmin, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, adminId))
    .limit(1);

  const target = targetResult[0];
  if (!target || !target.isAdmin) {
    return error(404, 'Admin not found');
  }

  if (target.id === context.userId && !isActive) {
    return error(403, 'Cannot deactivate your own admin account');
  }

  if (!isActive && target.isActive) {
    const activeAdmins = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.isAdmin, true), eq(users.isActive, true)));

    if (activeAdmins.length <= 1) {
      return error(409, 'Cannot deactivate the last active administrator');
    }
  }

  await db
    .update(users)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(users.id, adminId));

  return json({ success: true });
};
