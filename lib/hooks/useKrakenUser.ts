"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

import { useSupabase } from "@/lib/hooks/useSupabase";

export function useKrakenUser() {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    setUser(u);
    if (u?.id) {
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", u.id).maybeSingle();
      setFullName(profile?.full_name?.trim() || u.email?.split("@")[0] || "");
    } else {
      setFullName("");
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });
    return () => subscription.unsubscribe();
  }, [supabase, load]);

  const displayName = fullName || user?.email?.split("@")[0] || "Conta";
  const email = user?.email ?? "";

  return { user, displayName, email, loading, refetch: load };
}
