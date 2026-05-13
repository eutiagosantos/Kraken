import type { GraphFetch } from "@/lib/meta/graph-client";
import { graphDelete, graphJsonPost } from "@/lib/meta/graph-client";

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
  /** CBO / DPA: set daily budget on campaign (minor currency units). Omit for ABO / lifetime. */
  dailyBudgetMinor?: number;
  /** CBO / DPA lifetime: total budget for the flight (minor units). Use with startTime + endTime. */
  lifetimeBudgetMinor?: number;
  startTime?: string;
  endTime?: string;
  /** CBO/DPA: Meta expects `bid_strategy` on the campaign when budget lives on the campaign. */
  bidStrategy?: string;
  fetchImpl?: GraphFetch;
}): Promise<{ id: string }> {
  const body: Record<string, unknown> = {
    name: options.name.slice(0, 256),
    objective: options.objective,
    status: options.status,
    special_ad_categories: ["NONE"],
    buying_type: "AUCTION",
  };
  if (options.bidStrategy?.trim()) {
    body.bid_strategy = options.bidStrategy.trim();
  }
  if (options.dailyBudgetMinor != null) {
    body.daily_budget = options.dailyBudgetMinor;
  }
  if (options.lifetimeBudgetMinor != null) {
    body.lifetime_budget = options.lifetimeBudgetMinor;
  }
  if (options.startTime) {
    body.start_time = options.startTime;
  }
  if (options.endTime) {
    body.end_time = options.endTime;
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
  /** Required — use {@link defaultBillingEventForOptimizationGoal} from `billing-event.ts` when deriving. */
  billingEvent: string;
  /** Omit under CBO when strategy is set on the campaign (Meta); ABO should pass this. */
  bidStrategy?: string;
  bidAmount?: string;
  /** ABO: required when campaign has no CBO budget */
  dailyBudgetMinor?: number;
  /** ABO lifetime: per–ad set total (minor units); use with startTime + endTime */
  lifetimeBudgetMinor?: number;
  startTime?: string;
  /** Lifetime: ISO offset string. Daily ongoing: numeric `0` per Marketing API. */
  endTime?: string | number;
  destinationType?: string;
  dsaBeneficiary?: string;
  dsaPayor?: string;
  status: "ACTIVE" | "PAUSED";
  /** Dayparting — times use ad account timezone on Meta. */
  adsetSchedule?: Array<{ days: number[]; start_minute: number; end_minute: number }>;
  frequencyControlSpecs?: Array<{ event: string; interval_days: number; max_frequency: number }>;
  fetchImpl?: GraphFetch;
}): Promise<{ id: string }> {
  const body: Record<string, unknown> = {
    name: options.name.slice(0, 256),
    campaign_id: options.campaignId,
    targeting: options.targeting,
    optimization_goal: options.optimizationGoal,
    billing_event: options.billingEvent,
    status: options.status,
  };
  if (options.bidStrategy?.trim()) {
    body.bid_strategy = options.bidStrategy.trim();
  }
  if (options.promotedObject && Object.keys(options.promotedObject).length > 0) {
    body.promoted_object = options.promotedObject;
  }
  if (options.bidAmount) {
    body.bid_amount = options.bidAmount;
  }
  if (options.dailyBudgetMinor != null) {
    body.daily_budget = options.dailyBudgetMinor;
  }
  if (options.lifetimeBudgetMinor != null) {
    body.lifetime_budget = options.lifetimeBudgetMinor;
  }
  if (options.startTime) {
    body.start_time = options.startTime;
  }
  if (options.endTime !== undefined && options.endTime !== "") {
    body.end_time = options.endTime;
  }
  if (options.destinationType) {
    body.destination_type = options.destinationType;
  }
  if (options.dsaBeneficiary?.trim()) {
    body.dsa_beneficiary = options.dsaBeneficiary.trim();
  }
  if (options.dsaPayor?.trim()) {
    body.dsa_payor = options.dsaPayor.trim();
  }
  if (options.adsetSchedule && options.adsetSchedule.length > 0) {
    body.adset_schedule = options.adsetSchedule;
  }
  if (options.frequencyControlSpecs && options.frequencyControlSpecs.length > 0) {
    body.frequency_control_specs = options.frequencyControlSpecs;
  }
  return graphJsonPost<{ id: string }>({
    path: `${options.actId}/adsets`,
    accessToken: options.accessToken,
    body,
    fetchImpl: options.fetchImpl,
  });
}

export type AdCreativeMedia =
  | { kind: "image"; imageHash: string }
  | { kind: "video"; videoId: string; thumbnailImageUrl: string };

/** Builds `object_story_spec` for Marketing API `adcreatives` (exposed for tests). */
export function buildAdCreativeObjectStorySpec(options: {
  pageId: string;
  media: AdCreativeMedia;
  linkUrl: string;
  message: string;
}): Record<string, unknown> {
  const message = options.message.slice(0, 2000);
  return options.media.kind === "image"
    ? {
        page_id: options.pageId,
        link_data: {
          image_hash: options.media.imageHash,
          link: options.linkUrl,
          message,
          call_to_action: {
            type: "LEARN_MORE",
            value: { link: options.linkUrl },
          },
        },
      }
    : {
        page_id: options.pageId,
        video_data: {
          video_id: options.media.videoId,
          image_url: options.media.thumbnailImageUrl,
          message,
          call_to_action: {
            type: "LEARN_MORE",
            value: { link: options.linkUrl },
          },
        },
      };
}

export async function graphCreateAdCreative(options: {
  actId: string;
  accessToken: string;
  name: string;
  pageId: string;
  media: AdCreativeMedia;
  linkUrl: string;
  message: string;
  fetchImpl?: GraphFetch;
}): Promise<{ id: string }> {
  const objectStorySpec = buildAdCreativeObjectStorySpec({
    pageId: options.pageId,
    media: options.media,
    linkUrl: options.linkUrl,
    message: options.message,
  });
  const body = {
    name: options.name.slice(0, 256),
    object_story_spec: objectStorySpec,
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

/** Remove a campaign (and child ad sets/ads). */
export async function graphDeleteCampaign(options: {
  campaignId: string;
  accessToken: string;
  fetchImpl?: GraphFetch;
}): Promise<void> {
  await graphDelete({
    path: options.campaignId,
    accessToken: options.accessToken,
    fetchImpl: options.fetchImpl,
  });
}
