import "server-only";

import { createServiceSupabaseClient } from "@/libs/supabase/admin";
import type { Database } from "@/libs/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Service-role Storage client (paths must be validated against user id in app code). */
export function getStorageSupabaseClient(): SupabaseClient<Database> {
  const client = createServiceSupabaseClient();
  if (!client) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }
  return client;
}
