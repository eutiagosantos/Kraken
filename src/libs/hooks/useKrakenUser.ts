"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";

export function useKrakenUser() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!authLoaded) return;
    setLoading(true);
    if (!isSignedIn || !clerkUser) {
      setInternalUserId(null);
      setFullName("");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/profile", { credentials: "include" });
    if (res.ok) {
      const json = (await res.json()) as { data?: { id?: string; full_name?: string | null } };
      setInternalUserId(json.data?.id ?? null);
      setFullName(
        json.data?.full_name?.trim() ||
          clerkUser.fullName?.trim() ||
          clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] ||
          ""
      );
    } else {
      setInternalUserId(null);
      setFullName(
        clerkUser.fullName?.trim() ||
          clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] ||
          ""
      );
    }
    setLoading(false);
  }, [authLoaded, clerkUser, isSignedIn]);

  useEffect(() => {
    void load();
  }, [load]);

  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? "";
  const displayName = fullName || email.split("@")[0] || "Conta";

  return {
    user: internalUserId ? { id: internalUserId } : null,
    displayName,
    email,
    loading: loading || !authLoaded,
    refetch: load,
  };
}
