import type { CatalogCustomEventType } from "@/lib/meta/catalog-promoted-object";

export type CatalogAdCreativeTemplateInput = {
  pageId: string;
  link: string;
  message: string;
  name?: string;
  /** Optional IG actor for placements that include Instagram */
  instagramActorId?: string;
};

/**
 * `object_story_spec` for Dynamic Product / catalog template ads (link + template_data).
 * @see https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/ads-management
 */
export function buildCatalogDpaObjectStorySpec(input: CatalogAdCreativeTemplateInput): Record<string, unknown> {
  const message = input.message.slice(0, 2000);
  const spec: Record<string, unknown> = {
    page_id: input.pageId,
    template_data: {
      link: input.link,
      message,
      ...(input.name?.trim() ? { name: input.name.trim().slice(0, 256) } : {}),
      call_to_action: {
        type: "SHOP_NOW",
        value: { link: input.link },
      },
      multi_share_end_card: true,
    },
  };
  if (input.instagramActorId?.trim()) {
    spec.instagram_actor_id = input.instagramActorId.trim();
  }
  return spec;
}

export function defaultCatalogCustomEventForObjective(objective: string): CatalogCustomEventType {
  if (objective === "OUTCOME_LEADS") return "CONTENT_VIEW";
  return "PURCHASE";
}
