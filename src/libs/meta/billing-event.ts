/**
 * Meta Marketing API `billing_event` values relevant to Kraken.
 *
 * `CLICKS`, `OFFER_CLAIMS`, and `NONE` appear in older Meta docs / completeness lists;
 * the wizard and publish payload only use the subset validated by {@link WIZARD_AD_SET_BILLING_EVENTS}.
 */
export type BillingEvent =
  | "IMPRESSIONS"
  | "LINK_CLICKS"
  | "THRUPLAY"
  | "TWO_SECOND_CONTINUOUS_VIDEO_VIEWS"
  | "POST_ENGAGEMENT"
  | "CLICKS"
  | "OFFER_CLAIMS"
  | "NONE";

/** Values the wizard may send as `adSetBillingEvent` (never POST_ENGAGEMENT — reserved for server-side new-account fallback). */
export const WIZARD_AD_SET_BILLING_EVENTS = [
  "IMPRESSIONS",
  "LINK_CLICKS",
  "THRUPLAY",
  "TWO_SECOND_CONTINUOUS_VIDEO_VIEWS",
] as const;

export type WizardAdSetBillingEvent = (typeof WIZARD_AD_SET_BILLING_EVENTS)[number];

const IMPRESSIONS_ONLY_GOALS = new Set<string>([
  "APP_INSTALLS",
  "AD_RECALL_LIFT",
  "ENGAGED_USERS",
  "EVENT_RESPONSES",
  "IMPRESSIONS",
  "LEAD_GENERATION",
  "OFFSITE_CONVERSIONS",
  "PAGE_LIKES",
  "POST_ENGAGEMENT",
  "REACH",
  "REPLIES",
  "SOCIAL_IMPRESSIONS",
  "VALUE",
  "LANDING_PAGE_VIEWS",
]);

/**
 * Ordered: most specific first, then IMPRESSIONS when the API allows a choice.
 * Unknown optimization goals: IMPRESSIONS only (safe default).
 */
export function validBillingEventsForOptimizationGoal(optimizationGoal: string): readonly BillingEvent[] {
  switch (optimizationGoal) {
    case "LINK_CLICKS":
      return ["LINK_CLICKS", "IMPRESSIONS"];
    case "THRUPLAY":
      return ["THRUPLAY", "IMPRESSIONS"];
    case "TWO_SECOND_CONTINUOUS_VIDEO_VIEWS":
      return ["TWO_SECOND_CONTINUOUS_VIDEO_VIEWS", "IMPRESSIONS"];
    default:
      if (IMPRESSIONS_ONLY_GOALS.has(optimizationGoal)) {
        return ["IMPRESSIONS"];
      }
      return ["IMPRESSIONS"];
  }
}

/** Default billing per Meta rules: specific billing when multiple choices exist; otherwise IMPRESSIONS. */
export function defaultBillingEventForOptimizationGoal(optimizationGoal: string): BillingEvent {
  const v = validBillingEventsForOptimizationGoal(optimizationGoal);
  return v[0] ?? "IMPRESSIONS";
}

/** @deprecated Prefer {@link defaultBillingEventForOptimizationGoal}; kept for call sites that only need the default string. */
export function billingEventForOptimization(optimizationGoal: string): BillingEvent {
  return defaultBillingEventForOptimizationGoal(optimizationGoal);
}

export function isWizardAdSetBillingEvent(s: string): s is WizardAdSetBillingEvent {
  return (WIZARD_AD_SET_BILLING_EVENTS as readonly string[]).includes(s);
}
