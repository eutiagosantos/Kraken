"use client";

import useSWR from "swr";

import type { MockWorkspace } from "@/lib/mock-data";

import { swrJsonFetcher } from "@/lib/hooks/swr-json-fetcher";

const SWR_DEDUP_MS = 30_000;

export function useWorkspaces() {
  const { data, error, isLoading, mutate } = useSWR<{ data?: MockWorkspace[] }>(
    "/api/workspaces",
    swrJsonFetcher,
    { dedupingInterval: SWR_DEDUP_MS }
  );

  return {
    workspaces: data?.data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? "Failed to fetch workspaces." : null,
    refetch: () => mutate(),
  };
}
