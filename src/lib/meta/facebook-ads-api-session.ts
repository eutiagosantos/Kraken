import { Campaign, FacebookAdsApi } from "facebook-nodejs-business-sdk";

import { META_GRAPH_VERSION } from "@/lib/meta/constants";

/**
 * Runs `fn` with the Business SDK initialised for a **user** OAuth access token.
 * Keep imports of this module on the server only (API routes, `publish-campaigns`, etc.).
 *
 * @see https://developers.facebook.com/docs/business-sdk/getting-started/
 */
export async function withUserFacebookAdsApi<T>(accessToken: string, fn: () => Promise<T>): Promise<T> {
  const api = FacebookAdsApi.init(accessToken) as unknown as { setVersion(v: string): void };
  api.setVersion(META_GRAPH_VERSION);
  return fn();
}

/** Deletes a campaign by Graph object id (same as `DELETE /{campaign-id}`). */
export async function deleteCampaignWithBusinessSdk(options: {
  campaignId: string;
  accessToken: string;
}): Promise<void> {
  await withUserFacebookAdsApi(options.accessToken, async () => {
    const campaign = new Campaign(options.campaignId);
    await campaign.delete([]);
  });
}
