# Cloudflare — account, credentials, and everything we run there

Cloudflare hosts the samiti's entire backend: the API Worker, the D1 database,
and the vault holding the Worker's runtime secrets. All of it on the free plan,
no card on file. This doc records how the account is set up, the credentials
involved, what was done one-time, and how to operate/recover it.

Companion docs: [ci.md](ci.md) (how CI deploys to Cloudflare) ·
[google-auth.md](google-auth.md) (the Google credentials stored *in* Cloudflare).

---

## 1. The account

- **Account**: registered to **pujosamiti@gmail.com** — sign-in is **Google
  SSO ("Sign in with Google"), not a Cloudflare password. There is no separate
  Cloudflare password.** Whoever controls the Gmail account controls
  Cloudflare; that Gmail is the single root of trust for the whole project
  (Cloudflare, Google Cloud, Drive/Sheets). Keep its 2FA and recovery options
  current across committee handovers.
- **Account ID**: `dd0f8e416db645bdc3b884f1dcf23ac3` (not a secret; it's in
  dashboard URLs).
- **workers.dev subdomain**: `pujosamiti` — registered once, account-wide;
  every Worker in this account gets `<worker>.pujosamiti.workers.dev`.

## 2. The credentials — three different things, don't conflate them

| # | Credential | Where it lives | Used by | Scope |
| - | --- | --- | --- | --- |
| 1 | Google SSO login (pujosamiti@gmail.com) | — (it's the Gmail account) | Humans, in the dashboard | Everything |
| 2 | Wrangler OAuth session | `~/Library/Preferences/.wrangler/config/default.toml` (per developer machine) | Every local `wrangler` command | Broad (workers, D1, secrets, …); self-refreshing |
| 3 | CI API token — "Edit Cloudflare Workers" template | `~/.cf_token.txt` locally **and** GitHub Actions secret `CLOUDFLARE_API_TOKEN` | `wrangler deploy` inside GitHub Actions | Workers + D1 edit only; no account/billing management |

- **#2** is created by running `npx wrangler login` (browser must be signed
  into Cloudflare as pujosamiti@gmail.com — which, per §1, means signed into
  that Google account). Revoke from dashboard → My Profile → sessions, or just
  `wrangler logout`.
- **#3** was created in dashboard → profile icon → My Profile → API Tokens →
  Create Token → **"Edit Cloudflare Workers"** template → scoped to this
  account, all zones. Verify it's alive with:
  `curl -H "Authorization: Bearer $(cat ~/.cf_token.txt)" https://api.cloudflare.com/client/v4/user/tokens/verify`
- **Also stored in Cloudflare but not a Cloudflare credential**: the Worker's
  runtime secrets (auth + Google values — full list in google-auth.md §2), set
  with `wrangler secret put`. Write-only: they can be replaced but never read
  back, not even by us.

## 3. What runs there

| Resource | Name | Notes |
| --- | --- | --- |
| Worker | `pujosamiti-api` | Live at https://pujosamiti-api.pujosamiti.workers.dev; config in `api/wrangler.jsonc`; deployed by CI on push to `main` touching `api/**`/`shared/**` |
| D1 database | `pujosamiti` | id `ecdf8218-2679-4866-abde-57d405d5efb2`, APAC region; bound to the Worker as `env.DB` |
| Runtime secrets | 10 values | `BETTER_AUTH_*`, `GOOGLE_*`, `FACEBOOK_*` (placeholders), soon `ACCOUNTS_SHEET_ID`/`CONTENT_DRIVE_FOLDER_ID` |
| Plain var | `WEB_ORIGIN` | In `wrangler.jsonc` (`https://pujosamiti.github.io`), overridden to localhost in `.dev.vars` for dev |

**Free-tier headroom** (for context, not worry): 100k Worker requests/day,
5 GB D1 storage, 5M D1 reads/day — orders of magnitude above samiti traffic.

## 4. The one-time setup that was done (chronological)

1. Signed up at dash.cloudflare.com **with Google** as pujosamiti@gmail.com;
   verified email. No card, free plan.
2. `npx wrangler login` on the dev machine (credential #2).
3. `npx wrangler d1 create pujosamiti` → pasted `database_id` into
   `api/wrangler.jsonc`.
4. Applied migrations remotely (`npx wrangler d1 migrations apply pujosamiti
   --remote` from `api/`) and seeded (`npx wrangler d1 execute pujosamiti
   --remote --file=seed.sql`). Member allowlist rows inserted the same way.
5. Registered the `pujosamiti` workers.dev subdomain. (Wrangler only offers
   this interactively; non-interactively it's one REST call:
   `PUT /accounts/<account-id>/workers/subdomain` with
   `{"subdomain":"pujosamiti"}`.)
6. First `npx wrangler deploy` from `api/` → Worker URL. (TLS on a brand-new
   `*.pujosamiti.workers.dev` takes a few minutes to provision — `curl` errors
   like `SSL_ERROR` right after first deploy are normal; wait and retry.)
7. Set the runtime secrets (`wrangler secret put …` — exact commands in
   google-auth.md §4).
8. Created CI token (credential #3), verified it, stored as the
   `CLOUDFLARE_API_TOKEN` GitHub secret. CI has deployed the api ever since.

## 5. Operating it

- **Deploys**: normally CI-only. Manual escape hatch: `npx wrangler deploy`
  from `api/` (uses credential #2).
- **Logs**: `npx wrangler tail` from `api/` streams live Worker
  logs/exceptions — first stop when prod misbehaves.
- **D1 queries**: `npx wrangler d1 execute pujosamiti --remote --command
  "SELECT …"` (or `--local` for the dev copy; **they are separate
  databases** — the local one lives under `api/.wrangler/`). Browser
  alternative: dashboard → Storage & Databases → D1 → pujosamiti → Console.
- **Add a member to the allowlist**: SQL insert into `member` — snippet in
  google-auth.md §4 — until the admin UI exists.
- **Change a runtime secret**: `printf '<value>' | npx wrangler secret put
  NAME` from `api/`. Takes effect immediately, no deploy needed.

## 6. Recovery / rotation

| Lost/leaked | Impact | Fix |
| --- | --- | --- |
| Gmail account access | Everything — Cloudflare included (Google SSO) | This is the doomsday case: recover the Google account. Prevent it: 2FA + current recovery phone/email + second GCP owner (see google-auth.md) |
| CI token (`~/.cf_token.txt` / GitHub secret) | CI api deploys fail (or attacker can deploy Workers) | Dashboard → My Profile → API Tokens → Roll/revoke → save new value to `~/.cf_token.txt` → update the GitHub secret `CLOUDFLARE_API_TOKEN` |
| Wrangler session on a machine | That machine can act as the account | `npx wrangler logout` locally, or revoke the session from the dashboard; re-login anytime |
| A runtime secret | Depends on the secret (see google-auth.md) | `wrangler secret put` the replacement; rotating `BETTER_AUTH_SECRET` signs all members out (harmless) |
| D1 data | Real damage once real data exists | D1 has automatic Time Travel backups (30 days on free): `npx wrangler d1 time-travel restore pujosamiti --timestamp=<unix>` — check `d1 time-travel info` first |

**New developer machine checklist**: `npx wrangler login` (as
pujosamiti@gmail.com via Google) → copy `~/.pujosamiti/` credential files from
a current committee machine (for .dev.vars wiring, google-auth.md §3) → done;
CI needs nothing per-developer.
