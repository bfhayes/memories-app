# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Memories** (production: `memories.bryanthayes.com`) is a warm, mobile-first web app for preserving
and collaboratively organizing a family's historical photos. Core principle: **uploading and
organizing are decoupled** — upload first (zero forms), anyone organizes later.

## Git Workflow — ALWAYS FOLLOW THIS

**Never commit directly to `main`.** All changes go through feature branches and PRs.

```
feature branch → push → CI runs → PR to main → merge → production deploy
```

1. `git checkout main && git pull` then `git checkout -b feature/short-description`
2. Make changes; run `npm test` and `npm run typecheck` **before** pushing
3. `git add … && git commit && git push -u origin feature/short-description`
4. `gh pr create` → CI runs → merge → auto-deploys to `memories.bryanthayes.com`

Branch naming: `feature/`, `fix/`, `refactor/`.

## Build & Run Commands

### Local Development (native — preferred)
```bash
npm install && cd frontend && npm install && cd ..   # first time
npm run db:migrate:local                              # create local D1 + run migration
npm run dev:api          # Terminal 1: Wrangler on :8788 (Functions + local D1 + R2)
npm run dev:frontend     # Terminal 2: Vite on :5173 (proxies /api → :8788)
# Open http://localhost:5173
```

### Tests / Typecheck
```bash
npm test            # functions + frontend tests
npm run typecheck   # frontend TypeScript (strict)
```

### Database
```bash
npm run db:migrate:local   # local D1
npm run db:migrate         # remote D1 (production)
```

## Architecture

**Cloudflare Pages app**: React SPA (static) + Pages Functions (serverless API) + D1 (SQLite) + R2
(image storage).

### Access model (NOT email/account auth)
The app has no accounts. Access is **per-Memory**:
- Each **Memory** (a private photo collection, e.g. "Jeff Rice") has a shared **password**
  (hashed server-side). `POST /api/memories/:id/unlock` checks it and sets a signed HttpOnly cookie
  (`mem_access`, JWT via `jose`) listing the unlocked Memory ids.
- After unlocking, the visitor **picks their name** from the Memory's contributors (or adds a new
  one). That identity is stored client-side in `localStorage` and sent as the `X-Contributor-Id`
  header to attribute every write.
- `contributors` (identities who have logged in/edited) are **distinct** from `people` (tag subjects
  in photos). Keep them separate.

`functions/api/_middleware.ts` reads the cookie into `context.data.unlockedMemories` and never blocks.
Each route enforces access with `requireMemoryAccess(context, memoryId)` from `functions/lib/guard.ts`.

### Photos & images (R2)
- Originals are preserved untouched. The browser also generates a downsized **thumbnail** (canvas)
  for fast grid browsing; both are uploaded in one multipart `POST /api/memories/:id/photos`.
- Object bytes live in R2 (`IMAGES` binding); only the R2 **keys** are stored in D1.
- Served via `GET /api/files/<key>` (immutable cache). Duplicate uploads are detected by SHA-256
  content hash (`photos.content_hash`, unique per memory).
- EXIF "DateTimeOriginal" is read client-side (`exifr`) and seeds the photo's date on upload.

### Metadata is collaborative + autosaved
Every photo field (date, people, location, about, tags, notes, favorite) autosaves immediately via
`PATCH /api/photos/:id` — **there is no Save button**. Each write appends to `activity` (who did what,
when), which drives the per-photo Contributors timeline. Date carries a `date_confidence`
(`exact | month-year | year | approx | unknown`) and is the priority field everywhere.

### Project Structure
```
functions/
  api/
    _middleware.ts                 # error boundary + memory-access middleware (never blocks)
    health.ts
    files/[[path]].ts              # GET R2 object by key
    memories/index.ts              # GET list (public meta), POST create
    memories/[id]/index.ts         # GET one (public meta for the gate)
    memories/[id]/unlock.ts        # POST password → sets access cookie
    memories/[id]/contributors.ts  # GET/POST identities (the name picker)
    memories/[id]/photos/index.ts  # GET library (filters/search/sort), POST upload (multipart)
    memories/[id]/photos/bulk.ts   # PATCH bulk metadata to many photos
    memories/[id]/suggestions.ts   # known people / locations / tags (autocomplete)
    memories/[id]/stats.ts         # counts for filters + Detective missions
    photos/[id]/index.ts           # GET detail, PATCH (autosave), DELETE
  lib/                             # db, schema, env, request, auth, guard, util
migrations/0001_init.sql
frontend/src/
  api/client.ts                    # typed fetch wrapper
  lib/                             # types, format (dates), tones, identity, image (thumb/hash/exif)
  hooks/                           # React Query hooks
  context/                         # MemoryProvider (current memory + identity + unlock state)
  components/                      # ui primitives + feature components
  pages/                           # Hub, Gate, Identity, Home, Upload, Library, PhotoDetail, Detective…
wrangler.toml                      # D1 + R2 bindings (source of truth)
```

## Cloudflare Pages Notes
- `wrangler.toml` is the source of truth for bindings — dashboard editing is disabled when it exists.
- D1 has no `db.transaction()` via Drizzle — use `db.batch()` for atomic multi-statement writes.
- `AUTH_SECRET` is a **secret** (`wrangler pages secret put AUTH_SECRET`), never in `wrangler.toml`;
  local dev passes it via `--binding`.
- File-based routing: `[id].ts` = dynamic param, `[[path]].ts` = catch-all, `_middleware.ts` runs
  before routes in its directory. Never create `_worker.ts` in build output — it disables routing.
- D1-read endpoints send `Cache-Control: no-store`; R2 file reads are `immutable`.
- Boolean columns are `integer({ mode: 'boolean' })`; JSON is stored as `text`.

## Ports
- Frontend Vite: **5173** (proxies `/api` → :8788)
- Wrangler Pages dev: **8788** (Functions + local D1 + R2)
