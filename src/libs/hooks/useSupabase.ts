"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";

import { createBrowserSupabaseClient } from "@/libs/supabase/client";
import type { Database } from "@/libs/supabase/types";

export function useSupabase(): SupabaseClient<Database> {
  return useMemo(() => createBrowserSupabaseClient(), []);
}
