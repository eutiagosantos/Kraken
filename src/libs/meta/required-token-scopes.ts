/** Client-safe scope lists (no Node crypto). Keep in sync with Supabase Facebook OAuth scopes. */

export const REQUIRED_TOKEN_SCOPES = [
  "ads_management",
  "ads_read",
  "pages_show_list",
  "pages_manage_ads",
  "pages_read_engagement",
  "pages_read_user_content",
  "pages_manage_posts",
] as const;

/** Scopes for catalog / feed / product-set Graph routes. */
export const REQUIRED_TOKEN_SCOPES_FOR_CATALOG = [
  ...REQUIRED_TOKEN_SCOPES,
  "catalog_management",
] as const;

/** Page tokens from `/me/accounts` (engagement posts). */
export const REQUIRED_PAGE_TOKEN_SCOPES_FOR_ENGAGEMENT_POSTS = [
  "pages_show_list",
  "pages_manage_ads",
  "pages_read_engagement",
  "pages_read_user_content",
] as const;
