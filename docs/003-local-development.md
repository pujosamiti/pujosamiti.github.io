# Local development

From a fresh machine to the full app running locally, then the day-to-day
loop. Local is a complete, self-contained copy of the system: real React dev
server, real Worker runtime (Miniflare), its own SQLite database, and sign-in
against **real Google** (the OAuth client has localhost URLs registered — no
fakes needed).

## 1. Prerequisites

- **Node 24** — `.nvmrc` pins it; `nvm use` from the repo root. (CI reads the
  same file, so local and CI never drift.)
- **The credential files** at `~/.pujosamiti/` — copy from a current committee
  machine (see [002](002-accounts-and-secrets.md) §4). Without them, sign-in
  and the Google-backed endpoints won't work locally; everything public still
  will.
- A browser signed into Google (any account — members sign in with their own).

## 2. One-time setup

```sh
git clone https://github.com/pujosamiti/pujosamiti.github.io.git
cd pujosamiti.github.io
nvm use
npm ci                                    # installs all three workspaces
cp api/.dev.vars.example api/.dev.vars    # then fill it in — next step
```

### 2.1 Fill `api/.dev.vars`

Eleven keys. The four Google values are wired **from the JSON files, not
hand-typed** — run the Python snippet in
[008-google-services.md](008-google-services.md) §3, which rewrites them in
place. The rest:

```
BETTER_AUTH_SECRET=<any random string — `openssl rand -base64 32`>
BETTER_AUTH_URL=http://localhost:8787
WEB_ORIGIN=http://localhost:5173
FACEBOOK_CLIENT_ID=placeholder
FACEBOOK_CLIENT_SECRET=placeholder
ACCOUNTS_SHEET_ID=<sheet id — dormant feature, any value works>
CONTENT_DRIVE_FOLDER_ID=<folder id — dormant feature, any value works>
```

`wrangler dev` loads this file automatically. It is git-ignored; never commit it.

### 2.2 Create the local database

The local D1 is a plain SQLite file under
`api/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite` —
completely separate from prod. **The recommended way to create it is to
mirror prod**, which gives you the full schema *and* real data in one step:

→ follow "Prod → local copy" in [005-backup-and-restore.md](005-backup-and-restore.md).

(Building it from migrations instead is currently broken — `npm run
db:migrate:local -w api` fails because no environment has the `d1_migrations`
bookkeeping table; see [004](004-database.md) §6 and [013](013-known-gaps.md).
The mirror is both easier and more useful anyway.)

### 2.3 Make yourself a member locally

Sign-in alone doesn't grant member content — your email must match an active
`person` with tier ≠ `non_member` ([009](009-auth-and-membership.md)). If you
mirrored prod and your email is already on the roster, you're done. Otherwise:

```sh
cd api
npx wrangler d1 execute pujosamiti --local --command \
  "UPDATE person SET email='your.email@gmail.com', is_admin=1, tier='core'
   WHERE id=(SELECT id FROM person WHERE email IS NULL LIMIT 1);"
```

(or `INSERT` a fresh person row — column list in `api/src/db/schema.ts`).

## 3. Running (and stopping)

Two dev servers, usually in two terminals, both from the repo root:

```sh
npm run dev:api    # Hono Worker via `wrangler dev` → http://localhost:8787
npm run dev:web    # Vite → http://localhost:5173
```

- **Stop** either with `Ctrl+C`. Nothing else to clean up.
- Order doesn't matter, but the web app's data calls fail until the api is up.
- Verify the api: `curl http://localhost:8787/health` → `{"ok":true}`.
- Verify data: `curl http://localhost:8787/api/public/events` → JSON events.
- Sign-in flow: open http://localhost:5173/login → Continue with Google.

Both servers hot-reload on save (Vite instantly; wrangler restarts the
Worker). The Vite value `VITE_API_URL` is unset locally, so `web/src/lib/api.ts`
falls back to `http://localhost:8787` — no config needed.

## 4. Day-to-day commands

| Command (repo root) | What |
| --- | --- |
| `npm run dev:api` / `npm run dev:web` | The two dev servers |
| `npm run typecheck` | `tsc --noEmit` across all three workspaces — **run before pushing; it's the CI gate** |
| `npm run build` | Full production build of all workspaces (web build also prints one `prerendered /durga-puja/…` line per book page) |
| `npm run lint -w web` | oxlint (local-only; CI doesn't run it) |
| `npm outdated` | Dependency health check (policy: track `latest`) |
| `cd api && npx wrangler d1 execute pujosamiti --local --command "…"` | Query the local DB |
| `cd api && npx wrangler tail` | Stream **prod** Worker logs (careful: prod) |

Inspecting the local DB directly is fine too:
`sqlite3 api/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite` —
just do it while `wrangler dev` is stopped (lock contention).

## 5. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Web app loads, all data empty, console shows CORS or network errors | api dev server not running, or `WEB_ORIGIN` in `.dev.vars` isn't `http://localhost:5173` | Start `dev:api`; fix `.dev.vars`, restart |
| Sign-in: Google error `redirect_uri_mismatch` | Wrong port/URL — the OAuth client has exactly `http://localhost:8787/api/auth/callback/google` and origin `http://localhost:5173` registered | Use the standard ports; don't change them |
| Signed in but "Almost there" screen | Your email has no active member `person` row **in the local DB** (local and prod are separate!) | §2.3 above |
| `no such table: …` errors from the api | Local DB missing or stale | Re-mirror from prod ([005](005-backup-and-restore.md)) |
| `db:migrate:local` fails with "table already exists" | Known issue — no `d1_migrations` bookkeeping anywhere | Don't use it; see [004](004-database.md) §6 |
| Port already in use | A previous dev server still running | `lsof -i :8787` / `:5173`, kill it |
| Google token exchange / 403 errors on Google-backed endpoints | `.dev.vars` Google values wrong, or file not shared with the SA | Re-run the wiring snippet ([008](008-google-services.md) §3); check sharing |
