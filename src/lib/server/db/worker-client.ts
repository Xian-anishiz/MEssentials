import postgres from 'postgres';

/**
 * Database client for Supabase PostgreSQL direct connection.
 *
 * CONFIGURATION:
 * - Uses `DATABASE_URL_WORKER` env var (direct connection, port 5432)
 * - `prepare: true` (default) because direct connection supports prepared statements
 * - Used by the background worker process only
 *
 * The worker is a long-running Node.js process, not a Vercel request function.
 * Use the direct database connection when the worker host supports IPv6.
 * If the worker host only supports IPv4, use the Supabase session pooler (port 5432)
 * by setting DATABASE_URL_WORKER to the session pooler URL.
 */
export const workerDb = postgres(process.env.DATABASE_URL_WORKER || '', {
  prepare: true,
  max: Number(process.env.WORKER_DB_POOL_MAX) || 5,
  idle_timeout: 30,
  connect_timeout: 10,
});

/**
 * Helper for transactions in the worker.
 * Usage:
 *   await workerDb.transaction(async (tx) => {
 *     await tx.insert(users).values({ ... });
 *   });
 */
export type WorkerSql = ReturnType<typeof postgres>;