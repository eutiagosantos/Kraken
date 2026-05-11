"use client";

import { useCallback, useEffect, useState } from "react";

import type { MockWorkspace } from "@/lib/mock-data";

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<MockWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/workspaces", { credentials: "include", cache: "no-store" });
      const json = (await res.json()) as { data?: MockWorkspace[]; error?: string };
      if (res.ok && json.data) {
        setWorkspaces(json.data);
      } else {
        setWorkspaces([]);
        setError(json.error ?? `Request failed with status ${res.status}`);
      }
    } catch {
      setWorkspaces([]);
      setError("Failed to fetch workspaces.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { workspaces, loading, error, refetch };
}
