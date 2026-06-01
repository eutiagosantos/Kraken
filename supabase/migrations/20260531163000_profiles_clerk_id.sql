-- Clerk auth migration: nullable mapping from Supabase auth.users.id to Clerk user id.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS clerk_id text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_clerk_id_key ON public.profiles (clerk_id)
  WHERE clerk_id IS NOT NULL;
