import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  full_name: text("full_name"),
  avatar_url: text("avatar_url"),
  onboarding_completed_at: timestamp("onboarding_completed_at", {
    withTimezone: true,
    mode: "string",
  }),
  clerk_id: text("clerk_id"),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  created_by: uuid("created_by").notNull(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const workspaceMembers = pgTable("workspace_members", {
  workspace_id: uuid("workspace_id").notNull(),
  user_id: uuid("user_id").notNull(),
  role: text("role").notNull(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const mcpApiKeys = pgTable("mcp_api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  name: text("name").notNull(),
  key_prefix: text("key_prefix").notNull(),
  key_hash: text("key_hash").notNull(),
  last_used_at: timestamp("last_used_at", { withTimezone: true, mode: "string" }),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  revoked_at: timestamp("revoked_at", { withTimezone: true, mode: "string" }),
});

export const userMetaApps = pgTable("user_meta_apps", {
  user_id: uuid("user_id").primaryKey(),
  meta_app_id: text("meta_app_id").notNull(),
  meta_app_secret_encrypted: text("meta_app_secret_encrypted").notNull(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const metaUserTokens = pgTable("meta_user_tokens", {
  user_id: uuid("user_id").primaryKey(),
  access_token: text("access_token").notNull(),
  token_expires_at: timestamp("token_expires_at", { withTimezone: true, mode: "string" }),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const metaAdAccounts = pgTable("meta_ad_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  workspace_id: uuid("workspace_id"),
  meta_account_id: text("meta_account_id").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull(),
  token_status: text("token_status").notNull(),
  token_expires_at: timestamp("token_expires_at", { withTimezone: true, mode: "string" }),
  connected_at: timestamp("connected_at", { withTimezone: true, mode: "string" }).notNull(),
  last_activity_at: timestamp("last_activity_at", { withTimezone: true, mode: "string" }),
  monthly_spend: doublePrecision("monthly_spend").notNull(),
  spend_delta: text("spend_delta"),
  spend_delta_type: text("spend_delta_type").notNull(),
  total_ads: integer("total_ads").notNull(),
  ads_this_month: integer("ads_this_month").notNull(),
  approval_rate: doublePrecision("approval_rate"),
  approval_delta: text("approval_delta"),
  default_budget: doublePrecision("default_budget"),
  default_structure: text("default_structure"),
  default_anti_spy: boolean("default_anti_spy"),
  spend_history: jsonb("spend_history").$type<Json>().notNull(),
  spend_series_extended: jsonb("spend_series_extended").$type<Json>().notNull(),
  recent_uploads: jsonb("recent_uploads").$type<Json>().notNull(),
  ads_approved: integer("ads_approved"),
  ads_pending: integer("ads_pending"),
  ads_rejected: integer("ads_rejected"),
  uploads_in_period: integer("uploads_in_period"),
  uploads_with_error: integer("uploads_with_error"),
  nickname: text("nickname"),
  facebook_page_id: text("facebook_page_id"),
  facebook_page_name: text("facebook_page_name"),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const campanhas = pgTable("campanhas", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  workspace_id: uuid("workspace_id"),
  name: text("name").notNull(),
  account_name: text("account_name").notNull(),
  account_meta_id: text("account_meta_id").notNull(),
  structure: text("structure").notNull(),
  objective: text("objective").notNull(),
  daily_budget: doublePrecision("daily_budget").notNull(),
  anti_spy: boolean("anti_spy").notNull(),
  status: text("status").notNull(),
  ads_created: integer("ads_created").notNull(),
  ads_total: integer("ads_total").notNull(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  trend: jsonb("trend").$type<Json>().notNull(),
  creatives: jsonb("creatives").$type<Json>().notNull(),
  errors: jsonb("errors").$type<Json | null>(),
  meta_ids: jsonb("meta_ids").$type<Json | null>(),
});

export const uploadJobs = pgTable("upload_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  account_name: text("account_name").notNull(),
  total: integer("total").notNull(),
  done: integer("done").notNull(),
  status: text("status").notNull(),
  started_at: timestamp("started_at", { withTimezone: true, mode: "string" }).notNull(),
  summary: jsonb("summary").$type<Json | null>(),
  finished_at: timestamp("finished_at", { withTimezone: true, mode: "string" }),
  error_details: jsonb("error_details").$type<Json | null>(),
});

export const metaCatalogs = pgTable("meta_catalogs", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  workspace_id: uuid("workspace_id"),
  meta_ad_account_id: uuid("meta_ad_account_id"),
  business_id: text("business_id").notNull(),
  meta_catalog_id: text("meta_catalog_id").notNull(),
  name: text("name").notNull(),
  raw_snapshot: jsonb("raw_snapshot").$type<Json | null>(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const metaProductSets = pgTable("meta_product_sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  catalog_id: uuid("catalog_id").notNull(),
  meta_product_set_id: text("meta_product_set_id").notNull(),
  name: text("name").notNull(),
  filter: jsonb("filter").$type<Json | null>(),
  is_dynamic: boolean("is_dynamic").notNull(),
  metadata: jsonb("metadata").$type<Json | null>(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const metaProductFeeds = pgTable("meta_product_feeds", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  catalog_id: uuid("catalog_id").notNull(),
  meta_feed_id: text("meta_feed_id").notNull(),
  name: text("name").notNull(),
  schedule: jsonb("schedule").$type<Json | null>(),
  last_sync_status: text("last_sync_status"),
  last_error: jsonb("last_error").$type<Json | null>(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const metaFeedUploads = pgTable("meta_feed_uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  feed_id: uuid("feed_id").notNull(),
  meta_upload_id: text("meta_upload_id"),
  status: text("status").notNull(),
  response: jsonb("response").$type<Json | null>(),
  errors: jsonb("errors").$type<Json | null>(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const metaSyncJobs = pgTable("meta_sync_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  job_type: text("job_type").notNull(),
  payload: jsonb("payload").$type<Json>().notNull(),
  idempotency_key: text("idempotency_key"),
  status: text("status").notNull(),
  attempt_count: integer("attempt_count").notNull(),
  next_run_at: timestamp("next_run_at", { withTimezone: true, mode: "string" }).notNull(),
  last_error: jsonb("last_error").$type<Json | null>(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const metaWebhookEvents = pgTable("meta_webhook_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  topic: text("topic"),
  payload: jsonb("payload").$type<Json>().notNull(),
  signature_valid: boolean("signature_valid").notNull(),
  received_at: timestamp("received_at", { withTimezone: true, mode: "string" }).notNull(),
  processed_at: timestamp("processed_at", { withTimezone: true, mode: "string" }),
});

export const metaPublishAudit = pgTable("meta_publish_audit", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  operation: text("operation").notNull(),
  request_payload: jsonb("request_payload").$type<Json | null>(),
  response_payload: jsonb("response_payload").$type<Json | null>(),
  graph_error: jsonb("graph_error").$type<Json | null>(),
  fbtrace_id: text("fbtrace_id"),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const activityEvents = pgTable("activity_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  account: text("account").notNull(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const homeKpis = pgTable("home_kpis", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  delta: text("delta"),
  delta_type: text("delta_type").notNull(),
  icon_color: text("icon_color"),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const creativeLibraryItems = pgTable("creative_library_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  name: text("name").notNull(),
  format: text("format").notNull(),
  status: text("status").notNull(),
  campaigns_count: integer("campaigns_count").notNull(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const savedPublicos = pgTable("saved_publicos", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  payload: jsonb("payload").$type<Json>().notNull(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});
