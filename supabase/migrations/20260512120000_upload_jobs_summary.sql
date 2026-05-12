-- Wizard publish: persist a JSON summary for the Fila de processamento list + completion time.
alter table public.upload_jobs
  add column if not exists summary jsonb;

alter table public.upload_jobs
  add column if not exists finished_at timestamptz;

comment on column public.upload_jobs.summary is 'Snapshot of wizard payload at publish start (objective, budget, creatives, etc.).';
comment on column public.upload_jobs.finished_at is 'Set when status becomes completed or error.';
