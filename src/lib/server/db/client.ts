import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

/**
 * Database client for runtime queries using the Supabase transaction pooler.
 * SPEC.md §3.2: Use transaction pooler (port 6543) for Vercel web app with prepare: false
 */

let dbInstance: PostgresJsDatabase<typeof schema> | null = null;
let sqlInstance: ReturnType<typeof postgres> | null = null;

/**
 * Get or create the database client instance.
 * Uses the transaction pooler with prepared statements disabled.
 */
export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const databaseUrl = env.DATABASE_URL;

  if (!databaseUrl) {
    // During build, DATABASE_URL might not be set. Return a mock that throws on use.
    // This allows the build to succeed without a database connection.
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
      // Only throw in actual runtime, not during build
      if (typeof process !== 'undefined' && process.env.VERCEL) {
        throw new Error('DATABASE_URL is not set. Configure the Supabase transaction pooler connection string.');
      }
    }
    // Return a dummy db that throws on any operation
    return createDummyDb();
  }

  // Create postgres client with transaction pooler settings
  // prepare: false is REQUIRED for transaction pooler (PgBouncer)
  sqlInstance = postgres(databaseUrl, {
    prepare: false,
    max: 10, // Small pool for Vercel functions
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {}, // Suppress notices in production
  });

  dbInstance = drizzle(sqlInstance, { schema });

  return dbInstance;
}

function createDummyDb(): PostgresJsDatabase<typeof schema> {
  const handler = {
    get: () => {
      throw new Error('Database not configured. DATABASE_URL is not set.');
    }
  };
  return new Proxy({} as PostgresJsDatabase<typeof schema>, handler);
}

/**
 * Get the database instance (alias for getDb for convenience).
 * This is the main export used by server-side code.
 */
export const db = getDb();

/**
 * Close the database connection pool.
 * Used for graceful shutdown in long-running processes (worker).
 */
export async function closeDb(): Promise<void> {
  if (sqlInstance) {
    await sqlInstance.end();
    sqlInstance = null;
    dbInstance = null;
  }
}

/**
 * Execute a function within a database transaction.
 * @param fn - Function that receives the transaction client
 * @returns The result of the function
 */
export async function transaction<T>(
  fn: (tx: PostgresJsDatabase<typeof schema>) => Promise<T>
): Promise<T> {
  const database = getDb();
  return database.transaction(fn);
}