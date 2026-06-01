-- Per-user Meta Developer App credentials (App ID + encrypted App Secret).
create table if not exists public.user_meta_apps (
  user_id uuid primary key references auth.users (id) on delete cascade,
  meta_app_id text not null,
  meta_app_secret_encrypted text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_meta_apps is 'User-owned Meta app credentials for appsecret_proof and debug_token.';
comment on column public.user_meta_apps.meta_app_secret_encrypted is 'AES-256-CBC ciphertext (iv:hex) — see lib/meta/app-credentials-crypto.ts';

alter table public.user_meta_apps enable row level security;

create policy "user_meta_apps_owner_select"
  on public.user_meta_apps
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_meta_apps_owner_insert"
  on public.user_meta_apps
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_meta_apps_owner_update"
  on public.user_meta_apps
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_meta_apps_owner_delete"
  on public.user_meta_apps
  for delete
  to authenticated
  using (auth.uid() = user_id);
