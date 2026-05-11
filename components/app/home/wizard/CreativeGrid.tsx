import { Play, X } from "lucide-react";
import type { Creative } from "@/lib/stores/wizardStore";

interface CreativeGridProps {
  creatives: Creative[];
  onRemove: (id: string) => void;
}

function formatSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${mb.toFixed(1)} MB`;
}

export function CreativeGrid({ creatives, onRemove }: CreativeGridProps) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
      {creatives.map((creative) => (
        <article key={creative.id} className="group overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="relative aspect-square bg-gray-100">
            {creative.type === "video" ? (
              <>
                <video src={creative.preview} className="h-full w-full object-cover opacity-70" muted />
                <Play className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-white" />
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creative.preview} alt={creative.name} className="h-full w-full object-cover" />
            )}
            <button
              type="button"
              onClick={() => onRemove(creative.id)}
              className="absolute right-2 top-2 rounded bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remover criativo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="p-2">
            <p className="truncate text-xs font-medium text-gray-900" title={creative.name}>
              {creative.name}
            </p>
            <p className="text-[11px] text-gray-500">{formatSize(creative.size)}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
