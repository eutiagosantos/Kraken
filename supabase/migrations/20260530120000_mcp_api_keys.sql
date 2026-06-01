-- Per-user API keys for remote MCP (LLM clients). Plaintext shown once at mint; only SHA-256 hash stored.
create table if not exists public.mcp_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Default',
  key_prefix text not null,
  key_hash text not null unique,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists mcp_api_keys_user_id_idx on public.mcp_api_keys (user_id);
create index if not exists mcp_api_keys_key_hash_idx on public.mcp_api_keys (key_hash) where revoked_at is null;

comment on table public.mcp_api_keys is 'Bearer API keys for Kraken MCP (remote LLM connectors).';
comment on column public.mcp_api_keys.key_hash is 'SHA-256 hex of full key (kr_mcp_…); never store plaintext.';

alter table public.mcp_api_keys enable row level security;

create policy "mcp_api_keys_owner_select"
  on public.mcp_api_keys
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "mcp_api_keys_owner_insert"
  on public.mcp_api_keys
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "mcp_api_keys_owner_update"
  on public.mcp_api_keys
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "mcp_api_keys_owner_delete"
  on public.mcp_api_keys
  for delete
  to authenticated
  using (auth.uid() = user_id);
