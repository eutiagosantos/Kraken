-- Facebook Page linked to this ad account row (Kraken-side; not deleting the Page on Meta).
alter table public.meta_ad_accounts
  add column if not exists facebook_page_id text,
  add column if not exists facebook_page_name text;

comment on column public.meta_ad_accounts.facebook_page_id is 'Facebook Page ID for ads wizard / display; cleared when account row is deleted.';
comment on column public.meta_ad_accounts.facebook_page_name is 'Optional display name when user selects the page in the wizard.';
