"use client";

import useSWR from "swr";

import { swrJsonFetcher } from "@/lib/hooks/swr-json-fetcher";

export type UserMetaAppStatus = {
  configured: boolean;
  appId: string | null;
  hasAccessToken: boolean;
  connectedAccounts: number;
};

export function useUserMetaApp() {
  const { data, error, isLoading, mutate } = useSWR<UserMetaAppStatus>(
    "/api/user/meta-app",
    swrJsonFetcher,
    { dedupingInterval: 15_000 }
  );

  return {
    configured: data?.configured ?? false,
    appId: data?.appId ?? null,
    hasAccessToken: data?.hasAccessToken ?? false,
    connectedAccounts: data?.connectedAccounts ?? 0,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? "Erro" : null,
    refetch: () => mutate(),
    mutate,
  };
}
