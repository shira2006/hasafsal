-- כתובת הפריט (למשל "אהבת ציון 20, תל אביב"), נשמרת בעת הפרסום כדי שלא נצטרך לחפש אותה בכל צפייה.
-- אפשר להריץ שוב בבטחה. פריטים ישנים נשארים בלי כתובת, והאפליקציה מחפשת אותה בעת הצפייה.

alter table public.items add column if not exists address text;

alter table public.items drop constraint if exists items_address_len;
alter table public.items add constraint items_address_len
  check (address is null or char_length(address) <= 200);
