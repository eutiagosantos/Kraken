-- Meta Catalog / feeds / sync jobs / webhook audit (Kraken-side mirrors of Meta object ids)

-- Product catalogs linked to a Kraken user + optional workspace + ad account row
create table if not exists public.meta_catalogs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  meta_ad_account_id uuid references public.meta_ad_accounts (id) on delete set null,
  business_id text not null,
  meta_catalog_id text not null,
  name text not null default '',
  raw_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, meta_catalog_id)
);

create index if not exists meta_catalogs_user_idx on public.meta_catalogs (user_id);
create index if not exists meta_catalogs_workspace_idx on public.meta_catalogs (workspace_id);

alter table public.meta_catalogs enable row level security;

drop policy if exists "meta_catalogs_select_own" on public.meta_catalogs;
create policy "meta_catalogs_select_own"
  on public.meta_catalogs for select
  using (user_id = auth.uid());

drop policy if exists "meta_catalogs_insert_own" on public.meta_catalogs;
create policy "meta_catalogs_insert_own"
  on public.meta_catalogs for insert
  with check (user_id = auth.uid());

drop policy if exists "meta_catalogs_update_own" on public.meta_catalogs;
create policy "meta_catalogs_update_own"
  on public.meta_catalogs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "meta_catalogs_delete_own" on public.meta_catalogs;
create policy "meta_catalogs_delete_own"
  on public.meta_catalogs for delete
  using (user_id = auth.uid());

-- Product sets (Meta ids) under a saved catalog row
create table if not exists public.meta_product_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  catalog_id uuid not null references public.meta_catalogs (id) on delete cascade,
  meta_product_set_id text not null,
  name text not null default '',
  filter jsonb,
  is_dynamic boolean not null default true,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, meta_product_set_id)
);

create index if not exists meta_product_sets_catalog_idx on public.meta_product_sets (catalog_id);

alter table public.meta_product_sets enable row level security;

drop policy if exists "meta_product_sets_select_own" on public.meta_product_sets;
create policy "meta_product_sets_select_own"
  on public.meta_product_sets for select
  using (user_id = auth.uid());

drop policy if exists "meta_product_sets_insert_own" on public.meta_product_sets;
create policy "meta_product_sets_insert_own"
  on public.meta_product_sets for insert
  with check (user_id = auth.uid());

drop policy if exists "meta_product_sets_update_own" on public.meta_product_sets;
create policy "meta_product_sets_update_own"
  on public.meta_product_sets for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "meta_product_sets_delete_own" on public.meta_product_sets;
create policy "meta_product_sets_delete_own"
  on public.meta_product_sets for delete
  using (user_id = auth.uid());

-- Product feeds
create table if not exists public.meta_product_feeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  catalog_id uuid not null references public.meta_catalogs (id) on delete cascade,
  meta_feed_id text not null,
  name text not null default '',
  schedule jsonb,
  last_sync_status text,
  last_error jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, meta_feed_id)
);

create index if not exists meta_product_feeds_catalog_idx on public.meta_product_feeds (catalog_id);

alter table public.meta_product_feeds enable row level security;

drop policy if exists "meta_product_feeds_select_own" on public.meta_product_feeds;
create policy "meta_product_feeds_select_own"
  on public.meta_product_feeds for select
  using (user_id = auth.uid());

drop policy if exists "meta_product_feeds_insert_own" on public.meta_product_feeds;
create policy "meta_product_feeds_insert_own"
  on public.meta_product_feeds for insert
  with check (user_id = auth.uid());

drop policy if exists "meta_product_feeds_update_own" on public.meta_product_feeds;
create policy "meta_product_feeds_update_own"
  on public.meta_product_feeds for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "meta_product_feeds_delete_own" on public.meta_product_feeds;
create policy "meta_product_feeds_delete_own"
  on public.meta_product_feeds for delete
  using (user_id = auth.uid());

-- Feed upload batches (Meta upload ids)
create table if not exists public.meta_feed_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feed_id uuid not null references public.meta_product_feeds (id) on delete cascade,
  meta_upload_id text,
  status text not null default 'pending',
  response jsonb,
  errors jsonb,
  created_at timestamptz not null default now()
);

create index if not exists meta_feed_uploads_feed_idx on public.meta_feed_uploads (feed_id);

alter table public.meta_feed_uploads enable row level security;

drop policy if exists "meta_feed_uploads_select_own" on public.meta_feed_uploads;
create policy "meta_feed_uploads_select_own"
  on public.meta_feed_uploads for select
  using (user_id = auth.uid());

drop policy if exists "meta_feed_uploads_insert_own" on public.meta_feed_uploads;
create policy "meta_feed_uploads_insert_own"
  on public.meta_feed_uploads for insert
  with check (user_id = auth.uid());

drop policy if exists "meta_feed_uploads_update_own" on public.meta_feed_uploads;
create policy "meta_feed_uploads_update_own"
  on public.meta_feed_uploads for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Async sync / validation jobs (DB-backed queue)
create table if not exists public.meta_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_type text not null,
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text,
  status text not null default 'pending',
  attempt_count integer not null default 0,
  next_run_at timestamptz not null default now(),
  last_error jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists meta_sync_jobs_user_idempotency_unique
  on public.meta_sync_jobs (user_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists meta_sync_jobs_status_next_idx
  on public.meta_sync_jobs (status, next_run_at);

alter table public.meta_sync_jobs enable row level security;

drop policy if exists "meta_sync_jobs_select_own" on public.meta_sync_jobs;
create policy "meta_sync_jobs_select_own"
  on public.meta_sync_jobs for select
  using (user_id = auth.uid());

drop policy if exists "meta_sync_jobs_insert_own" on public.meta_sync_jobs;
create policy "meta_sync_jobs_insert_own"
  on public.meta_sync_jobs for insert
  with check (user_id = auth.uid());

drop policy if exists "meta_sync_jobs_update_own" on public.meta_sync_jobs;
create policy "meta_sync_jobs_update_own"
  on public.meta_sync_jobs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "meta_sync_jobs_delete_own" on public.meta_sync_jobs;
create policy "meta_sync_jobs_delete_own"
  on public.meta_sync_jobs for delete
  using (user_id = auth.uid());

-- Webhook inbox (inserted with service role — RLS: no user policies; service bypasses RLS)
create table if not exists public.meta_webhook_events (
  id uuid primary key default gen_random_uuid(),
  topic text,
  payload jsonb not null default '{}'::jsonb,
  signature_valid boolean not null default false,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.meta_webhook_events enable row level security;

-- No policies: anon/authenticated cannot read/write; service_role bypasses RLS for server-side inserts.

-- Optional audit trail for catalog publish / Graph payloads
create table if not exists public.meta_publish_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  operation text not null,
  request_payload jsonb,
  response_payload jsonb,
  graph_error jsonb,
  fbtrace_id text,
  created_at timestamptz not null default now()
);

create index if not exists meta_publish_audit_user_idx on public.meta_publish_audit (user_id, created_at desc);

alter table public.meta_publish_audit enable row level security;

drop policy if exists "meta_publish_audit_select_own" on public.meta_publish_audit;
create policy "meta_publish_audit_select_own"
  on public.meta_publish_audit for select
  using (user_id = auth.uid());

drop policy if exists "meta_publish_audit_insert_own" on public.meta_publish_audit;
create policy "meta_publish_audit_insert_own"
  on public.meta_publish_audit for insert
  with check (user_id = auth.uid());
