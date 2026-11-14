-- הצעות לשיפור מדף "המשימה שלנו". כולם יכולים לשלוח, אף אחד לא יכול לקרוא דרך ה-API
-- (קוראים אותן ב-Supabase Studio / לוח הבקרה). אפשר להריץ שוב בבטחה.

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(btrim(message)) between 3 and 1000),
  created_at timestamptz not null default now()
);

alter table public.suggestions enable row level security;

drop policy if exists "suggestions insert" on public.suggestions;
create policy "suggestions insert" on public.suggestions
  for insert to anon, authenticated with check (true);

-- הרשאת הוספה בלבד: אין select / update / delete לציבור
grant insert on public.suggestions to anon, authenticated;
