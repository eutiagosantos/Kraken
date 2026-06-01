import { z } from "zod";

/** Best-effort shape for `upload_jobs.summary` v1 (extra keys allowed). */
export const uploadJobSummaryV1Schema = z
  .object({
    v: z.literal(1).optional(),
    nomenclaturePreview: z.string().optional(),
    objective: z.string().optional(),
    campaignType: z.string().optional(),
    budget: z.number().optional(),
    budgetPeriod: z.string().optional(),
    bidStrategy: z.string().optional(),
    structure: z.string().optional(),
    structureDisplay: z.string().optional(),
    structureLabel: z.string().optional(),
    customStructure: z
      .object({
        campaigns: z.number(),
        adsets: z.number(),
        ads: z.number(),
      })
      .optional(),
    creativeCount: z.number().optional(),
    creativeNames: z.array(z.string()).optional(),
    creativeNamesExtra: z.number().optional(),
    accounts: z
      .array(
        z.object({
          meta_account_id: z.string(),
          name: z.string(),
        })
      )
      .optional(),
    publicoName: z.string().optional(),
    pixelId: z.string().optional(),
    workspaceId: z.string().optional(),
    campaignStatus: z.string().optional(),
    antiSpy: z.boolean().optional(),
  })
  .passthrough();

export type UploadJobSummaryV1 = z.infer<typeof uploadJobSummaryV1Schema>;

export const uploadJobErrorDetailsV1Schema = z
  .object({
    v: z.literal(1).optional(),
    message: z.string(),
    items: z
      .array(
        z.object({
          accountName: z.string(),
          creativeName: z.string(),
          error: z.string(),
        })
      )
      .optional(),
    warnings: z.array(z.string()).optional(),
  })
  .passthrough();

export type UploadJobErrorDetailsV1 = z.infer<typeof uploadJobErrorDetailsV1Schema>;

export function parseUploadJobSummary(raw: unknown): UploadJobSummaryV1 | null {
  if (raw == null || typeof raw !== "object") return null;
  const parsed = uploadJobSummaryV1Schema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function parseUploadJobErrorDetails(raw: unknown): UploadJobErrorDetailsV1 | null {
  if (raw == null || typeof raw !== "object") return null;
  const parsed = uploadJobErrorDetailsV1Schema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
