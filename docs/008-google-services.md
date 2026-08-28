# Google services

Everything Google-related: the two credential identities, how they were
created, and how to wire them into local dev and production. All of it lives
under the Google Cloud project **`pujosamiti`**, owned by
**pujosamiti@gmail.com**.

## 1. The two identities (don't mix them up)

| | OAuth client ("sign-in") | Service account ("robot reader") |
| --- | --- | --- |
| Purpose | Members sign in with their own Google accounts | The Worker reads the accounts Sheet and content Drive folder |
| Who authenticates | Each member, in their browser | The Worker itself, server-to-server |
| Scopes | `email profile openid` only | `spreadsheets.readonly drive.readonly` |
| Name | `pujosamiti-web` (web application client) | `pujosamiti-content@pujosamiti.iam.gserviceaccount.com` |
| Credential file (`~/.pujosamiti/`, mode 600) | `client_secret_965340052879-….json` | `pujosamiti-6ab83da7830c.json` |
| If leaked | Attacker can impersonate our login screen | Attacker can read (only) what was shared with it |

Sign-in is handled by better-auth on the Worker (`api/src/auth.ts` —
[009](009-auth-and-membership.md)); Sheets/Drive reads are **hand-rolled JWT +
REST** in `api/src/lib/google.ts`, because the googleapis npm package doesn't
run on Workers.

> **Current usage note (28 Aug 2026)**: the OAuth client is in daily use.
> The service-account read paths are **built but dormant** — the endpoints
> that call them have no frontend callers, and their two prod secrets are
> unset. Details in [013-known-gaps.md](013-known-gaps.md).

## 2. The environment variables

Declared in `api/src/env.ts`, template in `api/.dev.vars.example`:

| Variable | Comes from | Notes |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | `client_secret_*.json` → `.web.client_id` | ends `.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `client_secret_*.json` → `.web.client_secret` | secret |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | SA json → `.client_email` | |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | SA json → `.private_key` | full PEM; `\n`-escaped is fine — the code normalises it |
| `ACCOUNTS_SHEET_ID` | the accounts spreadsheet URL (id between `/d/` and `/edit`) | dormant feature |
| `CONTENT_DRIVE_FOLDER_ID` | the content folder URL (id after `/folders/`) | dormant feature |
| `BETTER_AUTH_SECRET` | generated (`openssl rand -base64 32`) | different per environment, deliberately |
| `BETTER_AUTH_URL` | the API's own origin | local `http://localhost:8787`, prod `https://pujosamiti-api.pujosamiti.workers.dev` |
| `WEB_ORIGIN` | the site's origin | local `.dev.vars`; prod is a plain var in `wrangler.jsonc` |
| `FACEBOOK_CLIENT_ID` / `_SECRET` | not set up | placeholders; Facebook login is deferred |

The Google credentials are deliberately the **same** in local and prod — one
OAuth client with both URL sets registered, one service account.

## 3. Wiring LOCAL dev

Given the two files in `~/.pujosamiti/` and a copied
`api/.dev.vars` ([003](003-local-development.md) §2.1), fill the four Google
values **from the JSONs, not by hand** — run from the repo root:

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

Local sign-in then works against **real Google**: the OAuth client has
`http://localhost:8787/api/auth/callback/google` registered as a redirect URI
and `http://localhost:5173` as a JavaScript origin, precisely so local dev
needs no fakes.

## 4. Wiring PROD

Production secrets live **in Cloudflare** (never in git, never in GitHub
Actions), set with `wrangler secret put` from `api/` — each `put` is live
immediately. To set the four Google values straight from the JSONs without
values touching the screen or shell history:

```sh
cd api
SA=$(ls ~/.pujosamiti/pujosamiti-*.json)
WEB=$(ls ~/.pujosamiti/client_secret_*.json)
python3 -c "import json;print(json.load(open('$WEB'))['web']['client_id'],end='')"     | npx wrangler secret put GOOGLE_CLIENT_ID
python3 -c "import json;print(json.load(open('$WEB'))['web']['client_secret'],end='')" | npx wrangler secret put GOOGLE_CLIENT_SECRET
python3 -c "import json;print(json.load(open('$SA'))['client_email'],end='')"          | npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
python3 -c "import json;print(json.load(open('$SA'))['private_key'],end='')"           | npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_KEY
```

The others (already set in prod; listed for disaster recovery):

```sh
openssl rand -base64 32 | tr -d '\n' | npx wrangler secret put BETTER_AUTH_SECRET
printf 'https://pujosamiti-api.pujosamiti.workers.dev' | npx wrangler secret put BETTER_AUTH_URL
printf 'placeholder' | npx wrangler secret put FACEBOOK_CLIENT_ID
printf 'placeholder' | npx wrangler secret put FACEBOOK_CLIENT_SECRET
# still pending in prod — set these when the Sheet/Drive features go live:
printf '<sheet id>'  | npx wrangler secret put ACCOUNTS_SHEET_ID
printf '<folder id>' | npx wrangler secret put CONTENT_DRIVE_FOLDER_ID
```

## 5. Verifying it works

- **Sign-in, local**: http://localhost:5173/login → Continue with Google.
  An allowlisted email lands on member content; any other lands on "Almost
  there". Both prove the full round trip.
- **Sign-in, prod**: same at https://pujosamiti.github.io/login.
- **The one wrong way to test**: fetching the sign-in URL with `curl` and
  opening it in a browser fails (`state_mismatch`) — the same browser must
  start *and* finish the flow.
- **Service account** (no browser): mint a token the way the Worker does —
  sign a JWT with the key, exchange at `oauth2.googleapis.com/token`
  (the code: `api/src/lib/google.ts` → `getAccessToken`). An `access_token`
  back = email + key valid.

## 6. Troubleshooting & rotation

| Symptom | Cause | Fix |
| --- | --- | --- |
| Google page: `Error 400: redirect_uri_mismatch` | Callback URL not registered on the client | Auth Platform → Clients → pujosamiti-web → add the exact URI (scheme, host, port, path) |
| `state_mismatch` after consent | Flow started/finished in different browsers | Start from the site's own login button |
| Sign-in loops on iOS/Safari | Third-party cookie blocking | Already solved app-wide via bearer tokens — see [009](009-auth-and-membership.md); if it recurs, that machinery regressed |
| "Almost there" for someone who should be a member | No matching active person row **in that environment's DB** | [009](009-auth-and-membership.md) §5 — insert/activate with the right `--local`/`--remote` |
| `Google token exchange failed: 400` | Key/email mismatch, clock skew, or deleted SA key | Re-check both SA values; create a fresh key if revoked |
| `Google API 403` on Sheet/folder reads | Not shared with the SA email, or API not enabled | Share as Viewer with `pujosamiti-content@…`; both Sheets + Drive APIs must be enabled |
| OAuth consent shows "unverified app" | A logo was added or sensitive scopes requested | Keep scopes to email/profile, skip the logo — neither triggers review |

**Losing a credential file**: neither is recoverable, both are cheaply
replaceable. OAuth secret: Auth Platform → Clients → pujosamiti-web → reset
secret → rewire §3 + §4. SA key: Service Accounts → Keys → delete old, add
new JSON → rewire. Nothing else changes.

## Appendix: creating everything from scratch

Should the GCP project ever need rebuilding (all under pujosamiti@gmail.com,
everything free — ignore "start free trial" banners):

1. **Project**: console.cloud.google.com → New Project → `pujosamiti`, no org.
2. **Consent screen**: "Google Auth Platform" → app name `Pujo Samiti`,
   support + contact `pujosamiti@gmail.com`, audience **External** → create →
   **Audience → Publish app** (email/profile scopes only ⇒ no review needed).
3. **OAuth client**: Auth Platform → Clients → Create → **Web application**,
   name `pujosamiti-web`:
   - JavaScript origins: `https://pujosamiti.github.io`, `http://localhost:5173`
   - Redirect URIs:
     `https://pujosamiti-api.pujosamiti.workers.dev/api/auth/callback/google`,
     `http://localhost:8787/api/auth/callback/google`
   - Save the client id + secret JSON → `~/.pujosamiti/`.
4. **Service account**: IAM & Admin → Service Accounts → Create,
   name `pujosamiti-content`, **no roles, no principals** → Keys → Add key →
   JSON → move to `~/.pujosamiti/`, `chmod 600`.
5. **Enable APIs**: Library → **Google Sheets API** + **Google Drive API**.
6. **Share the data**: the accounts spreadsheet (tabs `Wallets`: collector,
   collected, deposited · `Expenses`: item, amount) and the content Drive
   folder — both shared with the SA email as **Viewer**. Their ids become
   `ACCOUNTS_SHEET_ID` / `CONTENT_DRIVE_FOLDER_ID`.
