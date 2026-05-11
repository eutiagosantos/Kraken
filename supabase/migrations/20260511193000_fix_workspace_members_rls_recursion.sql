-- Break RLS recursion between workspaces and workspace_members.
-- The previous workspace_members SELECT policy queried workspaces,
-- while workspaces SELECT policy queries workspace_members.
-- This migration keeps member self-access and avoids circular policy evaluation.

drop policy if exists "workspace_members_select_own" on public.workspace_members;
create policy "workspace_members_select_own"
  on public.workspace_members for select
  using (user_id = auth.uid());
