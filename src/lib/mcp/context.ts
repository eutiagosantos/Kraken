import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

export type McpContext = {
  userId: string;
  supabase: SupabaseClient<Database>;
};

/**
 * Service-role Supabase scoped to `userId` (queries filter by user_id in tools).
 * Swap auth resolver later (OAuth 2.1) without changing tools.
 */
export function createMcpContext(userId: string): McpContext | null {
  const supabase = createServiceSupabaseClient();
  if (!supabase) return null;
  return { userId, supabase };
}
