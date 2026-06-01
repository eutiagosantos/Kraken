"use client";

import useSWR from "swr";

import { swrJsonFetcher } from "@/libs/hooks/swr-json-fetcher";
import type { ActivityType } from "@/libs/mock-data";

const SWR_DEDUP_MS = 30_000;

export type NotificationItem = {
  id: string;
  type: ActivityType;
  message: string;
  account: string;
  createdAt: string;
};

type NotificationApiRow = {
  id: string;
  type: string;
  message: string;
  account: string;
  created_at: string;
};

export function useNotifications() {
  const { data, error, isLoading } = useSWR<{ data?: NotificationApiRow[] }>(
    "/api/notifications",
    swrJsonFetcher,
    { dedupingInterval: SWR_DEDUP_MS }
  );

  const notifications: NotificationItem[] = (data?.data ?? []).map((n) => ({
    id: n.id,
    type: n.type as ActivityType,
    message: n.message,
    account: n.account,
    createdAt: n.created_at,
  }));

  return {
    notifications,
    isLoading,
    error: error instanceof Error ? error.message : error ? "Erro" : null,
  };
}
