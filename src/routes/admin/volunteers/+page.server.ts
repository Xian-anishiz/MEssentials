/**
 * Volunteers page server load - fetches volunteer users with roles from database.
 * 
 * Provides server-side filtering, sorting, and pagination for the Volunteers page.
 * Joins users table with volunteer_roles table to display assigned roles.
 * Includes dynamic college dropdown and role labels from database.
 * 
 * Stage 4: Replace Admin Dashboard Mock Data - Database V2.x
 */

import { db } from '$lib/server/db/client';
import { users, volunteerRoles, volunteerRoleEnum } from '$lib/server/db/schema';
import { eq, desc, asc, ilike, or, and, inArray } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export type VolunteerRole = (typeof volunteerRoleEnum.enumValues)[number];

export interface VolunteerUser {
  studentNumber: string;
  firstName: string;
  middleInitial: string;
  lastName: string;
  email: string;
  emailUsername: string;
  phone: string;
  college: string;
  degreeProgram: string;
  volunteerRoles: VolunteerRole[];
  isActive: boolean;
}

const ROLE_LABELS: Record<VolunteerRole, string> = {
  store_manager: 'Store Manager',
  kailangan_manager: 'Borrow Manager',
  megaral_manager: 'Reviewer Manager',
  medays_manager: 'Events Manager',
  registration_manager: 'Queue Manager',
};

export const load: PageServerLoad = async ({ url }) => {
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = 10;
  const role = url.searchParams.get('role') || '';
  const college = url.searchParams.get('college') || '';
  const activeOnly = url.searchParams.get('activeOnly') === 'true';
  const search = url.searchParams.get('search') || '';
  const sortKey = url.searchParams.get('sortKey') || 'lastName';
  const sortDirection = url.searchParams.get('sortDirection') || 'asc';

  const userConditions = [eq(users.isAdmin, false)];
  if (activeOnly) userConditions.push(eq(users.isActive, true));
  if (college) userConditions.push(eq(users.college, college));
  if (search) {
    userConditions.push(or(
      ilike(users.studentNumber, `%${search}%`),
      ilike(users.firstName, `%${search}%`),
      ilike(users.lastName, `%${search}%`),
      ilike(users.username, `%${search}%`),
      ilike(users.email, `%${search}%`)
    )!);
  }

  const allUsersResult = await db
    .select({
      studentNumber: users.studentNumber,
      firstName: users.firstName,
      middleInitial: users.middleInitial,
      lastName: users.lastName,
      username: users.username,
      email: users.email,
      phoneNumber: users.phoneNumber,
      college: users.college,
      degreeProgram: users.degreeProgram,
      isActive: users.isActive,
      id: users.id,
    })
    .from(users)
    .where(and(...userConditions));

  const userIds = allUsersResult.map(u => u.id).filter((id): id is string => !!id);
  let rolesMap = new Map<string, VolunteerRole[]>();
  if (userIds.length > 0) {
    const rolesResult = await db
      .select({ userId: volunteerRoles.userId, role: volunteerRoles.role })
      .from(volunteerRoles)
      .where(inArray(volunteerRoles.userId, userIds));
    for (const r of rolesResult) {
      const existing = rolesMap.get(r.userId) || [];
      existing.push(r.role);
      rolesMap.set(r.userId, existing);
    }
  }

  let volunteers = allUsersResult
    .map((user) => ({
      studentNumber: user.studentNumber || '',
      firstName: user.firstName || '',
      middleInitial: user.middleInitial || '',
      lastName: user.lastName || '',
      email: user.email || '',
      emailUsername: user.username || user.email?.split('@')[0] || '',
      phone: user.phoneNumber || '',
      college: user.college || '',
      degreeProgram: user.degreeProgram || '',
      volunteerRoles: rolesMap.get(user.id || '') || [],
      isActive: user.isActive ?? true,
    }))
    .filter((v) => {
      if (role) {
        const roleKey = Object.entries(ROLE_LABELS).find(([, label]) => label === role)?.[0] as VolunteerRole | undefined;
        return roleKey ? v.volunteerRoles.includes(roleKey) : false;
      }
      return true;
    });

  if (sortKey === 'volunteerRoles') {
    volunteers.sort((a, b) => {
      const aStr = a.volunteerRoles.map(r => ROLE_LABELS[r]).join(', ');
      const bStr = b.volunteerRoles.map(r => ROLE_LABELS[r]).join(', ');
      const cmp = aStr.localeCompare(bStr);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  } else {
    const orderByColumn = (() => {
      switch (sortKey) {
        case 'studentNumber': return (v: VolunteerUser) => v.studentNumber;
        case 'firstName': return (v: VolunteerUser) => v.firstName;
        case 'lastName': return (v: VolunteerUser) => v.lastName;
        case 'emailUsername': return (v: VolunteerUser) => v.emailUsername;
        case 'college': return (v: VolunteerUser) => v.college;
        case 'isActive': return (v: VolunteerUser) => v.isActive;
        default: return (v: VolunteerUser) => v.lastName;
      }
    })();
    volunteers.sort((a, b) => {
      const aVal = orderByColumn(a);
      const bVal = orderByColumn(b);
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const totalItems = volunteers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const paginatedVolunteers = volunteers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const collegesResult = await db
    .selectDistinct({ college: users.college })
    .from(users)
    .where(and(eq(users.isAdmin, false), eq(users.isActive, true)));
  const colleges = collegesResult.map(c => c.college).filter((c): c is string => !!c).sort();

  const volunteerRolesList: VolunteerRole[] = ['store_manager', 'kailangan_manager', 'megaral_manager', 'medays_manager', 'registration_manager'];

  return {
    volunteers: paginatedVolunteers,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    filters: { role, college, activeOnly, search },
    sort: { sortKey, sortDirection },
    colleges,
    volunteerRoles: volunteerRolesList,
    roleLabels: ROLE_LABELS,
  };
};
