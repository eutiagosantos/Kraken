"use client";

import useSWR from "swr";

import { PublicationQueuePanel } from "@/components/publication-queue/PublicationQueuePanel";
import type { PublicationQueueSummary } from "@/lib/publication-queue/compute-panel-summary";
import { swrJsonFetcher } from "@/lib/hooks/swr-json-fetcher";
import { cn } from "@/lib/utils";

type ApiResponse = {
  data?: PublicationQueueSummary;
  error?: string;
};

type Props = {
  /** Link target; pass `false` to disable. Default: `/fila-de-processamento` */
  href?: string | false;
  className?: string;
  /** Poll faster while queue is active */
  pollWhenActiveMs?: number;
  pollIdleMs?: number;
};

const DEFAULT_ACTIVE_MS = 5000;
const DEFAULT_IDLE_MS = 30_000;

export function PublicationQueuePanelLive({
  href = "/fila-de-processamento",
  className,
  pollWhenActiveMs = DEFAULT_ACTIVE_MS,
  pollIdleMs = DEFAULT_IDLE_MS,
}: Props) {
  const { data, error, isLoading } = useSWR<ApiResponse>(
    "/api/publication-queue/summary",
    swrJsonFetcher,
    {
      refreshInterval: (latest) => {
        const active = latest?.data?.isActive ?? false;
        return active ? pollWhenActiveMs : pollIdleMs;
      },
    }
  );

  if (isLoading && !data?.data) {
    return (
      <div
        className={cn(
          "flex min-h-[320px] items-center justify-center rounded-[18px] border border-neutral-border bg-white p-8 text-sm text-neutral-silver shadow-subtle",
          className
        )}
      >
        A carregar fila de publicação…
      </div>
    );
  }

  if (error || data?.error || !data?.data) {
    return (
      <div
        className={cn(
          "rounded-[18px] border border-semantic-red/20 bg-semantic-red-bg/40 p-6 text-sm text-neutral-black",
          className
        )}
      >
        {error instanceof Error ? error.message : data?.error ?? "Erro ao carregar o painel."}
      </div>
    );
  }

  return (
    <PublicationQueuePanel
      summary={data.data}
      href={href === false ? undefined : href}
      className={className}
    />
  );
}
