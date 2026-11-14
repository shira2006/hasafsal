-- תמונה אינה חובה: צריך לפחות תמונה או תיאור. בלי תמונה, האפליקציה מציגה איור ברירת מחדל.
-- אפשר להריץ שוב בבטחה.

alter table public.items alter column photo_url drop not null;

alter table public.items drop constraint if exists items_photo_or_description;
alter table public.items add constraint items_photo_or_description
  check (photo_url is not null or char_length(btrim(coalesce(description, ''))) > 0);
