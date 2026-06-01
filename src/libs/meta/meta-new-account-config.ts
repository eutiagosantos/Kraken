/**
 * Safe pairing for **new** Meta ad accounts when the official billing + optimization map is rejected
 * (e.g. «cobrança indisponível» para contas novas).
 * This is **not** the Marketing API default for mature accounts — see `lib/meta/billing-event.ts` for the official map.
 *
 * Valid pairing for Marketing API when moving optimisation to post engagement on restricted accounts:
 *   - optimization_goal: POST_ENGAGEMENT
 *   - billing_event: IMPRESSIONS (required for this goal; `POST_ENGAGEMENT` billing is not valid with this goal)
 *   - bid_strategy: LOWEST_COST_WITHOUT_CAP (no bid_amount required)
 *
 * Often restricted on new accounts (examples; exact rules vary by Meta):
 *   - billing_event: LINK_CLICKS (with LINK_CLICKS goal)
 *   - bid_strategy: COST_CAP / LOWEST_COST_WITH_BID_CAP without spend history
 */

export const META_NEW_ACCOUNT_BILLING_EVENT = "IMPRESSIONS" as const;
export const META_NEW_ACCOUNT_OPTIMIZATION_GOAL = "POST_ENGAGEMENT" as const;
export const META_NEW_ACCOUNT_BID_STRATEGY = "LOWEST_COST_WITHOUT_CAP" as const;

/** billing_event values that new Meta ad accounts sometimes reject for traffic-style goals */
export const META_BLOCKED_BILLING_EVENTS_NEW_ACCOUNT = ["IMPRESSIONS", "LINK_CLICKS"] as const;

/**
 * Fallback when a new ad account rejects the billing_event from the official optimization_goal map
 * (`billing-event.ts`): engagement-style optimisation with impression billing.
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
