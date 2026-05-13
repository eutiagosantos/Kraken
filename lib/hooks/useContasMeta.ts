"use client";

import useSWR from "swr";

import type { ContaMeta } from "@/lib/mock-contas";

import { swrJsonFetcher } from "@/lib/hooks/swr-json-fetcher";

const SWR_DEDUP_MS = 30_000;

function mapContas(raw: ContaMeta[]): ContaMeta[] {
  return raw.map((c) => ({
    ...c,
    tokenExpiresAt: new Date(c.tokenExpiresAt),
    connectedAt: new Date(c.connectedAt),
    lastActivity: new Date(c.lastActivity),
    recentUploads: c.recentUploads.map((u) => ({
      ...u,
      date: new Date(u.date as unknown as string),
    })),
  }));
}

export function useContasMeta() {
  const { data, error, isLoading, mutate } = useSWR<{ data?: ContaMeta[] }>(
    "/api/contas-meta",
    swrJsonFetcher,
    { dedupingInterval: SWR_DEDUP_MS }
  );

  const contas = data?.data ? mapContas(data.data) : [];

  return {
    contas,
    setContas: (next: ContaMeta[]) => void mutate({ data: next }, { revalidate: false }),
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? "Erro" : null,
    refetch: () => mutate(),
  };
}
