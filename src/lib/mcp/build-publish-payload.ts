import { randomUUID } from "node:crypto";
import { z } from "zod";

import { WIZARD_AD_SET_BILLING_EVENTS } from "@/lib/meta/billing-event";
import { defaultCampaignSchedule } from "@/lib/meta/campaign-schedule";
import {
  adsetAndAdsCountsForWizardShape,
  budgetMinorUnits,
  publicoSchema,
  wizardPublishPayloadSchema,
  type WizardPublishPayload,
} from "@/lib/meta/map-wizard-to-graph";

export const mcpCreativeSchema = z.object({
  url: z.string().url().max(2048),
  id: z.string().optional(),
  name: z.string().min(1).max(256),
  type: z.enum(["image", "video"]),
  primaryText: z.string().max(2000).optional(),
});

/** Conversational campaign args shared by prepare_campaign and publish_campaign. */
export const mcpCampaignArgsSchema = z.object({
  selectedAccountIds: z.array(z.string().min(1)).min(1),
  creatives: z.array(mcpCreativeSchema).min(1),
  campaignType: z.enum(["CBO", "ABO", "DPA"]),
  budget: z.number().positive(),
  budgetPeriod: z.enum(["daily", "lifetime"]),
  bidStrategy: z.enum(["LOWEST_COST", "BID_CAP", "COST_CAP", "ROAS"]),
  bidLimit: z.number().optional(),
  roasTarget: z.number().optional(),
  objective: z.string().min(1),
  pixelId: z.string().default(""),
  status: z.enum(["ACTIVE", "PAUSED"]),
  structure: z.enum(["1-1-1", "1-3-5", "1-50-1", "1-250-1", "custom"]),
  customStructure: z
    .object({
      campaigns: z.number().int().positive(),
      adsets: z.number().int().positive(),
      ads: z.number().int().positive(),
    })
    .default({ campaigns: 1, adsets: 1, ads: 1 }),
  nomenclaturePreview: z.string().default("MCP Campaign"),
  publico: publicoSchema,
  antiSpy: z.boolean().optional().default(true),
  workspaceId: z.string().uuid().nullable().optional(),
  pageId: z.string().min(1).optional(),
  destinationUrl: z.string().max(2048).optional(),
  adSetBillingEvent: z.enum(WIZARD_AD_SET_BILLING_EVENTS).optional(),
});

export type McpCampaignArgs = z.infer<typeof mcpCampaignArgsSchema>;

export type McpCampaignPreview = {
  publishOperationId: string;
  payload: WizardPublishPayload;
  creativeUrls: string[];
  spendEstimate: {
    budgetMinorPerDay: number;
    accountCount: number;
    creativeCount: number;
    adsetCount: number;
    note: string;
  };
};

export function buildWizardPublishPayload(
  userId: string,
  publishOperationId: string,
  args: McpCampaignArgs
): WizardPublishPayload {
  const creativeStoragePaths = args.creatives.map((c, i) => {
    const ext = c.type === "image" ? "jpg" : "mp4";
    return `${userId}/${publishOperationId}/creative_${i}.${ext}`;
  });

  const creatives = args.creatives.map((c, i) => ({
    id: c.id?.trim() || `mcp-creative-${i}`,
    name: c.name,
    type: c.type,
    primaryText: c.primaryText,
  }));

  return wizardPublishPayloadSchema.parse({
    ...args,
    creatives,
    creativeStoragePaths,
    publishOperationId,
    campaignSchedule: defaultCampaignSchedule(),
  });
}

export function buildMcpCampaignPreview(
  userId: string,
  args: McpCampaignArgs,
  publishOperationId: string = randomUUID()
): McpCampaignPreview {
  const payload = buildWizardPublishPayload(userId, publishOperationId, args);
  const { adsets } = adsetAndAdsCountsForWizardShape(payload.structure, payload.customStructure);
  const budgetMinor = budgetMinorUnits(payload.budget);

  return {
    publishOperationId,
    payload,
    creativeUrls: args.creatives.map((c) => c.url),
    spendEstimate: {
      budgetMinorPerDay: budgetMinor,
      accountCount: payload.selectedAccountIds.length,
      creativeCount: payload.creatives.length,
      adsetCount: adsets,
      note:
        "Estimativa orientativa: orçamento diário em centavos BRL por conjunto × contas × criativos. Confirme antes de publicar.",
    },
  };
}
