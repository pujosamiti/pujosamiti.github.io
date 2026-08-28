# Cloudflare

Cloudflare hosts the entire backend: the API Worker, the D1 database, and the
vault holding the Worker's runtime secrets. All on the free plan, no card on
file. Facts below live-verified 28 Aug 2026 via `wrangler`.

## 1. The account

- **Registered to pujosamiti@gmail.com. Sign-in is Google SSO** ("Sign in
  with Google") — there is **no separate Cloudflare password**. Whoever
  controls the Gmail controls Cloudflare.
- **Account ID**: `dd0f8e416db645bdc3b884f1dcf23ac3` (not a secret; it
  appears in dashboard URLs). Dashboard shows it as
  "Pujosamiti@gmail.com's Account".
- **workers.dev subdomain**: `pujosamiti` — registered once, account-wide;
  every Worker gets `<worker>.pujosamiti.workers.dev`.

## 2. Credentials — three different things

Fully documented in [002-accounts-and-secrets.md](002-accounts-and-secrets.md)
§3; in brief: (1) the Google SSO login itself, (2) the per-machine wrangler
OAuth session created by `npx wrangler login` (broad scope, self-refreshing,
lives at `~/Library/Preferences/.wrangler/config/default.toml`), and (3) the
CI API token — "Edit Cloudflare Workers" template, Workers-edit scope only —
stored at `~/.cf_token.txt` and as the GitHub secret `CLOUDFLARE_API_TOKEN`.

Current local session: logged in as pujosamiti@gmail.com with scopes
account/user (read) + workers, workers_kv, workers_routes, workers_scripts
(write) — confirmed via `npx wrangler whoami`.

## 3. What runs there

| Resource | Name | Notes |
| --- | --- | --- |
| Worker | `pujosamiti-api` | Live at https://pujosamiti-api.pujosamiti.workers.dev; config `api/wrangler.jsonc` (`compatibility_date` 2026-07-01, `nodejs_compat`); deployed by CI on pushes touching `api/**`/`shared/**` |
| D1 | `pujosamiti` | id `ecdf8218-2679-4866-abde-57d405d5efb2`, APAC, created 27 Jul 2026, ~623 kB, 18 tables; bound as `env.DB`; read replication disabled |
| Runtime secrets | 8 set, 2 pending | Full table with per-secret status in [002](002-accounts-and-secrets.md) §3 — `ACCOUNTS_SHEET_ID`/`CONTENT_DRIVE_FOLDER_ID` are unset (their features are dormant) |
| Plain var | `WEB_ORIGIN` | In `wrangler.jsonc`: `https://pujosamiti.github.io` (CORS + auth trusted origin); `.dev.vars` overrides it locally |
| R2 bucket | — | Not created yet; a commented-out `pujosamiti-files` binding sits in `wrangler.jsonc` for the future |

**Free-tier headroom** (context, not worry): 100k Worker requests/day, 5 GB
D1 storage, 5M D1 reads/day. Actual load (24 h window on audit day): 48 D1
reads, 4 writes.

## 4. One-time setup that was done (chronological, for rebuild-from-zero)

1. Signed up at dash.cloudflare.com **with Google** as pujosamiti@gmail.com.
   Free plan, no card.
2. `npx wrangler login` on the dev machine.
3. `npx wrangler d1 create pujosamiti` → `database_id` into `api/wrangler.jsonc`.
4. Applied the initial schema and seeds remotely (`d1 execute --remote
   --file=…` — see [004](004-database.md); note the `d1 migrations apply`
   path was abandoned, [004](004-database.md) §6).
5. Registered the `pujosamiti` workers.dev subdomain (wrangler offers it
   interactively; non-interactive: `PUT /accounts/<id>/workers/subdomain`
   with `{"subdomain":"pujosamiti"}`).
6. First `npx wrangler deploy` from `api/`. (TLS on a brand-new
   `*.workers.dev` host takes a few minutes — `SSL_ERROR` right after first
   deploy is normal; wait and retry.)
7. Set runtime secrets (`wrangler secret put …` — commands in
   [008-google-services.md](008-google-services.md) §4).
8. Created the CI token, verified it, stored as the GitHub secret. CI has
   deployed the api ever since.

## 5. Operating it

- **Deploys**: normally CI-only. Escape hatch: `cd api && npx wrangler deploy`.
- **Logs**: `cd api && npx wrangler tail` streams live Worker
  logs/exceptions — the first stop when prod misbehaves.
- **D1 queries**: `npx wrangler d1 execute pujosamiti --remote --command "…"`
  (mind the `--remote`/`--local` flag — separate databases!). Browser
  alternative: dashboard → Storage & Databases → D1 → pujosamiti → Console.
- **Change a runtime secret**:
  `printf '<value>' | npx wrangler secret put NAME` from `api/`. Effective
  immediately, no deploy.
- **Health check**: `curl https://pujosamiti-api.pujosamiti.workers.dev/health`
  → `{"ok":true}`.
- **Add a member**: see [009-auth-and-membership.md](009-auth-and-membership.md) §5.

## 6. Recovery / rotation

| Lost/leaked | Impact | Fix |
| --- | --- | --- |
| Gmail account access | Everything — Cloudflare included (Google SSO) | The doomsday case: recover the Google account. Prevent: 2FA + current recovery phone/email across handovers |
| CI token (`~/.cf_token.txt` / GitHub secret) | CI api deploys fail; a holder could deploy Workers | Dashboard → My Profile → API Tokens → roll/revoke → save to `~/.cf_token.txt` → update the GitHub secret |
| Wrangler session on a machine | That machine can act as the account | `npx wrangler logout` there, or revoke from dashboard; re-login anytime |
| A runtime secret | Depends ([008](008-google-services.md) §6) | `wrangler secret put` a replacement; rotating `BETTER_AUTH_SECRET` signs all members out (harmless) |
| D1 data | Real damage | Time Travel (30 days) or the newest snapshot — [005](005-backup-and-restore.md) §4 |
