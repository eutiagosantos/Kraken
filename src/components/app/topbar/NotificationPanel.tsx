"use client";

import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useRef } from "react";

import { useClickOutside } from "@/lib/hooks/useClickOutside";
import type { NotificationItem } from "@/lib/hooks/useNotifications";
import type { ActivityType } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const NOTIF_LAST_SEEN_KEY = "notif_last_seen";

function iconForType(type: ActivityType) {
  switch (type) {
    case "success":
      return CheckCircle2;
    case "processing":
      return Loader2;
    case "error":
      return AlertCircle;
    default:
      return CheckCircle2;
  }
}

function iconClass(type: ActivityType) {
  switch (type) {
    case "success":
      return "text-semantic-green";
    case "processing":
      return "text-brand-purple";
    case "error":
      return "text-semantic-red";
    default:
      return "text-dashboard-muted";
  }
}

type Props = {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  notifications: NotificationItem[];
  isLoading: boolean;
};

export function NotificationPanel({
  open,
  onClose,
  anchorRef,
  notifications,
  isLoading,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useClickOutside(panelRef, onClose, open, [anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,360px)] overflow-hidden rounded-xl border border-dashboard-border bg-dashboard-surface shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
      role="dialog"
      aria-label="Notificações"
    >
      <div className="border-b border-dashboard-border px-4 py-3">
        <h2 className="font-display text-sm font-bold text-neutral-black">Notificações</h2>
      </div>

      <div className="max-h-[min(420px,60vh)] overflow-y-auto">
        {isLoading ? (
          <p className="px-4 py-8 text-center text-sm text-dashboard-muted">Carregando…</p>
        ) : notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-dashboard-muted">Sem notificações.</p>
        ) : (
          <ul>
            {notifications.map((n, i) => {
              const Icon = iconForType(n.type);
              const timeLabel = n.createdAt
                ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })
                : "";
              return (
                <li
                  key={n.id}
                  className={cn(
                    "flex gap-3 px-4 py-3",
                    i > 0 && "border-t border-dashboard-border"
                  )}
                >
                  <Icon
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      iconClass(n.type),
                      n.type === "processing" && "animate-spin"
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-neutral-black">{n.message}</p>
                    <p className="mt-0.5 truncate text-xs font-semibold text-brand-purple-dark">
                      {n.account}
                    </p>
                    {timeLabel ? (
                      <p className="mt-1 text-xs text-dashboard-muted">{timeLabel}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export { NOTIF_LAST_SEEN_KEY };
