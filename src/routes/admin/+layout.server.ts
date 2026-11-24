import { redirect } from '@sveltejs/kit';
import { getAuthContext, canAccessAdmin } from '$lib/server/auth/permissions';
import { validateSession, SESSION_COOKIE_NAME } from '$lib/server/auth/sessions';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
  // The login route must stay reachable while unauthenticated.
  if (url.pathname === '/admin/login') {
    return {};
  }

  const sessionToken = cookies.get(SESSION_COOKIE_NAME);
  
  if (!sessionToken) {
    throw redirect(302, '/admin/login');
  }

  const userId = await validateSession(sessionToken);
  if (!userId) {
    throw redirect(302, '/admin/login');
  }

  const context = await getAuthContext(userId);
  if (!context || !canAccessAdmin(context)) {
    throw redirect(302, '/admin/login');
  }

  return {
    user: {
      id: context.userId,
      isAdmin: context.isAdmin,
      volunteerRoles: context.volunteerRoles,
    },
  };
};