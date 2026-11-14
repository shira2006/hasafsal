-- הדביקו את כל הקובץ ב-Supabase -> SQL Editor -> Run

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  lat double precision not null,
  lng double precision not null,
  description text,
  photo_url text not null,
  photo_path text,
  created_at timestamptz not null default now()
);

alter table public.items enable row level security;

-- MVP ללא התחברות: כולם יכולים לקרוא, להוסיף ולמחוק.
-- כשמוסיפים התחברות עם גוגל מחליפים את התנאים ל-auth.uid().
create policy "items read"   on public.items for select using (true);
create policy "items insert" on public.items for insert with check (true);
create policy "items delete" on public.items for delete using (true);

-- עדכון בזמן אמת (הסרת פריט מופיעה מיד אצל כולם)
alter table public.items replica identity full;
alter publication supabase_realtime add table public.items;

-- תמונות
insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do nothing;

create policy "photos read"   on storage.objects for select using (bucket_id = 'item-photos');
create policy "photos insert" on storage.objects for insert with check (bucket_id = 'item-photos');
create policy "photos delete" on storage.objects for delete using (bucket_id = 'item-photos');

-- הרשאות לטבלה (בפרויקטים חדשים ב-Supabase זה לא ניתן אוטומטית; בלי זה מקבלים 401 / permission denied)
grant usage on schema public to anon, authenticated;
grant select, insert, delete on public.items to anon, authenticated;
