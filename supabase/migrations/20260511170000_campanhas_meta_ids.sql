-- External Meta object ids for debugging and future sync
alter table public.campanhas add column if not exists meta_ids jsonb default null;

comment on column public.campanhas.meta_ids is 'Optional: { campaignId, adCreativeId, adSetIds[], adIds[] } from last publish';
