import { z } from "zod";

import { catalogPublishFlagsSchema } from "@/lib/meta/catalog-publish-flags";
import { publicoSchema } from "@/lib/meta/map-wizard-to-graph";
import { campaignScheduleSchema, defaultCampaignSchedule } from "@/lib/meta/campaign-schedule";

const bidStrategyEnum = z.enum(["LOWEST_COST", "BID_CAP", "COST_CAP", "ROAS"]);
const wizardAdSetBilling = z.enum(["IMPRESSIONS", "LINK_CLICKS", "POST_ENGAGEMENT"]);

/** Body for `POST /api/meta/catalog-publish` — catalog sales + DPA creative (no binary creatives). */
export const catalogPublishPayloadSchema = z.object({
  selectedAccountIds: z.array(z.string().min(1)).min(1),
  workspaceId: z.string().uuid().nullable().optional(),
  businessId: z.string().min(1),
  productCatalogId: z.string().min(1),
  productSetId: z.string().min(1),
  pixelId: z.string().min(1),
  customEventType: z.enum(["PURCHASE", "ADD_TO_CART", "CONTENT_VIEW"]),
  pageId: z.string().min(1),
  instagramActorId: z.string().optional(),
  destinationUrl: z.string().min(1).max(2048),
  message: z.string().min(1).max(2000),
  catalogCreativeName: z.string().max(256).optional(),
  status: z.enum(["ACTIVE", "PAUSED"]),
  objective: z.string().min(1).default("OUTCOME_SALES"),
  budget: z.number().positive(),
  budgetPeriod: z.enum(["daily", "lifetime"]),
  campaignType: z.enum(["CBO", "ABO"]),
  bidStrategy: bidStrategyEnum,
  bidLimit: z.number().optional(),
  nomenclaturePreview: z.string().max(512).optional(),
  publico: publicoSchema,
  antiSpy: z.boolean().optional().default(true),
  campaignSchedule: campaignScheduleSchema.default(() => defaultCampaignSchedule()),
  adSetBillingEvent: wizardAdSetBilling.optional(),
  flags: catalogPublishFlagsSchema.optional(),
});

export type CatalogPublishPayload = z.infer<typeof catalogPublishPayloadSchema>;
