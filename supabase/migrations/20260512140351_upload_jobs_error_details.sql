-- Wizard publish: persist user-visible error details for failed or partially failed uploads.
alter table public.upload_jobs
  add column if not exists error_details jsonb;

comment on column public.upload_jobs.error_details is 'User-visible publish failure summary and per account/creative error items.';
