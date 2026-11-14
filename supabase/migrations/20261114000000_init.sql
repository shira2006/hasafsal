-- סכמה ראשונית: פריטים, הרשאות, Realtime ואחסון תמונות. אפשר להריץ שוב בבטחה.

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  lat double precision not null,
  lng double precision not null,
  description text,
  photo_url text not null,
  photo_path text,
  created_at timestamptz not null default now()
);

create index if not exists items_lat_lng_idx on public.items (lat, lng);

alter table public.items enable row level security;

-- MVP ללא התחברות: כולם קוראים, מוסיפים ומוחקים.
-- עם התחברות Google מחליפים את התנאים ל-auth.uid().
drop policy if exists "items read" on public.items;
drop policy if exists "items insert" on public.items;
drop policy if exists "items delete" on public.items;
create policy "items read"   on public.items for select using (true);
create policy "items insert" on public.items for insert with check (true);
create policy "items delete" on public.items for delete using (true);

-- בפרויקטים חדשים צריך לתת הרשאות מפורשות ל-API (אחרת 401 / permission denied)
grant usage on schema public to anon, authenticated;
grant select, insert, delete on public.items to anon, authenticated;

-- Realtime: הסרת פריט מופיעה מיד אצל כולם
alter table public.items replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'items'
  ) then
    alter publication supabase_realtime add table public.items;
  end if;
end $$;

-- תמונות
insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do nothing;

drop policy if exists "photos read" on storage.objects;
drop policy if exists "photos insert" on storage.objects;
drop policy if exists "photos delete" on storage.objects;
create policy "photos read"   on storage.objects for select using (bucket_id = 'item-photos');
create policy "photos insert" on storage.objects for insert with check (bucket_id = 'item-photos');
create policy "photos delete" on storage.objects for delete using (bucket_id = 'item-photos');
