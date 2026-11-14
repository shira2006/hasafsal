# הספסל

אפליקציית מפה (PWA) בעברית למציאת ופרסום חפצים שהושארו ברחוב או על ספסל.

## מבנה
- **Frontend:** React 18 + TypeScript + Vite, מפה עם Leaflet / react-leaflet (OpenStreetMap)
- **Backend:** Supabase (Postgres, Storage לתמונות, Realtime). סכמה והרשאות ב-`supabase.sql`
- **פריסה:** GitHub Pages דרך GitHub Actions (`.github/workflows/deploy.yml`)

```
src/
  App.tsx            מצב האפליקציה
  components/        MapView, ItemSheet, AddSheet
  lib/               items.ts (גישה לנתונים), auth.ts (מוכן ל-Google), image.ts, geo.ts
  hooks.ts           מיקום והודעות
```

## הרצה מקומית
```
npm install
cp .env.example .env.local   # למלא URL ומפתח publishable של Supabase
npm run dev
```

## הגדרות חד-פעמיות
1. Supabase -> SQL Editor: להריץ את `supabase.sql`.
2. GitHub -> Settings -> Pages -> Source: **GitHub Actions**.

## הצעד הבא
התחברות עם Google (`src/lib/auth.ts`) והחלפת מדיניות ה-RLS לתנאים עם `auth.uid()`.
