/**
 * Admin logout API endpoint.
 * 
 * Deletes the user's session from the database and clears the session cookie.
 * Redirects to /admin/login after logout.
 */

import { redirect } from '@sveltejs/kit';
import { deleteSession, SESSION_COOKIE_NAME } from '$lib/server/auth/sessions';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
  const token = cookies.get(SESSION_COOKIE_NAME);
  if (token) {
    await deleteSession(token);
  }

  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
  throw redirect(303, '/admin/login');
};
