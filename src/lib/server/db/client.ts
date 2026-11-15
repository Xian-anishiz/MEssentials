import postgres from 'postgres';

/**
 * Database client for Supabase PostgreSQL transaction pooler.
 * 
 * CONFIGURATION:
 * - Uses `DATABASE_URL` env var (transaction pooler, port 6543)
 * - `prepare: false` is required because Supabase transaction pooler
 *   does not support prepared statements.
 * 
 * USAGE:
 * ```
 * import { db } from '$lib/server/db/client';
 * const users = await db.query.users.findMany();
 * ```
 * 
 * For migrations, use `DATABASE_URL_MIGRATE` (session pooler, port 5432)
 * in `drizzle.config.ts`.
 */

export const db = postgres(process.env.DATABASE_URL || '', {
  prepare: false,
  max: 10, // connection pool size
});

/**
 * Helper for transactions.
 * Usage:
 *   await db.transaction(async (tx) => {
 *     await tx.insert(users).values({ ... });
 *   });
 */
export type Sql = ReturnType<typeof postgres>;