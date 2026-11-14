# הספסל (hasafsal)

Hebrew, right-to-left, map-based mobile + desktop web app (PWA, installable) for finding and posting items that people leave on benches or on the street for others to take. Must work well on both phone and desktop.

## Product
- Map around the user's location with heart pins for items.
- Item view: photo (tap = full-size modal), description, location card (address, distance, "ניווט לשם"), and the main action "לקחתי" (deletes the item for everyone via Realtime).
- Add flow ("מצאת ספסל?"): photo (optional), one description (items + where exactly), location (default current location; type an address, or choose on the map). A photo or a description is required.
- Mission page ("המשימה שלנו", `#/about`) with the story and a suggestions form (stored in `suggestions`, readable only in Supabase Studio).
- All UI text is Hebrew, RTL. Tone: friendly, neighbourly. No emoji as UI icons (use SVG).

## Stack and architecture
- Frontend: React 18 + TypeScript + Vite. Map: Leaflet via react-leaflet, OpenStreetMap tiles (softened with a CSS filter).
- Backend: Supabase only (Postgres, Storage bucket `item-photos`, Realtime). No custom server, no ORM. The browser talks to Supabase directly with the publishable (anon) key; RLS protects data.
- Data access: `src/lib/items.ts`, `src/lib/suggestions.ts`. Address search/lookup: `src/lib/geocode.ts` (public Nominatim: user-triggered requests only, no autocomplete; Israel only). Auth is a stub in `src/lib/auth.ts`.
- Schema: `supabase/migrations/` (idempotent). Demo data: `supabase/seed.sql`. Config: `supabase/config.toml`.
- Items load only for the visible bounds. Realtime is subscribed only while the tab is visible; the list is refetched on resume.
- No login yet. RLS lets anyone select, insert and delete (intentional for the MVP).
- Items table notes: `photo_url` nullable (check: photo or description), `address` saved at posting (older items fall back to a cached reverse lookup), `location_note` is legacy (no longer written; shown after the description for old items).

## Design system (src/styles.css)
- Pastel, illustrated look. Tokens in `:root`: paper/cream/peach/butter/sage/sky/lilac, `--ink`, one theme pink (`--pink`, `--pink-soft`) used for hearts and selected icons. Dark outlines (`--line`) on controls; shadows minimal.
- Fonts: Varela Round (OFL, bundled in `src/assets/fonts`, single weight: hierarchy by size/colour; `.label` uses a thin text-stroke). Dana Yad (alefalefalef, free licence) is used ONLY inside the logo, converted to outlines: never commit the font files, never embed the font (licence forbids redistribution). Credit line lives on the mission page.
- Logo: `src/assets/logo.svg` (pencil bench with the word). Generic bench drawing: `src/assets/bench-generic.svg`.
- Responsive: mobile = bottom sheet over the map; desktop (>=900px) = side panel next to the map. Compact rules at `max-height: 700px` so item sheet needs no scrollbar.
- Notifications: `useToasts()` (success/error/info) from `components/Toasts.tsx`. Show user errors through `friendlyError()` (Hebrew, never raw technical text).
- Loading: `BenchLoader` (bench drawn stroke by stroke). Errors: `ErrorCard` (retry) and `ErrorBoundary` (crash screen).
- Add the dark outline to cards, none on photos/images. Keep it minimal and avoid a different colour per block.

## Environments
- dev = local only (Supabase CLI + Docker). Production = GitHub Pages (GitHub Actions) + one cloud Supabase project.
- Env values go in `.env.local` (gitignored). `.env.example` is only a template: never put real values in it. `.env.production` holds the public publishable key. Never put secret/service_role keys in the repo.
- Local analytics (Logflare) is disabled in `config.toml` (fails its health check on Windows).
- Dev-only helpers (not in production builds): `?mockLoc=lat,lng[,accuracyMeters]` fakes the GPS position; a small `dev:` line under the location field shows pin/GPS coordinates.

## Commands
```
npm install
npm run db:start     # local Supabase (Docker must be running)
npm run db:status    # API URL and publishable key for .env.local
npm run db:reset     # rebuild local DB from ALL migrations + seed (also proves they apply from scratch)
npm run db:stop
npm run dev          # http://localhost:5173/hasafsal/
npm run build        # tsc --noEmit + vite build
npm run db:push:dry  # preview production migrations (needs `npx supabase login` + `link`)
npm run db:push      # PRODUCTION (supabase db push --remote). Never run without asking.
```
New DB change: `npx supabase migration new <name>`, write idempotent SQL. NOTE: in Supabase CLI v3, `db push` without `--remote` targets the LOCAL database.

## Workflow rules
- Branches: `dev` and `main`. `main` is production. Do NOT push to `main` unless explicitly asked.
- Work on branches from `dev`, open PRs into `dev`. Small, reviewable commits. Ask before big decisions.
- Never edit existing migrations; add new files.
- CI on PRs to `main`: build + a job that starts a temporary Supabase and applies every migration from scratch. No workflows for `dev`.
- Deploy on push to `main` (`deploy.yml`): job `migrate` runs `supabase db push --remote` against production FIRST, then `build`, then `deploy`. If migrating fails, nothing deploys. Needs GitHub secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_ID` (set by the owner in GitHub; never ask for or print their values). Migrations therefore reach production automatically on merge: keep them additive and review them in PRs.
- Do not run `db:push` manually, change GitHub settings/secrets, or touch production without asking.
- The user is new to GitHub and this stack (comes from GitLab; PR = merge request): explain briefly.

## Git notes for this machine (Windows)
- `gh` is not installed: PRs are opened by the user in the browser (e.g. `https://github.com/shira2006/hasafsal/compare/dev...<branch>?expand=1`).
- The global git config has an empty `credential.helper` (disables Git Credential Manager) and TLS verification is disabled (git warns about it). Pushing from a Bash/PowerShell tool fails with "could not read Username". Push from the app's Terminal panel instead: `$env:GCM_GITHUB_AUTHMODES = 'browser'; git -c credential.helper=manager push -u origin <branch>`; the user completes the browser sign-in (on the organization page choose "Continue", do not authorize the org; the repo is personal).

## Free-tier limits
About 200 concurrent Realtime connections, 1 GB storage. Public OpenStreetMap tiles and the public Nominatim service are not meant for heavy traffic.

## Next steps
1. Google login via Supabase Auth, then tighten RLS (only the poster can delete, posting limits).
2. Spam/abuse protection and a way to report an item.
3. Error monitoring (Sentry) and privacy-friendly analytics.
4. Before public launch: a proper map-tile provider and geocoder (MapTiler/Mapbox) with live address suggestions in Hebrew.
5. Custom domain: change `base` in `vite.config.ts` and `start_url`/`scope` in `public/manifest.webmanifest` from `/hasafsal/` to `/`.
6. Generate DB types with `supabase gen types typescript` instead of hand-written `src/types.ts`.
