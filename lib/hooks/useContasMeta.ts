"use client";

import { useCallback, useEffect, useState } from "react";

import type { ContaMeta } from "@/lib/mock-contas";

export function useContasMeta() {
  const [contas, setContas] = useState<ContaMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/contas-meta", { credentials: "include" });
      const json = (await res.json()) as { data?: ContaMeta[]; error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Falha ao carregar contas");
      }
      const raw = json.data ?? [];
      setContas(
        raw.map((c) => ({
          ...c,
          tokenExpiresAt: new Date(c.tokenExpiresAt),
          connectedAt: new Date(c.connectedAt),
          lastActivity: new Date(c.lastActivity),
          recentUploads: c.recentUploads.map((u) => ({
            ...u,
            date: new Date(u.date as unknown as string),
          })),
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
      setContas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { contas, setContas, loading, error, refetch };
}
