"use client";

import useSWR from "swr";

import type { Campanha } from "@/lib/mock-campanhas";

import { swrJsonFetcher } from "@/lib/hooks/swr-json-fetcher";

const SWR_DEDUP_MS = 30_000;

function mapCampanhas(raw: Campanha[]): Campanha[] {
  return raw.map((c) => ({
    ...c,
    createdAt: new Date(c.createdAt as unknown as string),
    creatives: c.creatives.map((cr) => ({ ...cr })),
    errors: c.errors?.map((e) => ({ ...e })),
  }));
}

export function useCampanhas() {
  const { data, error, isLoading, mutate } = useSWR<{ data?: Campanha[] }>(
    "/api/campanhas",
    swrJsonFetcher,
    { dedupingInterval: SWR_DEDUP_MS }
  );

  const campanhas = data?.data ? mapCampanhas(data.data) : [];

  return {
    campanhas,
    setCampanhas: (next: Campanha[]) => void mutate({ data: next }, { revalidate: false }),
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? "Erro" : null,
    refetch: () => mutate(),
  };
}
