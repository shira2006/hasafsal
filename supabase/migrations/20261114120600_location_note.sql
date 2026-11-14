-- הערה על המיקום (לא חובה): עוזרת לאנשים למצוא את הפריט, למשל "ליד הספסל בכניסה לגינה".
-- אפשר להריץ שוב בבטחה.

alter table public.items add column if not exists location_note text;

alter table public.items drop constraint if exists items_location_note_len;
alter table public.items add constraint items_location_note_len
  check (location_note is null or char_length(location_note) <= 300);
