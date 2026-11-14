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
npm run dev             # http://localhost:5173/
```
- Studio (ממשק למסד הנתונים): http://127.0.0.1:54323
- איפוס מסד מקומי לפי המיגרציות והדמו: `npm run db:reset`
- עצירה: `npm run db:stop`
- אם `db:start` נכשל עם `analytics ... unhealthy` (נפוץ ב-Windows): ודאו שב-`supabase/config.toml` יש `[analytics] enabled = false`

## תהליך עבודה
1. עובדים בענפים שיוצאים מ-`dev`, ופותחים PR ל-`dev`.
2. שינוי בסכמה = קובץ מיגרציה חדש: `npx supabase migration new <name>`. לא עורכים מיגרציות קיימות.
3. כשמוכנים לשחרר: PR מ-`dev` ל-`main`. ב-PR רצה בדיקת CI: בנייה, ובדיקה שכל המיגרציות עולות נקי מאפס.
4. המיזוג ל-`main` מפרסם אוטומטית: קודם מיגרציות ל-production, ואם הצליחו, בנייה ופרסום ל-GitHub Pages.

## עדכון מסד הנתונים בענן
בדרך כלל לא צריך לעשות כלום: מיגרציות חדשות עולות ל-production אוטומטית במיזוג ל-`main` (ראו `.github/workflows/deploy.yml`).
אם נכשלת המיגרציה, האתר לא מתפרסם. מכיוון שזה אוטומטי, כדאי לבדוק את קובצי המיגרציה ב-PR ולכתוב אותם כך שרק מוסיפים (עמודות וטבלאות), לא מוחקים.

הרצה ידנית (חריג):
```
npx supabase login
npx supabase link --project-ref yhegdjejmrxhgdginerq
npm run db:push:dry     # תצוגה מקדימה בלבד
npm run db:push         # מעדכן את ה-production
```
שימו לב: בגרסה 3 של ה-CLI, `supabase db push` בלי `--remote` פועל על המסד המקומי. הסקריפטים ב-`package.json` כבר כוללים `--remote`.

## הגדרות חד-פעמיות ב-GitHub
- Settings -> Pages -> Source: **GitHub Actions**
- Settings -> Secrets and variables -> Actions -> New repository secret (שלושה סודות, כדי שהפריסה תוכל לעדכן את מסד הנתונים):
  - `SUPABASE_ACCESS_TOKEN`: טוקן אישי מ-Supabase (Account -> Access Tokens)
  - `SUPABASE_DB_PASSWORD`: סיסמת מסד הנתונים של פרויקט ה-production
  - `SUPABASE_PROJECT_ID`: `yhegdjejmrxhgdginerq`
- מומלץ: Settings -> Branches -> להגן על `main` ו-`dev` (PR נדרש, בדיקות CI חייבות לעבור)

## דומיין
האתר מוגש מהשורש של הדומיין (`base: "/"` ב-`vite.config.ts`, ו-`start_url`/`scope` של `/` ב-`public/manifest.webmanifest`).
- הכתובת הראשית: **https://www.hasafsal.net**. הדומיין בלי `www` (`hasafsal.net`) וגם הכתובת הישנה `shira2006.github.io/hasafsal` מופנים אליה אוטומטית על ידי GitHub Pages.
- ב-GitHub: Settings -> Pages -> Custom domain: `www.hasafsal.net`, ולסמן **Enforce HTTPS**.
- ב-DNS: רשומות `A` של הדומיין הראשי לכתובות של GitHub Pages (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153), ורשומת `CNAME` של `www` ל-`shira2006.github.io`.
- פריסה מ-GitHub Actions לא צריכה קובץ `CNAME` בפרויקט: הדומיין נשמר בהגדרות ה-Pages.
- אפליקציה שהותקנה (PWA) מהכתובת הישנה לא תתעדכן: צריך להסיר ולהתקין מחדש מהדומיין החדש.
- ב-Supabase אין כרגע התחברות, ולכן אין כתובות החזרה (redirect URLs) להגדיר. כשנוסיף התחברות עם Google, צריך להוסיף שם את `https://www.hasafsal.net`.

## הצעד הבא
התחברות עם Google (`src/lib/auth.ts`) והחלפת מדיניות ה-RLS לתנאים עם `auth.uid()`.
