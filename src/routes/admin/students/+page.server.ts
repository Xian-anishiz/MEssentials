import { db } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema';
import { eq, desc, asc, ilike, or, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export interface StudentUser {
  studentNumber: string;
  firstName: string;
  middleInitial: string;
  lastName: string;
  email: string;
  emailUsername: string;
  phone: string;
  college: string;
  degreeProgram: string;
  isActive: boolean;
  isEnrolled: boolean;
  createdAt: Date;
}

export const load: PageServerLoad = async ({ url }) => {
  // Parse query parameters for filtering, sorting, pagination
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = 15;
  const college = url.searchParams.get('college') || '';
  const degreeProgram = url.searchParams.get('degreeProgram') || '';
  const activeOnly = url.searchParams.get('activeOnly') === 'true';
  const enrolledOnly = url.searchParams.get('enrolledOnly') === 'true';
  const search = url.searchParams.get('search') || '';
  const sortKey = url.searchParams.get('sortKey') || 'lastName';
  const sortDirection = url.searchParams.get('sortDirection') || 'asc';

  // Build where conditions
  const conditions = [eq(users.isAdmin, false)]; // Exclude admins from student list
  
  if (activeOnly) {
    conditions.push(eq(users.isActive, true));
  }
  
  if (enrolledOnly) {
    conditions.push(eq(users.isEnrolled, true));
  }
  
  if (college) {
    conditions.push(eq(users.college, college));
  }
  
  if (degreeProgram) {
    conditions.push(eq(users.degreeProgram, degreeProgram));
  }
  
  if (search) {
    conditions.push(
      or(
        ilike(users.studentNumber, `%${search}%`),
        ilike(users.firstName, `%${search}%`),
        ilike(users.lastName, `%${search}%`),
        ilike(users.username, `%${search}%`),
        ilike(users.email, `%${search}%`)
      )!
    );
  }

  // Build order by
  const orderByColumn = (() => {
    switch (sortKey) {
      case 'studentNumber':
        return users.studentNumber;
      case 'firstName':
        return users.firstName;
      case 'middleInitial':
        return users.middleInitial;
      case 'lastName':
        return users.lastName;
      case 'emailUsername':
        return users.username;
      case 'phone':
        return users.phoneNumber;
      case 'college':
        return users.college;
      case 'degreeProgram':
        return users.degreeProgram;
      case 'isActive':
        return users.isActive;
      case 'isEnrolled':
        return users.isEnrolled;
      case 'createdAt':
      default:
        return users.createdAt;
    }
  })();

  const orderBy = sortDirection === 'asc' ? asc(orderByColumn) : desc(orderByColumn);

  // Query total count
  const countResult = await db
    .select({ count: users.id })
    .from(users)
    .where(and(...conditions));
  
  const totalItems = countResult.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const currentPage = Math.max(1, Math.min(page, totalPages));

  // Query paginated results
  const studentsResult = await db
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
      isEnrolled: users.isEnrolled,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(pageSize)
    .offset((currentPage - 1) * pageSize);

  // Map to StudentUser interface
  const students: StudentUser[] = studentsResult.map((student) => ({
    studentNumber: student.studentNumber || '',
    firstName: student.firstName || '',
    middleInitial: student.middleInitial || '',
    lastName: student.lastName || '',
    email: student.email || '',
    emailUsername: student.username || student.email?.split('@')[0] || '',
    phone: student.phoneNumber || '',
    college: student.college || '',
    degreeProgram: student.degreeProgram || '',
    isActive: student.isActive ?? true,
    isEnrolled: student.isEnrolled ?? true,
    createdAt: student.createdAt,
  }));

  // Get unique colleges and degree programs for filter dropdowns
  const collegesResult = await db
    .selectDistinct({ college: users.college })
    .from(users)
    .where(and(eq(users.isAdmin, false), eq(users.isActive, true)));
  
  const degreeProgramsResult = await db
    .selectDistinct({ degreeProgram: users.degreeProgram })
    .from(users)
    .where(and(eq(users.isAdmin, false), eq(users.isActive, true)));

  const colleges = collegesResult.map(c => c.college).filter((c): c is string => !!c).sort();
  const degreePrograms = degreeProgramsResult.map(d => d.degreeProgram).filter((d): d is string => !!d).sort();

  return {
    students,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    filters: { college, degreeProgram, activeOnly, enrolledOnly, search },
    sort: { sortKey, sortDirection },
    colleges,
    degreePrograms,
  };
};