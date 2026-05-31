import type { NomenclatureToken } from "@/lib/stores/wizardStore";

/** Valores resolvidos para placeholders da nomenclatura (preview no wizard). */
export type NomenclaturePreviewContext = {
  contaNome: string;
  contaApelido: string;
  contaId: string;
  budget: string;
  estrutura: string;
  pixel: string;
  objetivo: string;
  criativo: string;
  /** Catálogo DPA: ainda sem fonte no wizard — placeholder neutro. */
  catalogo: string;
  /** Fila / fila de publicação: sem fonte — placeholder neutro. */
  idFila: string;
  /** Exemplo de formato até existir sequencial real na publicação. */
  seq: string;
  /** Data de referência para tokens `{{data_*}}` (default: instante da chamada). */
  now?: Date;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function dateTokenValue(key: string, d: Date): string | null {
  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  const yy = String(d.getFullYear()).slice(-2);
  const yyyy = String(d.getFullYear());

  switch (key) {
    case "{{data_dd_mm_aa_}}":
      return `${dd}_${mm}_${yy}`;
    case "{{data_dd-mm-aa}}":
      return `${dd}-${mm}-${yy}`;
    case "{{data_dd.mm.aa}}":
      return `${dd}.${mm}.${yy}`;
    case "{{data_dd/mm/aa}}":
      return `${dd}/${mm}/${yy}`;
    case "{{data_ddmmaa}}":
      return `${dd}${mm}${yy}`;
    case "{{data_dd_mm_aaaa}}":
      return `${dd}_${mm}_${yyyy}`;
    case "{{data_dd_mm}}":
      return `${dd}_${mm}`;
    case "{{data_dd/mm}}":
      return `${dd}/${mm}`;
    case "{{data_mm_dd_aa}}":
      return `${mm}_${dd}_${yy}`;
    case "{{data_mm-dd-aa}}":
      return `${mm}-${dd}-${yy}`;
    default:
      return null;
  }
}

function resolveVariableValue(key: string, ctx: NomenclaturePreviewContext): string {
  const dateVal = dateTokenValue(key, ctx.now ?? new Date());
  if (dateVal !== null) return dateVal;

  switch (key) {
    case "{{conta_nome}}":
      return ctx.contaNome;
    case "{{conta_apelido}}":
      return ctx.contaApelido;
    case "{{conta_id}}":
      return ctx.contaId;
    case "{{budget}}":
      return ctx.budget;
    case "{{estrutura}}":
      return ctx.estrutura;
    case "{{pixel}}":
      return ctx.pixel;
    case "{{objetivo}}":
      return ctx.objetivo;
    case "{{id_fila}}":
      return ctx.idFila;
    case "{{criativo}}":
      return ctx.criativo;
    case "{{catalogo}}":
      return ctx.catalogo;
    case "{{seq}}":
      return ctx.seq;
    default:
      return "—";
  }
}

export function buildNomenclaturePreview(tokens: NomenclatureToken[], context: NomenclaturePreviewContext): string {
  return tokens
    .map((token, index) => {
      if (token.type !== "variable") {
        return token.value;
      }

      const resolvedValue = resolveVariableValue(token.value, context);
      const nextToken = tokens[index + 1];
      const separator = nextToken?.type === "variable" ? "-" : "";

      return `[${resolvedValue}]${separator}`;
    })
    .join("");
}
