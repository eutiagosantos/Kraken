"use client";

import { useCallback, useEffect, useState } from "react";

import type { MockWorkspace } from "@/lib/mock-data";

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<MockWorkspace[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workspaces", { credentials: "include" });
      const json = (await res.json()) as { data?: MockWorkspace[] };
      if (res.ok && json.data) {
        setWorkspaces(json.data);
      } else {
        setWorkspaces([]);
      }
    } catch {
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { workspaces, loading, refetch };
}
