import type { GraphFetch } from "@/lib/meta/graph-client";
import { graphJsonPost } from "@/lib/meta/graph-client";

/** Create/update campaigns via Marketing API — token needs `ads_management` (and related scopes per Meta app config). */

export function normalizeActId(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  const without = trimmed.replace(/^act_/i, "");
  return `act_${without}`;
}

export async function graphCreateCampaign(options: {
  actId: string;
  accessToken: string;
  name: string;
  objective: string;
  status: "ACTIVE" | "PAUSED";
  /** CBO / DPA: set daily budget on campaign (minor currency units). Omit for ABO. */
  dailyBudgetMinor?: number;
  fetchImpl?: GraphFetch;
}): Promise<{ id: string }> {
  const body: Record<string, unknown> = {
    name: options.name.slice(0, 256),
    objective: options.objective,
    status: options.status,
    special_ad_categories: ["NONE"],
    buying_type: "AUCTION",
  };
  if (options.dailyBudgetMinor != null) {
    body.daily_budget = options.dailyBudgetMinor;
  }
  return graphJsonPost<{ id: string }>({
    path: `${options.actId}/campaigns`,
    accessToken: options.accessToken,
    body,
    fetchImpl: options.fetchImpl,
  });
}

export async function graphCreateAdSet(options: {
  actId: string;
  accessToken: string;
  name: string;
  campaignId: string;
  targeting: Record<string, unknown>;
  optimizationGoal: string;
  promotedObject?: Record<string, string>;
  billingEvent?: string;
  bidStrategy: string;
  bidAmount?: string;
  /** ABO: required when campaign has no CBO budget */
  dailyBudgetMinor?: number;
  status: "ACTIVE" | "PAUSED";
  fetchImpl?: GraphFetch;
}): Promise<{ id: string }> {
  const body: Record<string, unknown> = {
    name: options.name.slice(0, 256),
    campaign_id: options.campaignId,
    targeting: options.targeting,
    optimization_goal: options.optimizationGoal,
    billing_event: options.billingEvent ?? "IMPRESSIONS",
    bid_strategy: options.bidStrategy,
    status: options.status,
  };
  if (options.promotedObject && Object.keys(options.promotedObject).length > 0) {
    body.promoted_object = options.promotedObject;
  }
  if (options.bidAmount) {
    body.bid_amount = options.bidAmount;
  }
  if (options.dailyBudgetMinor != null) {
    body.daily_budget = options.dailyBudgetMinor;
  }
  return graphJsonPost<{ id: string }>({
    path: `${options.actId}/adsets`,
    accessToken: options.accessToken,
    body,
    fetchImpl: options.fetchImpl,
  });
}

export async function graphCreateAdCreative(options: {
  actId: string;
  accessToken: string;
  name: string;
  pageId: string;
  imageHash: string;
  linkUrl: string;
  message: string;
  fetchImpl?: GraphFetch;
}): Promise<{ id: string }> {
  const body = {
    name: options.name.slice(0, 256),
    object_story_spec: {
      page_id: options.pageId,
      link_data: {
        image_hash: options.imageHash,
        link: options.linkUrl,
        message: options.message.slice(0, 2000),
      },
    },
  };
  return graphJsonPost<{ id: string }>({
    path: `${options.actId}/adcreatives`,
    accessToken: options.accessToken,
    body,
    fetchImpl: options.fetchImpl,
  });
}

export async function graphCreateAd(options: {
  actId: string;
  accessToken: string;
  name: string;
  adSetId: string;
  creativeId: string;
  status: "ACTIVE" | "PAUSED";
  fetchImpl?: GraphFetch;
}): Promise<{ id: string }> {
  return graphJsonPost<{ id: string }>({
    path: `${options.actId}/ads`,
    accessToken: options.accessToken,
    body: {
      name: options.name.slice(0, 256),
      adset_id: options.adSetId,
      creative: { creative_id: options.creativeId },
      status: options.status,
    },
    fetchImpl: options.fetchImpl,
  });
}
