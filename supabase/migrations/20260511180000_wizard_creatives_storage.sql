-- Private bucket for wizard publish creatives (browser uploads; server downloads before Meta).
insert into storage.buckets (id, name, public)
values ('wizard_creatives', 'wizard_creatives', false)
on conflict (id) do nothing;

-- Objects live at: {auth.uid()}/{uuid_session}/creative_{n}.{ext}
drop policy if exists "wizard_creatives_select_own" on storage.objects;
drop policy if exists "wizard_creatives_insert_own" on storage.objects;
drop policy if exists "wizard_creatives_update_own" on storage.objects;
drop policy if exists "wizard_creatives_delete_own" on storage.objects;

create policy "wizard_creatives_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'wizard_creatives'
    and (string_to_array(name, '/'))[1] = auth.uid()::text
  );

create policy "wizard_creatives_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'wizard_creatives'
    and (string_to_array(name, '/'))[1] = auth.uid()::text
  );

create policy "wizard_creatives_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'wizard_creatives'
    and (string_to_array(name, '/'))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'wizard_creatives'
    and (string_to_array(name, '/'))[1] = auth.uid()::text
  );

create policy "wizard_creatives_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'wizard_creatives'
    and (string_to_array(name, '/'))[1] = auth.uid()::text
  );
