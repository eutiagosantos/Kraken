"use client";

import { useCallback, useEffect, useState } from "react";

import type { Campanha } from "@/lib/mock-campanhas";

export function useCampanhas() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/campanhas", { credentials: "include" });
      const json = (await res.json()) as { data?: Campanha[]; error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Falha ao carregar campanhas");
      }
      const raw = json.data ?? [];
      setCampanhas(
        raw.map((c) => ({
          ...c,
          createdAt: new Date(c.createdAt as unknown as string),
          creatives: c.creatives.map((cr) => ({ ...cr })),
          errors: c.errors?.map((e) => ({ ...e })),
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
      setCampanhas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { campanhas, setCampanhas, loading, error, refetch };
}
