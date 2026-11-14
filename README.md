# הספסל

אפליקציית מפה (PWA) בעברית למציאת ופרסום חפצים שהושארו ברחוב או על ספסל.

## מבנה
- **Frontend:** React 18 + TypeScript + Vite, מפה עם Leaflet / react-leaflet (OpenStreetMap)
- **Backend:** Supabase (Postgres, Storage לתמונות, Realtime)
- **CI/CD:** פריסה (CD) רק מ-`main`. בדיקת בנייה (CI) רצה רק על PR ל-`main`. ל-`dev` אין פריסה ואין workflow
- **סכמה:** `supabase/migrations/` (הסכמה כקוד), נתוני דמו ב-`supabase/seed.sql`
- **פריסה:** GitHub Pages דרך GitHub Actions, רק מענף `main`

```
src/
  App.tsx            מצב האפליקציה
  components/        MapView, ItemSheet, AddSheet
  lib/               items.ts (גישה לנתונים), auth.ts (מוכן ל-Google), image.ts, geo.ts
  hooks.ts           מיקום והודעות
supabase/            config.toml, migrations, seed.sql
```

## סביבות
| סביבה | איפה רצה | נתונים |
|---|---|---|
| **dev** | מקומית אצל כל מפתח | Supabase מקומי ב-Docker |
| **main (production)** | GitHub Pages | פרויקט Supabase בענן |

## הרצה מקומית (dev)
דרישות: Node 22 ו-Docker (פועל).
```
npm install
npm run db:start        # מרים Supabase מקומי (בפעם הראשונה לוקח כמה דקות)
npm run db:status       # מציג API URL ואת ה-publishable/anon key
cp .env.example .env.local   # ומדביקים את הערכים מהפקודה הקודמת
npm run dev             # http://localhost:5173/hasafsal/
```
- Studio (ממשק למסד הנתונים): http://127.0.0.1:54323
- איפוס מסד מקומי לפי המיגרציות והדמו: `npm run db:reset`
- עצירה: `npm run db:stop`

## תהליך עבודה
1. עובדים בענפים שיוצאים מ-`dev`, ופותחים PR ל-`dev`.
2. שינוי בסכמה = קובץ מיגרציה חדש: `npx supabase migration new <name>`. לא עורכים מיגרציות קיימות.
3. כשמוכנים לשחרר: PR מ-`dev` ל-`main`. המיזוג מפרסם אוטומטית ל-GitHub Pages.
4. מיגרציות חדשות ל-production מריצים ידנית (ראו למטה). הן לא רצות אוטומטית.

## עדכון מסד הנתונים בענן
```
npx supabase login
npx supabase link --project-ref yhegdjejmrxhgdginerq
npm run db:push
```
מיגרציית הפתיחה ניתנת להרצה חוזרת, ולכן בטוח להריץ אותה גם על הפרויקט שכבר הוגדר ידנית.

## הגדרות חד-פעמיות ב-GitHub
- Settings -> Pages -> Source: **GitHub Actions**
- מומלץ: Settings -> Branches -> להגן על `main` ו-`dev` (PR נדרש, בדיקת CI חייבת לעבור)

## הצעד הבא
התחברות עם Google (`src/lib/auth.ts`) והחלפת מדיניות ה-RLS לתנאים עם `auth.uid()`.
