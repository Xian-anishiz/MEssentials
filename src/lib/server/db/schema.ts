import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
  pgEnum,
  integer,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/* ==========================================================
   Database Foundation V1 Schema (SPEC.md §5.2, Design A)
   Tables: users, sessions, volunteer_roles, auth_throttle
   Includes: volunteer_role enum
   ========================================================== */

/* ==========================================================
   ENUMERATIONS
   ========================================================== */

export const volunteerRoleEnum = pgEnum('volunteer_role', [
  'store_manager',
  'kailangan_manager',
  'megaral_manager',
  'medays_manager',
  'registration_manager',
]);

/* ==========================================================
   USERS TABLE
   Shared account information, login credentials, and profile fields.
   Every account is a Student (SPEC §4.1) with optional volunteer
   roles and/or admin status.
   ========================================================== */

export const users = pgTable(
  'users',
  {
    id: uuid('id').default(sql`gen_random_uuid()`),
    email: text('email').notNull().unique(),
    username: text('username').unique(),
    passwordHash: text('password_hash'), // Nullable for Google-only accounts
    googleSub: text('google_sub').notNull().unique(), // Google OAuth subject ID
    // Profile fields
    firstName: text('first_name'),
    middleInitial: text('middle_initial'),
    lastName: text('last_name'),
    studentNumber: text('student_number').unique(),
    phoneNumber: text('phone_number'),
    college: text('college'),
    degreeProgram: text('degree_program'),
    avatarKey: text('avatar_key'),
    // State/permissions
    isActive: boolean('is_active').notNull().default(true),
    isEnrolled: boolean('is_enrolled').notNull().default(true),
    isAdmin: boolean('is_admin').notNull().default(false),
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    pk: primaryKey({
      name: 'users_pkey',
      columns: [table.id],
    }),
    emailIdx: index('users_email_idx').on(table.email),
    usernameIdx: index('users_username_idx').on(table.username),
    studentNumberIdx: index('users_student_number_idx').on(table.studentNumber),
    isActiveIdx: index('users_is_active_idx').on(table.isActive),
  })
);

/* ==========================================================
   SESSIONS TABLE
   Persistent login sessions for cookie-based auth.
   ========================================================== */

export const sessions = pgTable(
  'sessions',
  {
    idHash: text('id_hash'),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    userAgent: text('user_agent'),
    ip: text('ip'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({
      name: 'sessions_pkey',
      columns: [table.idHash],
    }),
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
    expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
  })
);

/* ==========================================================
   VOLUNTEER ROLES TABLE
    Maps students to their assigned service-manager roles.
    Many-to-many relationship via composite primary key.
    ========================================================== */

export const volunteerRoles = pgTable(
  'volunteer_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: volunteerRoleEnum('role').notNull(),
    grantedBy: uuid('granted_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({
      name: 'volunteer_roles_pkey',
      columns: [table.userId, table.role],
    }),
    roleIdx: index('volunteer_roles_role_idx').on(table.role),
  })
);

/* ==========================================================
   AUTH THROTTLE TABLE
   Durable password-login failure counters (SPEC §6.10).
   Survives worker restarts and works across instances.
   ========================================================== */

export const authThrottle = pgTable(
  'auth_throttle',
  {
    key: text('key'),
    failures: integer('failures').notNull().default(0),
    windowStartedAt: timestamp('window_started_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
  },
  (table) => ({
    pk: primaryKey({
      name: 'auth_throttle_pkey',
      columns: [table.key],
    }),
    lockedUntilIdx: index('auth_throttle_locked_until_idx').on(table.lockedUntil),
  })
);