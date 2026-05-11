import { Button } from "@/components/ui/Button";
import type { Publico } from "@/lib/stores/wizardStore";

interface PublicosSalvosGridProps {
  publicos: Publico[];
  onSelect: (publico: Publico) => void;
  onDelete: (id: string) => void;
}

export function PublicosSalvosGrid({ publicos, onSelect, onDelete }: PublicosSalvosGridProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {publicos.map((publico) => (
        <article key={publico.id} className="rounded-xl border border-[#1e2130] bg-[#141720] p-4">
          <p className="text-sm font-semibold text-white">{publico.name}</p>
          <p className="mt-1 text-xs text-[#686b82]">
            {publico.ageMin}–{publico.ageMax} anos • {publico.gender}
          </p>
          <p className="mt-2 text-xs text-[#686b82]">
            {publico.locations.length
              ? publico.locations.map((location) => location.name).join(", ")
              : "Sem localidade definida"}
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="subtle" className="px-3 py-1.5 text-sm" onClick={() => onSelect(publico)}>
              Usar
            </Button>
            <Button variant="ghost" className="px-3 py-1.5 text-sm" onClick={() => onDelete(publico.id)}>
              Excluir
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
