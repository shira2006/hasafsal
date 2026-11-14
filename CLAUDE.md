# הספסל (hasafsal)

Hebrew, right-to-left, map-based mobile web app (PWA, installable) for finding and posting items that people leave on benches or on the street for others to take.

## Product
- Map around the user's location with pins for items.
- Tapping a pin shows the photo, optional description, distance and a navigation link.
- "לקחתי" (I took it) deletes the item immediately for everyone, via Realtime.
- "פרסום פריט" (post an item): photo (compressed client-side), optional description, draggable pin location.
- All UI text is Hebrew. Keep it RTL.

## Stack and architecture
- Frontend: React 18 + TypeScript + Vite. Map: Leaflet via react-leaflet, OpenStreetMap tiles.
- Backend: Supabase only (Postgres, Storage bucket `item-photos`, Realtime). No custom server. The browser talks to Supabase directly with the publishable (anon) key.
- Data access is isolated in `src/lib/items.ts`. Auth is a stub in `src/lib/auth.ts`.
- Schema: `supabase/migrations/` (idempotent init migration). Demo data: `supabase/seed.sql`. Config: `supabase/config.toml`.
- Items load only for the visible map bounds (max 200). Realtime is subscribed only while the tab is visible; the list is refetched on resume.
- There is NO login yet. RLS lets anyone select, insert and delete. This is intentional for the MVP.

## Environments
- dev = local only (Supabase CLI + Docker). Production = GitHub Pages (built by GitHub Actions) + one cloud Supabase project.
- Env values go in `.env.local` (gitignored). `.env.example` is only a template: never put real values in it.
- `.env.production` holds the public publishable key for the production build. Never put secret/service_role keys anywhere in the repo.
- Local analytics (Logflare) is disabled in `config.toml` because it fails its health check on Windows.

## Commands
```
npm install
npm run db:start     # local Supabase (Docker must be running)
npm run db:status    # API URL and publishable key for .env.local
npm run db:reset     # rebuild local DB from migrations + seed
npm run db:stop
npm run dev          # http://localhost:5173/hasafsal/
npm run build        # tsc --noEmit + vite build (this is what CI runs)
npm run db:push      # PRODUCTION migrations. Never run without asking.
```
New DB change: `npx supabase migration new <name>`.

## Workflow rules
- Branches: `dev` and `main`. `main` is production: every push to `main` deploys to GitHub Pages.
- Do NOT push to `main` unless explicitly asked.
- Work on branches from `dev`, open PRs into `dev`. Small, reviewable commits.
- CI (build check) runs only on PRs to `main`. There are no workflows for `dev`.
- Never edit existing migrations; add a new migration file.
- Do not run `db:push`, change GitHub settings, or touch production in any way without asking.
- Ask before big decisions.
- The user is new to GitHub and this stack (coming from GitLab; PR = merge request): explain briefly.

## Free-tier limits
About 200 concurrent Realtime connections, 1 GB storage. Public OpenStreetMap tiles are not meant for heavy traffic.

## Planned next steps
1. Google login via Supabase Auth, then tighten RLS (e.g. only the poster can delete, posting limits).
2. Spam/abuse protection and a way to report an item.
3. Error monitoring (Sentry) and privacy-friendly analytics.
4. Switch map tile provider (MapTiler, Mapbox or similar) before public launch.
5. Custom domain: change `base` in `vite.config.ts` and `start_url`/`scope` in `public/manifest.webmanifest` from `/hasafsal/` to `/`.

## Known issues / ideas
- `AddSheet` uses `capture="environment"`, which can block choosing from the gallery on some phones.
- Zoomed far out, only the 200 newest items show, silently (no min zoom).
- Anyone can delete any item or photo (see MVP note above): a blocker before public launch.
- Demo photos come from picsum.photos, which is sometimes flaky.
- `supabase/.branches/` and `supabase/.temp/` are untracked and not in `.gitignore`.
- Verified locally (2026-11-14): build, demo items, "לקחתי" via Realtime, and posting a photo work.
