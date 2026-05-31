import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/types";

export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase env vars are missing.");
  }

  return createBrowserClient<Database>(url, key);
}
