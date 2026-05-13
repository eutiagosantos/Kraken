/**
 * Safe pairing for **new** Meta ad accounts when the official billing + optimization map is rejected.
 * This is **not** the Marketing API default for mature accounts — see `lib/meta/billing-event.ts` for the official map.
 *
 * Confirmed safe on new accounts (May 2026):
 *   - billing_event: POST_ENGAGEMENT
 *   - optimization_goal: POST_ENGAGEMENT
 *   - bid_strategy: LOWEST_COST_WITHOUT_CAP (no bid_amount required)
 *
 * Blocked on new accounts (examples):
 *   - billing_event: IMPRESSIONS
 *   - billing_event: LINK_CLICKS
 *   - bid_strategy: COST_CAP / LOWEST_COST_WITH_BID_CAP (requires bid_amount and spend history)
 */

export const META_NEW_ACCOUNT_BILLING_EVENT = "POST_ENGAGEMENT" as const;
export const META_NEW_ACCOUNT_OPTIMIZATION_GOAL = "POST_ENGAGEMENT" as const;
export const META_NEW_ACCOUNT_BID_STRATEGY = "LOWEST_COST_WITHOUT_CAP" as const;

/** billing_event values blocked on new Meta ad accounts */
export const META_BLOCKED_BILLING_EVENTS_NEW_ACCOUNT = ["IMPRESSIONS", "LINK_CLICKS"] as const;

/**
 * Returns the POST_ENGAGEMENT × POST_ENGAGEMENT fallback used when a new ad account rejects
 * the billing_event from the official optimization_goal map (`billing-event.ts`).
 */
export function safeNewAccountAdSetParams(): {
  optimization_goal: typeof META_NEW_ACCOUNT_OPTIMIZATION_GOAL;
  billing_event: typeof META_NEW_ACCOUNT_BILLING_EVENT;
  bid_strategy: typeof META_NEW_ACCOUNT_BID_STRATEGY;
} {
  return {
    optimization_goal: META_NEW_ACCOUNT_OPTIMIZATION_GOAL,
    billing_event: META_NEW_ACCOUNT_BILLING_EVENT,
    bid_strategy: META_NEW_ACCOUNT_BID_STRATEGY,
  };
}
