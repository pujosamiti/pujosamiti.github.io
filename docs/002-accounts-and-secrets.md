# Accounts, credentials & secrets — the complete inventory

Every account, token, secret and key-value pair the project uses, where each
one lives, and its live-verified status. **Audited against the live systems on
28 Aug 2026** with the GitHub REST API and `wrangler` — this is not from
memory. If you can't recall what was ever configured: this page is the answer,
and there is nothing beyond what's listed here (org-level, environment-level,
Dependabot and Codespaces secret stores were all checked and are **empty**).

## 1. The root of trust

**pujosamiti@gmail.com** is the single account that owns everything:

- Cloudflare — sign-in is **Google SSO** (there is no Cloudflare password)
- Google Cloud project `pujosamiti` (OAuth client + service account)
- The content Drive folder and the treasurers' accounts Sheet
- It is also the author identity on Cloudflare deploys

Whoever controls that Gmail controls the project. Keep its 2FA and recovery
options current across committee handovers. Losing it is the doomsday case
(recovery table in [007-cloudflare.md](007-cloudflare.md) §6).

GitHub is the exception: the repo lives in the **`pujosamiti` GitHub org**,
whose members are the personal accounts `pradyroy` and `koyeliroy` (both org
members and both repo admins — verified).

## 2. GitHub — everything configured there

Repo: `pujosamiti/pujosamiti.github.io` (public — required for a free org
Pages site; safe because no secret is ever in git).

### 2.1 Actions secrets and variables (the complete list)

| Kind | Name | Value / status | Used by |
| --- | --- | --- | --- |
| Repository **secret** | `CLOUDFLARE_API_TOKEN` | set 27 Jul 2026 (write-only — value not readable back) | `deploy-api.yml` → `wrangler deploy` |
| Repository **variable** | `API_URL` | `https://pujosamiti-api.pujosamiti.workers.dev` | `deploy-web.yml` → baked into the web bundle as `VITE_API_URL` |

That is **all**. Verified empty on 28 Aug 2026:

- Environment `github-pages` (auto-created by the Pages deploy action):
  no secrets, no variables of its own
- Org-level Actions secrets and variables: none
- Dependabot secrets: none · Codespaces secrets: none
- Deploy keys: none · Webhooks: none

### 2.2 Repo settings that matter

| Setting | Value | Why it matters |
| --- | --- | --- |
| Visibility | public | Free-plan requirement for an org Pages site |
| Default branch | `main` | The only branch that deploys |
| Branch protection / rulesets | **none** | Known gap — see [013](013-known-gaps.md) |
| Pages → Source | **"GitHub Actions"** (`build_type: workflow`) | The setting that broke once: if it flips to "Deploy from a branch", the site shows the README. Fix + symptoms in [006](006-ci-cd-deployments.md) §4.1 |
| Pages HTTPS | enforced | — |
| Collaborators | `pradyroy` (admin), `koyeliroy` (admin) | — |

### 2.3 Personal access token (local machine)

`~/.github_pat.txt` — a PAT for the `pradyroy` identity, used for REST API
calls and HTTPS pushes from this machine. Not known to CI; CI needs no GitHub
credential beyond what Actions provides itself.

## 3. Cloudflare — the Worker's secret vault

Runtime secrets are set per-value with `wrangler secret put NAME` from `api/`
and are **write-only** (replaceable, never readable — not even by us). Each
`put` takes effect immediately, no redeploy.

Live list (`npx wrangler secret list`, 28 Aug 2026):

| Secret | Purpose | Status |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | Signs session tokens. Deliberately different from local; rotating signs everyone out (harmless) | ✅ set |
| `BETTER_AUTH_URL` | The API's own origin (`https://pujosamiti-api.pujosamiti.workers.dev`) | ✅ set |
| `GOOGLE_CLIENT_ID` | OAuth client for member sign-in | ✅ set |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | ✅ set |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `pujosamiti-content@pujosamiti.iam.gserviceaccount.com` | ✅ set |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | The SA's private key (PEM) | ✅ set |
| `FACEBOOK_CLIENT_ID` | Facebook login — **placeholder value**; FB login not set up | ✅ set (placeholder) |
| `FACEBOOK_CLIENT_SECRET` | ditto | ✅ set (placeholder) |
| `ACCOUNTS_SHEET_ID` | Treasurers' Google Sheet id | ❌ **not set** — the endpoint that needs it is dormant (no frontend caller); see [013](013-known-gaps.md) |
| `CONTENT_DRIVE_FOLDER_ID` | Content drop-zone Drive folder id | ❌ **not set** — same, dormant |

Plus one **plain (non-secret) var** in `api/wrangler.jsonc`:
`WEB_ORIGIN = https://pujosamiti.github.io` (CORS + trusted origin;
overridden to `http://localhost:5173` locally by `.dev.vars`).

### Cloudflare credentials (three different things — don't conflate)

| # | Credential | Lives at | Used by | Scope |
| - | --- | --- | --- | --- |
| 1 | Google SSO login (pujosamiti@gmail.com) | — (it *is* the Gmail) | Humans in the dashboard | Everything |
| 2 | Wrangler OAuth session | `~/Library/Preferences/.wrangler/config/default.toml` (per developer machine; created by `npx wrangler login`) | Every local `wrangler` command | Broad, self-refreshing. Revoke: `wrangler logout` or dashboard → My Profile |
| 3 | CI API token ("Edit Cloudflare Workers" template) | `~/.cf_token.txt` locally **and** the GitHub secret `CLOUDFLARE_API_TOKEN` | `wrangler deploy` inside Actions | Workers edit only — no account/billing management |

Verify #3 is alive:
`curl -H "Authorization: Bearer $(cat ~/.cf_token.txt)" https://api.cloudflare.com/client/v4/user/tokens/verify`

## 4. Google Cloud — the two credential files

Both under GCP project **`pujosamiti`** (owner pujosamiti@gmail.com), both
kept locally at **`~/.pujosamiti/`** (mode 600, never committed):

| File (at `~/.pujosamiti/`) | What | Feeds |
| --- | --- | --- |
| `client_secret_965340052879-….apps.googleusercontent.com.json` | OAuth **web client** `pujosamiti-web` — member sign-in. Registered redirect URIs cover both prod and localhost (that's why local dev signs in against real Google) | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| `pujosamiti-6ab83da7830c.json` | **Service-account key** for `pujosamiti-content@pujosamiti.iam.gserviceaccount.com` — no IAM roles; its only access is files explicitly shared with it (Viewer) | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_KEY` |

Neither file is recoverable from Google if lost, but both are cheaply
replaceable — see [008-google-services.md](008-google-services.md) §6.
Scripts to wire them into `.dev.vars` (local) and Worker secrets (prod)
without values ever touching the screen: [008](008-google-services.md) §3–4.

## 5. Local machine files — the full list

| Path | Contains | Committed? |
| --- | --- | --- |
| `api/.dev.vars` | All 11 runtime vars for local dev (the 10 secret names above + `WEB_ORIGIN`) | ❌ git-ignored (`api/.dev.vars.example` is the committed template) |
| `~/.pujosamiti/` | The two Google credential JSONs (§4) | ❌ outside the repo |
| `~/.cf_token.txt` | CI Cloudflare token (copy of the GitHub secret's value) | ❌ outside the repo |
| `~/.github_pat.txt` | GitHub PAT (pradyroy) | ❌ outside the repo |
| `~/Library/Preferences/.wrangler/config/default.toml` | Wrangler OAuth session | ❌ outside the repo |
| `docs/tmp/` | Prod DB backups & scratch — contains member data | ❌ git-ignored (`.gitignore:12`), verified never committed |

**New machine checklist**: `npx wrangler login` (browser signed into Google as
pujosamiti@gmail.com) → copy `~/.pujosamiti/` from a current committee machine →
wire `.dev.vars` per [008](008-google-services.md) §3 → done. CI needs nothing
per-developer.

## 6. Where secrets must NEVER go

- **Git** — the repo is public. `.dev.vars`, dumps of the database,
  `docs/tmp/`, and both `~/.pujosamiti/` files stay out, always.
- **GitHub Actions** — holds only the one Cloudflare token. Google/auth
  secrets deliberately never enter GitHub; they live in Cloudflare's vault.
- **These docs** — names and locations only, values never.
