/**
 * Admins page server load - fetches admin users from database.
 * 
 * Provides server-side filtering, sorting, and pagination for the Admins page.
 * Loads users with is_admin=true from the database with URL-based state.
 * 
 * Stage 3: Create Initial Admin Account - Database V2.x
 */

import { db } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema';
import { eq, desc, asc, ilike, or, and, count } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export interface AdminUser {
  id: string;
  displayId: string;
  nickname: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
}

const PAGE_SIZE = 10;

export const load: PageServerLoad = async ({ url }) => {
  const parsedPage = Number.parseInt(url.searchParams.get('page') || '1', 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const activeOnly = url.searchParams.get('activeOnly') === 'true';
  const search = (url.searchParams.get('search') || '').trim();
  const sortKey = url.searchParams.get('sortKey') || 'createdAt';
  const sortDirection = url.searchParams.get('sortDirection') === 'asc' ? 'asc' : 'desc';

  const conditions = [eq(users.isAdmin, true)];

  if (activeOnly) {
    conditions.push(eq(users.isActive, true));
  }

  if (search) {
    conditions.push(
      or(
        ilike(users.username, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(users.firstName, `%${search}%`),
        ilike(users.lastName, `%${search}%`)
      )!
    );
  }

  const orderByColumn = (() => {
    switch (sortKey) {
      case 'nickname':
        return users.username;
      case 'email':
        return users.email;
      case 'isActive':
        return users.isActive;
      case 'createdAt':
      default:
        return users.createdAt;
    }
  })();

  const orderBy = sortDirection === 'asc' ? asc(orderByColumn) : desc(orderByColumn);

  const countResult = await db
    .select({ value: count() })
    .from(users)
    .where(and(...conditions));

  const totalItems = Number(countResult[0]?.value ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const adminsResult = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(PAGE_SIZE)
    .offset((currentPage - 1) * PAGE_SIZE);

  const admins: AdminUser[] = adminsResult.map((admin, index) => ({
    id: admin.id ?? '',
    displayId: `ADM-${String((currentPage - 1) * PAGE_SIZE + index + 1).padStart(3, '0')}`,
    nickname: admin.username || `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'Unknown',
    email: admin.email,
    isActive: admin.isActive,
    createdAt: admin.createdAt,
  }));

  return {
    admins,
    totalItems,
    totalPages,
    currentPage,
    pageSize: PAGE_SIZE,
    filters: { activeOnly, search },
    sort: { sortKey, sortDirection },
  };
};
