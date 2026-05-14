/**
 * Scopes requested on `signInWithOAuth({ provider: "facebook" })`.
 * Keep in sync with Meta app permissions and `REQUIRED_TOKEN_SCOPES` in `graph-inspect-token.ts`.
 */
export const META_FACEBOOK_OAUTH_SCOPE_LIST = [
  "email",
  "public_profile",
  "ads_read",
  "ads_management",
  /** Catalog / feeds / product sets (Marketing API + Catalog API). */
  "catalog_management",
  "business_management",
  "pages_show_list",
  "pages_manage_ads",
  "pages_read_engagement",
  "pages_read_user_content",
  "pages_manage_posts",
  "read_insights",
] as const;

export const META_FACEBOOK_OAUTH_SCOPES = META_FACEBOOK_OAUTH_SCOPE_LIST.join(",");
