"use client";

import useSWR from "swr";

import { swrJsonFetcher } from "@/libs/hooks/swr-json-fetcher";

export type McpKeyRow = {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
};

type McpKeysResponse = {
  data: McpKeyRow[];
};

export function useMcpKeys() {
  const { data, error, isLoading, mutate } = useSWR<McpKeysResponse>(
    "/api/user/mcp-keys",
    swrJsonFetcher,
    { dedupingInterval: 15_000 }
  );

  return {
    keys: data?.data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? "Erro" : null,
    refetch: () => mutate(),
    mutate,
  };
}
