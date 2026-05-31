"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

export function useSupabase(): SupabaseClient<Database> {
  return useMemo(() => createBrowserSupabaseClient(), []);
}
