import { db } from '../db/client';
import { users, volunteerRoles, volunteerRoleEnum } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';
import { validateSession, SESSION_COOKIE_NAME } from './sessions';

/**
 * Permission checking and authorization helpers.
 * SPEC.md §4.3: Enforce permissions in the model or a shared authorize() helper.
 */

export type VolunteerRole = (typeof volunteerRoleEnum.enumValues)[number];
export type ServiceName = 'store' | 'kailangan' | 'megaral' | 'medays' | 'registration' | 'system';

/**
 * Map volunteer roles to their managed services.
 */
export const VOLUNTEER_ROLE_SERVICES: Record<VolunteerRole, ServiceName> = {
  store_manager: 'store',
  kailangan_manager: 'kailangan',
  megaral_manager: 'megaral',
  medays_manager: 'medays',
  registration_manager: 'registration',
};

/**
 * User context for authorization decisions.
 */
export interface AuthContext {
  userId: string;
  isAdmin: boolean;
  volunteerRoles: VolunteerRole[];
}

/**
 * Load the authorization context for a user.
 * @param userId - The user's UUID
 * @returns AuthContext with permissions, or null if user not found
 */
export async function getAuthContext(userId: string): Promise<AuthContext | null> {
  const userResult = await db
    .select({
      id: users.id,
      isAdmin: users.isAdmin,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userResult.length === 0 || !userResult[0].isActive) {
    return null;
  }

  const user = userResult[0];

  const rolesResult = await db
    .select({ role: volunteerRoles.role })
    .from(volunteerRoles)
    .where(eq(volunteerRoles.userId, userId));

  const volunteerRolesList = rolesResult.map((r) => r.role) as VolunteerRole[];

  return {
    userId: user.id ?? '',
    isAdmin: user.isAdmin,
    volunteerRoles: volunteerRolesList,
  };
}

/**
 * Resolve the authorization context from the session cookie.
 * @param cookies - SvelteKit request cookies
 * @returns AuthContext, or null when no valid session exists
 */
export async function getAuthFromCookies(cookies: Cookies): Promise<AuthContext | null> {
  const token = cookies.get(SESSION_COOKIE_NAME);
  if (!token) return null;

  const userId = await validateSession(token);
  if (!userId) return null;

  return getAuthContext(userId);
}

/**
 * Check if a user is an administrator.
 * @param context - The auth context
 * @returns true if user is admin
 */
export function isAdmin(context: AuthContext | null): boolean {
  return context?.isAdmin ?? false;
}

/**
 * Check if a user has a specific volunteer role.
 * @param context - The auth context
 * @param role - The volunteer role to check
 * @returns true if user has the role
 */
export function hasVolunteerRole(context: AuthContext | null, role: VolunteerRole): boolean {
  return context?.volunteerRoles.includes(role) ?? false;
}

/**
 * Check if a user can manage a specific service.
 * @param context - The auth context
 * @param service - The service name
 * @returns true if user can manage the service (admin or matching volunteer role)
 */
export function canManageService(context: AuthContext | null, service: ServiceName): boolean {
  if (isAdmin(context)) return true;
  if (!context) return false;

  // Check if any of the user's volunteer roles manage this service
  return context.volunteerRoles.some(
    (role) => VOLUNTEER_ROLE_SERVICES[role] === service
  );
}

/**
 * Check if a user can access the admin dashboard.
 * @param context - The auth context
 * @returns true if user is admin
 */
export function canAccessAdmin(context: AuthContext | null): boolean {
  return isAdmin(context);
}

/**
 * Check if a user can manage volunteer roles (admin only).
 * @param context - The auth context
 * @returns true if user is admin
 */
export function canManageVolunteerRoles(context: AuthContext | null): boolean {
  return isAdmin(context);
}

/**
 * Check if a user can manage admin accounts (admin only, cannot self-revoke).
 * @param context - The auth context
 * @param targetUserId - The target user's UUID
 * @returns true if user is admin and not trying to modify themselves
 */
export function canManageAdmins(context: AuthContext | null, targetUserId: string): boolean {
  return isAdmin(context) && (context?.userId ?? '') !== targetUserId;
}

/**
 * Authorization error class.
 */
export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Require admin access, throw if not authorized.
 * @param context - The auth context
 * @throws AuthorizationError if not admin
 */
export function requireAdmin(context: AuthContext | null): asserts context is AuthContext & { isAdmin: true } {
  if (!isAdmin(context)) {
    throw new AuthorizationError('Administrator access required');
  }
}

/**
 * Require a specific volunteer role or admin, throw if not authorized.
 * @param context - The auth context
 * @param role - The required volunteer role
 * @throws AuthorizationError if not authorized
 */
export function requireVolunteerRole(
  context: AuthContext | null,
  role: VolunteerRole
): asserts context is AuthContext {
  if (!hasVolunteerRole(context, role) && !isAdmin(context)) {
    throw new AuthorizationError(`${role} access required`);
  }
}

/**
 * Require ability to manage a service, throw if not authorized.
 * @param context - The auth context
 * @param service - The service to manage
 * @throws AuthorizationError if not authorized
 */
export function requireServiceAccess(
  context: AuthContext | null,
  service: ServiceName
): asserts context is AuthContext {
  if (!canManageService(context, service)) {
    throw new AuthorizationError(`${service} management access required`);
  }
}