import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

/**
 * Drizzle configuration for migrations.
 *
 * CONNECTION STRATEGY (per SPEC.md section 3.2):
 * - Use direct database connection (db.<ref>.supabase.co:5432) when the environment supports IPv6
 * - Fall back to session pooler (pooler.supabase.com:5432) when IPv6 is not available
 * - NEVER use transaction pooler (port 6543) for migrations
 *
 * The direct connection URL should be set in DATABASE_URL_MIGRATE_DIRECT.
 * If not set, falls back to DATABASE_URL_MIGRATE (session pooler).
 */
const migrationUrl = process.env.DATABASE_URL_MIGRATE_DIRECT || process.env.DATABASE_URL_MIGRATE || '';

if (!migrationUrl) {
  console.warn('WARNING: No migration database URL configured. Set DATABASE_URL_MIGRATE or DATABASE_URL_MIGRATE_DIRECT');
}

export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  out: './src/lib/server/db/migrations',
  dialect: 'postgresql',
  verbose: true,
  dbCredentials: {
    url: migrationUrl,
  },
});