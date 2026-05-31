import { z } from "zod";

/**
 * Flags pedidas para reduzir automações indesejadas da Meta.
 * Campos extra no AdSet/Campaign só são enviados quando mapeados de forma estável na API v25;
 * até lá, `toAdSetExtraFields` pode devolver `{}` (no-op) — os valores ficam em audit/log.
 */
export const catalogPublishFlagsSchema = z
  .object({
    disable_advantage_expansion: z.boolean().optional(),
    disable_auto_product_selection: z.boolean().optional(),
    disable_dynamic_url_matching: z.boolean().optional(),
    disable_auto_catalog_override: z.boolean().optional(),
  })
  .strict();

export type CatalogPublishFlags = z.infer<typeof catalogPublishFlagsSchema>;

/**
 * Extensões opcionais para o corpo do `adset` (além dos campos já usados em `graphCreateAdSet`).
 * Hoje devolve objeto vazio: a Meta muda frequentemente os nomes dos switches Advantage+.
 * Mantém `flags` no payload de audit para análise humana.
 */
export function catalogFlagsToAdSetExtraFields(): Record<string, unknown> {
  return {};
}
