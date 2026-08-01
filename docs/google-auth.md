# Google auth & service account — the complete guide

This document explains everything Google-related in this project: what the two
credential files are, how they were created, and — the part you'll actually
come back for — **how to wire them into local dev and production**. It assumes
the credentials already exist; the appendix covers recreating them from
scratch.

---

## 1. The two identities (don't mix them up)

The project talks to Google in two completely different ways:

| | OAuth client ("sign-in") | Service account ("robot reader") |
| --- | --- | --- |
| Purpose | Lets members sign in with their own Google accounts | Lets the Worker read the accounts Sheet and content Drive folder |
| Who authenticates | Each member, in their browser | The Worker itself, server-to-server |
| Scopes | `email profile openid` only | `spreadsheets.readonly drive.readonly` |
| Credential file | `client_secret_….apps.googleusercontent.com.json` | `pujosamiti-<hex>.json` |
| If leaked | Attacker can impersonate our login screen | Attacker can read (only) whatever was shared with it |

Both live under the Google Cloud project **`pujosamiti`**, owned by
**pujosamiti@gmail.com**. Both credential files are kept locally at
**`~/.pujosamiti/`** (mode 600, never committed — the repo is public).

Sign-in itself is handled by [better-auth](https://better-auth.com) on the
Worker (`api/src/auth.ts`); Sheets/Drive reads are hand-rolled JWT + REST in
`api/src/lib/google.ts` because the googleapis npm package doesn't run on
Workers.

## 2. The environment variables

Everything Google needs reaches the code through these variables (declared in
`api/src/env.ts`, template in `api/.dev.vars.example`):

| Variable | Comes from | Notes |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | `client_secret_*.json` → `.web.client_id` | ends in `.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `client_secret_*.json` → `.web.client_secret` | secret |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | SA key json → `.client_email` | `pujosamiti-content@pujosamiti.iam.gserviceaccount.com` |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | SA key json → `.private_key` | full PEM incl. BEGIN/END lines; `\n`-escaped is fine — the code normalises it |
| `ACCOUNTS_SHEET_ID` | the accounts spreadsheet URL | the long id between `/d/` and `/edit` |
| `CONTENT_DRIVE_FOLDER_ID` | the content folder URL | the id after `/folders/` |
| `BETTER_AUTH_SECRET` | generated (`openssl rand -base64 32`) | signs session tokens; different value per environment |
| `BETTER_AUTH_URL` | the API's own origin | local: `http://localhost:8787`, prod: `https://pujosamiti-api.pujosamiti.workers.dev` |
| `WEB_ORIGIN` | the site's origin | local: `http://localhost:5173` (in `.dev.vars`), prod: `https://pujosamiti.github.io` (in `wrangler.jsonc` vars) |
| `FACEBOOK_CLIENT_ID` / `_SECRET` | not set up yet | any placeholder string; Facebook login is deferred |

## 3. Wiring LOCAL dev

Local secrets live in **`api/.dev.vars`** (git-ignored; `wrangler dev` loads
it automatically). One-time setup on a fresh machine, given the two files in
`~/.pujosamiti/`:

```sh
cp api/.dev.vars.example api/.dev.vars   # if starting fresh
```

Then fill the Google values **from the JSON files, not by hand-typing**. This
python snippet (run from the repo root) does exactly what was done originally —
it rewrites the four Google lines in place, `\n`-escaping the private key onto
a single quoted line:

```sh
python3 - <<'EOF'
import json, pathlib
home = pathlib.Path.home()
sa   = json.loads(next(home.glob('.pujosamiti/pujosamiti-*.json')).read_text())
web  = json.loads(next(home.glob('.pujosamiti/client_secret_*.json')).read_text())['web']
vals = {
    'GOOGLE_CLIENT_ID': web['client_id'],
    'GOOGLE_CLIENT_SECRET': web['client_secret'],
    'GOOGLE_SERVICE_ACCOUNT_EMAIL': sa['client_email'],
    'GOOGLE_SERVICE_ACCOUNT_KEY': sa['private_key'].replace('\n', '\\n'),
}
p = pathlib.Path('api/.dev.vars')
out = []
for line in p.read_text().splitlines():
    k = line.split('=', 1)[0] if '=' in line else None
    out.append(f'{k}="{vals.pop(k)}"' if k in vals else line)
out += [f'{k}="{v}"' for k, v in vals.items()]
p.write_text('\n'.join(out) + '\n')
print('done')
EOF
```

The non-Google values for local dev:

```
BETTER_AUTH_SECRET=<any random string — `openssl rand -base64 32`>
BETTER_AUTH_URL=http://localhost:8787
WEB_ORIGIN=http://localhost:5173
FACEBOOK_CLIENT_ID=placeholder
FACEBOOK_CLIENT_SECRET=placeholder
ACCOUNTS_SHEET_ID=<sheet id>
CONTENT_DRIVE_FOLDER_ID=<folder id>
```

Local also needs its own D1 copy (separate from prod, lives in
`api/.wrangler/`) with the auth tables and at least one allowlisted member:

```sh
cd api
npx wrangler d1 migrations apply pujosamiti --local
npx wrangler d1 execute pujosamiti --local --file=seed.sql
npx wrangler d1 execute pujosamiti --local --command \
  "INSERT OR IGNORE INTO member (id, email, display_name, role, created_at)
   VALUES ('m-you', 'your.email@gmail.com', 'Your Name', 'admin', unixepoch());"
```

Then `npm run dev:api` + `npm run dev:web` from the root, open
http://localhost:5173/login, and sign in. This works against the **real**
Google — the OAuth client has `http://localhost:8787/api/auth/callback/google`
registered as a redirect URI and `http://localhost:5173` as an origin
precisely so local dev needs no fakes.

## 4. Wiring PROD

Production secrets live **in Cloudflare** (never in git, never in GitHub
Actions), set once per value with `wrangler secret put` from `api/`. Each `put`
creates a new Worker version immediately — no redeploy needed.

Requires `npx wrangler login` (any machine, as pujosamiti@gmail.com). To set
all four Google values straight from the JSON files without the secrets ever
touching the screen or shell history:

```sh
cd api
SA=$(ls ~/.pujosamiti/pujosamiti-*.json)
WEB=$(ls ~/.pujosamiti/client_secret_*.json)
python3 -c "import json;print(json.load(open('$WEB'))['web']['client_id'],end='')"     | npx wrangler secret put GOOGLE_CLIENT_ID
python3 -c "import json;print(json.load(open('$WEB'))['web']['client_secret'],end='')" | npx wrangler secret put GOOGLE_CLIENT_SECRET
python3 -c "import json;print(json.load(open('$SA'))['client_email'],end='')"          | npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
python3 -c "import json;print(json.load(open('$SA'))['private_key'],end='')"           | npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_KEY
```

The others (already set; listed for completeness / disaster recovery):

```sh
openssl rand -base64 32 | tr -d '\n' | npx wrangler secret put BETTER_AUTH_SECRET
printf 'https://pujosamiti-api.pujosamiti.workers.dev' | npx wrangler secret put BETTER_AUTH_URL
printf 'placeholder' | npx wrangler secret put FACEBOOK_CLIENT_ID
printf 'placeholder' | npx wrangler secret put FACEBOOK_CLIENT_SECRET
# once the sheet/folder exist:
printf '<sheet id>'  | npx wrangler secret put ACCOUNTS_SHEET_ID
printf '<folder id>' | npx wrangler secret put CONTENT_DRIVE_FOLDER_ID
```

`WEB_ORIGIN` for prod is **not** a secret — it's a plain var in
`api/wrangler.jsonc` (`https://pujosamiti.github.io`), overridden locally by
`.dev.vars`.

Note the asymmetry with better-auth's session secret: **`BETTER_AUTH_SECRET`
is deliberately different between local and prod** (rotating the prod one
signs everyone out — harmless but noticeable), while the Google credentials
are deliberately the **same** in both environments — one OAuth client, one
service account, with both local and prod URLs registered on the one client.

Prod's member allowlist lives in the remote D1:

```sh
cd api
npx wrangler d1 execute pujosamiti --remote --command \
  "INSERT OR IGNORE INTO member (id, email, display_name, role, created_at)
   VALUES ('m-somebody', 'their.email@gmail.com', 'Their Name', 'member', unixepoch());"
```

## 5. Verifying it works

- **Service account** (no browser needed): the samiti's Sheets/Drive access
  can be proven by minting a token exactly the way the Worker does — sign a
  JWT with the key and exchange it at `oauth2.googleapis.com/token`. If the
  exchange returns an `access_token`, email + key are valid. (The Worker code
  that does this: `api/src/lib/google.ts` → `getAccessToken`.)
- **Sign-in, local**: http://localhost:5173/login → Continue with Google. An
  allowlisted email lands on the welcome card; any other email lands on the
  "Almost there" screen. Both prove the full round trip.
- **Sign-in, prod**: same flow at https://pujosamiti.github.io/login.
- **The one wrong way to test**: requesting the sign-in URL with `curl` and
  opening it in a browser fails with `state_mismatch` — better-auth binds the
  flow to a state cookie, so the same browser must start *and* finish it.

## 6. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Google page: `Error 400: redirect_uri_mismatch` | The callback URL isn't registered on the OAuth client | Auth Platform → Clients → pujosamiti-web → add the exact URI (scheme, host, port, path) |
| `state_mismatch` after Google consent | Flow started and finished in different browsers/clients | Always start from the site's own login button (see §5) |
| Sign-in loops / session never sticks (Safari, iOS) | Safari blocks the cross-site cookie (Pages ↔ workers.dev) | Known limitation; use Chrome/Firefox until the site and API share a custom domain |
| "Almost there" for an email that should be a member | Row missing in the right database (local vs remote are separate!) | Insert into `member` with the matching `--local`/`--remote` flag |
| `Google token exchange failed: 400` from Sheets/Drive code | Key/email mismatch, clock skew, or a deleted SA key | Re-check the two SA values; create a fresh key if it was revoked |
| `Google API 403` reading the Sheet/folder | File not shared with the SA email, or Sheets/Drive API not enabled | Share as Viewer with `pujosamiti-content@…`; check both APIs are enabled in the console |
| OAuth consent shows "unverified app" warning | A logo was added, or sensitive scopes were requested | Keep scopes to email/profile and skip the logo — neither triggers review |

**Losing a credential**: neither file is recoverable from Google — but both
are cheaply replaceable. OAuth secret: Auth Platform → Clients →
pujosamiti-web → reset secret (then rewire §3 + §4). SA key: service account →
Keys → delete old, create new JSON (then rewire). Nothing else changes.

---

## Appendix: creating everything from scratch

The one-time console work, should it ever need repeating (all under
pujosamiti@gmail.com, project `pujosamiti`, everything free — ignore any
"start free trial" banner):

1. **Project**: console.cloud.google.com → project dropdown → New Project →
   name `pujosamiti`, no organization.
2. **Consent screen**: search "Google Auth Platform" → configure: app name
   `Pujo Samiti`, support + contact email `pujosamiti@gmail.com`, audience
   **External** → create. Then **Audience → Publish app** (moves Testing →
   Production; with only email/profile scopes there is no review, and the
   "100 sensitive scope logins" warning does not apply to us).
3. **OAuth client**: Auth Platform → Clients → Create → **Web application**,
   name `pujosamiti-web`:
   - JavaScript origins: `https://pujosamiti.github.io`, `http://localhost:5173`
   - Redirect URIs:
     `https://pujosamiti-api.pujosamiti.workers.dev/api/auth/callback/google`,
     `http://localhost:8787/api/auth/callback/google`
   - Download/copy the client id + secret → `~/.pujosamiti/`.
4. **Service account**: IAM & Admin → Service Accounts → Create,
   name `pujosamiti-content`, **no roles, no principals** (its only access
   comes from files explicitly shared with it) → Keys → Add key → JSON →
   move the download to `~/.pujosamiti/`, `chmod 600`.
5. **Enable APIs**: APIs & Services → Library → enable **Google Sheets API**
   and **Google Drive API**.
6. **Share the data**: accounts spreadsheet (tabs `Wallets`: collector,
   collected, deposited · `Expenses`: item, amount) and the content Drive
   folder — both shared with the SA email as **Viewer**. Their ids become
   `ACCOUNTS_SHEET_ID` / `CONTENT_DRIVE_FOLDER_ID`.
