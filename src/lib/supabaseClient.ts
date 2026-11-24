/**
 * Supabase client for client-side operations.
 * 
 * Creates a Supabase client using the public URL and publishable key.
 * Used for client-side Supabase operations (not server-side database queries).
 * Server-side database queries use Drizzle ORM via src/lib/server/db/client.ts
 * 
 * SPEC.md §3.2: Database connections - Supabase client for browser operations.
 */

import { createClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from "$env/static/public";

const supabaseUrl = PUBLIC_SUPABASE_URL;
const supabaseKey = PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey); 