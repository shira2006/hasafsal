-- נתוני דמו לסביבה מקומית בלבד (מורץ ב-`npm run db:reset`). אזור תל אביב.
insert into public.items (lat, lng, description, photo_url) values
  (32.0853, 34.7818, 'כיסא עץ במצב טוב', 'https://picsum.photos/seed/chair/600/400'),
  (32.0861, 34.7790, 'ארגז ספרים', 'https://picsum.photos/seed/books/600/400'),
  (32.0838, 34.7835, 'מנורת שולחן', 'https://picsum.photos/seed/lamp/600/400');
