-- Kraken core schema: profiles, workspaces, Meta ad accounts, campaigns, uploads, activity

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Workspaces: base table (IF NOT EXISTS does not add columns to an existing table)
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Meu workspace',
  created_at timestamptz not null default now()
);

alter table public.workspaces add column if not exists created_by uuid;

-- Workspace members (needed before backfilling workspaces.created_by)
create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- Prefer owner row, then any member (correlated subquery works for all matching rows)
update public.workspaces w
set created_by = (
  select wm.user_id
  from public.workspace_members wm
  where wm.workspace_id = w.id
  order by case when wm.role = 'owner' then 0 else 1 end, wm.created_at, wm.user_id
  limit 1
)
where w.created_by is null
  and exists (select 1 from public.workspace_members wm2 where wm2.workspace_id = w.id);

-- No members => cannot infer owner; remove orphan rows (children use ON DELETE SET NULL where defined)
delete from public.workspaces w
where w.created_by is null
  and not exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = w.id
  );

do $$
begin
  if exists (select 1 from public.workspaces w where w.created_by is null) then
    raise exception
      'Kraken migration: workspaces.created_by is still null (unexpected). Inspect workspace_members and auth.users FK integrity, then re-run.';
  end if;
end $$;

alter table public.workspaces alter column created_by set not null;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_schema = kcu.constraint_schema
     and tc.constraint_name = kcu.constraint_name
    where tc.table_schema = 'public'
      and tc.table_name = 'workspaces'
      and tc.constraint_type = 'FOREIGN KEY'
      and kcu.column_name = 'created_by'
  ) then
    alter table public.workspaces
      add constraint workspaces_created_by_fkey
      foreign key (created_by) references auth.users (id) on delete cascade;
  end if;
end $$;

alter table public.workspaces enable row level security;

drop policy if exists "workspaces_select_member" on public.workspaces;
create policy "workspaces_select_member"
  on public.workspaces for select
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspaces.id and wm.user_id = auth.uid()
    )
  );

drop policy if exists "workspaces_insert_own" on public.workspaces;
create policy "workspaces_insert_own"
  on public.workspaces for insert
  with check (created_by = auth.uid());

drop policy if exists "workspaces_update_owner" on public.workspaces;
create policy "workspaces_update_owner"
  on public.workspaces for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

alter table public.workspace_members enable row level security;

drop policy if exists "workspace_members_select_own" on public.workspace_members;
create policy "workspace_members_select_own"
  on public.workspace_members for select
  using (user_id = auth.uid() or exists (
    select 1 from public.workspaces w
    where w.id = workspace_members.workspace_id and w.created_by = auth.uid()
  ));

drop policy if exists "workspace_members_insert_by_owner" on public.workspace_members;
create policy "workspace_members_insert_by_owner"
  on public.workspace_members for insert
  with check (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and w.created_by = auth.uid()
    )
  );

-- Meta Marketing API tokens per user (short-lived from OAuth; refresh in production)
create table if not exists public.meta_user_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  access_token text not null,
  token_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.meta_user_tokens add column if not exists user_id uuid;

alter table public.meta_user_tokens enable row level security;

drop policy if exists "meta_user_tokens_own" on public.meta_user_tokens;
create policy "meta_user_tokens_own"
  on public.meta_user_tokens for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Connected Meta ad accounts
create table if not exists public.meta_ad_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  meta_account_id text not null,
  name text not null,
  status text not null default 'ativa',
  token_status text not null default 'valido',
  token_expires_at timestamptz,
  connected_at timestamptz not null default now(),
  last_activity_at timestamptz,
  monthly_spend numeric not null default 0,
  spend_delta text,
  spend_delta_type text not null default 'neutral',
  total_ads integer not null default 0,
  ads_this_month integer not null default 0,
  approval_rate numeric,
  approval_delta text,
  default_budget numeric,
  default_structure text,
  default_anti_spy boolean,
  spend_history jsonb default '[]'::jsonb,
  spend_series_extended jsonb default '[]'::jsonb,
  recent_uploads jsonb default '[]'::jsonb,
  ads_approved integer default 0,
  ads_pending integer default 0,
  ads_rejected integer default 0,
  uploads_in_period integer default 0,
  uploads_with_error integer default 0,
  nickname text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, meta_account_id)
);

alter table public.meta_ad_accounts add column if not exists user_id uuid;

create index if not exists meta_ad_accounts_user_idx on public.meta_ad_accounts (user_id);

alter table public.meta_ad_accounts enable row level security;

drop policy if exists "meta_ad_accounts_select_own" on public.meta_ad_accounts;
create policy "meta_ad_accounts_select_own"
  on public.meta_ad_accounts for select
  using (user_id = auth.uid());

drop policy if exists "meta_ad_accounts_insert_own" on public.meta_ad_accounts;
create policy "meta_ad_accounts_insert_own"
  on public.meta_ad_accounts for insert
  with check (user_id = auth.uid());

drop policy if exists "meta_ad_accounts_update_own" on public.meta_ad_accounts;
create policy "meta_ad_accounts_update_own"
  on public.meta_ad_accounts for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "meta_ad_accounts_delete_own" on public.meta_ad_accounts;
create policy "meta_ad_accounts_delete_own"
  on public.meta_ad_accounts for delete
  using (user_id = auth.uid());

-- Campaigns
create table if not exists public.campanhas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  name text not null,
  account_name text not null,
  account_meta_id text not null,
  structure text not null,
  objective text not null,
  daily_budget numeric not null default 0,
  anti_spy boolean not null default true,
  status text not null default 'ativa',
  ads_created integer not null default 0,
  ads_total integer not null default 0,
  created_at timestamptz not null default now(),
  trend jsonb default '[]'::jsonb,
  creatives jsonb default '[]'::jsonb,
  errors jsonb
);

alter table public.campanhas add column if not exists user_id uuid;

create index if not exists campanhas_user_idx on public.campanhas (user_id);

alter table public.campanhas enable row level security;

drop policy if exists "campanhas_select_own" on public.campanhas;
create policy "campanhas_select_own"
  on public.campanhas for select
  using (user_id = auth.uid());

drop policy if exists "campanhas_insert_own" on public.campanhas;
create policy "campanhas_insert_own"
  on public.campanhas for insert
  with check (user_id = auth.uid());

drop policy if exists "campanhas_update_own" on public.campanhas;
create policy "campanhas_update_own"
  on public.campanhas for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "campanhas_delete_own" on public.campanhas;
create policy "campanhas_delete_own"
  on public.campanhas for delete
  using (user_id = auth.uid());

-- Upload jobs (home progress)
create table if not exists public.upload_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_name text not null,
  total integer not null default 0,
  done integer not null default 0,
  status text not null default 'processing',
  started_at timestamptz not null default now()
);

alter table public.upload_jobs add column if not exists user_id uuid;

alter table public.upload_jobs enable row level security;

drop policy if exists "upload_jobs_own" on public.upload_jobs;
create policy "upload_jobs_own"
  on public.upload_jobs for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Activity feed
create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  message text not null,
  account text not null,
  created_at timestamptz not null default now()
);

alter table public.activity_events add column if not exists user_id uuid;
alter table public.activity_events add column if not exists created_at timestamptz;

create index if not exists activity_events_user_created_idx
  on public.activity_events (user_id, created_at desc);

alter table public.activity_events enable row level security;

drop policy if exists "activity_events_own" on public.activity_events;
create policy "activity_events_own"
  on public.activity_events for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Home KPI snapshots (optional aggregates; UI can read last row)
create table if not exists public.home_kpis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  value text not null,
  delta text,
  delta_type text not null default 'neutral',
  icon_color text,
  updated_at timestamptz not null default now(),
  unique (user_id, label)
);

alter table public.home_kpis add column if not exists user_id uuid;

alter table public.home_kpis enable row level security;

drop policy if exists "home_kpis_own" on public.home_kpis;
create policy "home_kpis_own"
  on public.home_kpis for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Creative library items (home)
create table if not exists public.creative_library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  format text not null,
  status text not null default 'pendente',
  campaigns_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.creative_library_items add column if not exists user_id uuid;

alter table public.creative_library_items enable row level security;

drop policy if exists "creative_library_own" on public.creative_library_items;
create policy "creative_library_own"
  on public.creative_library_items for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Wizard: públicos salvos (payload = objeto Publico serializado)
create table if not exists public.saved_publicos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.saved_publicos add column if not exists user_id uuid;
alter table public.saved_publicos add column if not exists created_at timestamptz;

create index if not exists saved_publicos_user_idx on public.saved_publicos (user_id, created_at desc);

alter table public.saved_publicos enable row level security;

drop policy if exists "saved_publicos_own" on public.saved_publicos;
create policy "saved_publicos_own"
  on public.saved_publicos for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- New user: profile + default workspace + membership
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ws_id uuid;
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Utilizador'
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.workspaces (name, created_by)
  values ('Meu workspace', new.id)
  returning id into ws_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws_id, new.id, 'owner')
  on conflict (workspace_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
