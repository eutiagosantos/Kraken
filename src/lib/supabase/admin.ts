import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

/**
 * Service-role client (bypasses RLS). Use only on trusted server routes (e.g. Meta webhooks).
 * Returns null if `SUPABASE_SERVICE_ROLE_KEY` is not configured.
 */
export function createServiceSupabaseClient(): ReturnType<typeof createClient<Database>> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
