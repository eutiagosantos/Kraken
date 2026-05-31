import { Play, X } from "lucide-react";
import type { Creative } from "@/lib/stores/wizardStore";

const META_PRIMARY_TEXT_MAX = 2000;
const META_CREATIVE_NAME_MAX = 256;

interface CreativeGridProps {
  creatives: Creative[];
  onRemove: (id: string) => void;
  onUpdateCreative: (id: string, patch: Partial<Pick<Creative, "primaryText" | "name">>) => void;
}

function formatSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${mb.toFixed(1)} MB`;
}

export function CreativeGrid({ creatives, onRemove, onUpdateCreative }: CreativeGridProps) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
      {creatives.map((creative) => (
        <article key={creative.id} className="group overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="flex flex-col sm:flex-row">
            <div className="relative aspect-square w-full shrink-0 bg-gray-100 sm:w-36 sm:min-w-[9rem]">
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
            <div className="min-w-0 flex-1 p-3">
              <p className="mb-1 text-[11px] text-gray-500">{formatSize(creative.size)}</p>
              <label className="block text-[11px] font-medium text-gray-700" htmlFor={`creative-name-${creative.id}`}>
                Nome no Meta
              </label>
              <input
                id={`creative-name-${creative.id}`}
                type="text"
                value={creative.name}
                onChange={(e) => {
                  const next = e.target.value.slice(0, META_CREATIVE_NAME_MAX);
                  onUpdateCreative(creative.id, { name: next });
                }}
                maxLength={META_CREATIVE_NAME_MAX}
                className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 outline-none ring-[#7132f5] ring-offset-1 focus:border-[#7132f5] focus:ring-1"
              />
              <p className="mt-0.5 text-[10px] text-gray-500">
                {creative.name.length} / {META_CREATIVE_NAME_MAX}
              </p>
              <label className="mt-2 block text-[11px] font-medium text-gray-700" htmlFor={`creative-copy-${creative.id}`}>
                Texto do anúncio
              </label>
              <textarea
                id={`creative-copy-${creative.id}`}
                value={creative.primaryText}
                onChange={(e) => {
                  const next = e.target.value.slice(0, META_PRIMARY_TEXT_MAX);
                  onUpdateCreative(creative.id, { primaryText: next });
                }}
                rows={4}
                placeholder="Opcional — se ficar vazio, usa-se o nome acima no corpo do anúncio no Meta."
                className="mt-1 w-full resize-y rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 outline-none ring-[#7132f5] ring-offset-1 focus:border-[#7132f5] focus:ring-1"
              />
              <p className="mt-1 text-[10px] text-gray-500">
                {creative.primaryText.length} / {META_PRIMARY_TEXT_MAX}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
