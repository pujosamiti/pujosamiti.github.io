# CI / CD

Everything deploys from GitHub Actions on push to `main` — a merged PR counts as a
push. Nothing generated is ever committed; Pages serves the workflow artifact and
Cloudflare receives the Worker bundle straight from CI.

## Workflows

### Deploy web to GitHub Pages — `.github/workflows/deploy-web.yml`

| | |
| --- | --- |
| Triggers | push to `main` touching `web/**`, `shared/**`, or the workflow file; manual run (`workflow_dispatch`) |
| Steps | checkout → Node from `.nvmrc` (npm cache) → `npm ci` → `npm run build -w web` → upload `web/dist` as Pages artifact → deploy |
| Build env | `VITE_BASE: /` (user/org site serves from the root path — if this ever moves to a project repo, change to `/<repo-name>/`), `VITE_API_URL` from the `API_URL` repo variable |
| Concurrency | group `pages`, in-progress runs cancelled by newer pushes |

### Deploy api to Cloudflare Workers — `.github/workflows/deploy-api.yml`

| | |
| --- | --- |
| Triggers | push to `main` touching `api/**`, `shared/**`, or the workflow file; manual run (`workflow_dispatch`) |
| Steps | checkout → Node from `.nvmrc` → `npm ci` → `npm run typecheck -w api` → `wrangler deploy` via `cloudflare/wrangler-action` |
| Requires | `CLOUDFLARE_API_TOKEN` repo secret ("Edit Cloudflare Workers" token template) |

**Path filtering is deliberate**: a push touching only `README.md` or `docs/`
deploys nothing; a push touching only `api/` redeploys only the Worker; `shared/`
redeploys both (both sides compile against the contract types).

## Repository settings that make this work

- **Pages → Source: GitHub Actions** (`build_type: workflow` in the API). This is
  the one setting that bit us: on "Deploy from a branch" (the default, `legacy`),
  GitHub Jekyll-renders the repo root and the site shows the README instead of the
  app. If the site ever regresses to showing the README, check this first —
  `GET /repos/pujosamiti/pujosamiti.github.io/pages` should say
  `"build_type": "workflow"`.
- **Repo secret `CLOUDFLARE_API_TOKEN`** — needed by the api deploy. *Not set yet;
  the api workflow fails at the `wrangler deploy` step until it is.*
- **Repo variable `API_URL`** — the Worker URL, baked into the web build as
  `VITE_API_URL`. *Not set yet; until it is, the deployed site's data calls fall
  back to `http://localhost:8787` (see `web/src/lib/api.ts`) and a rebuild is
  needed after setting it (any push touching `web/**`, or a manual run).*
- **Public repo** — required for Pages on the free plan for a user/org site. Safe:
  secrets live only in Actions secrets and Cloudflare, never in git (`.dev.vars`
  is git-ignored; only `.dev.vars.example` is committed).
- **`environment: github-pages`** — created automatically by the deploy action;
  no manual configuration.

## Operating the pipeline

- **Watch runs / re-run**: repo → Actions tab, or the CI badges at the top of the
  README (they link to each workflow's runs).
- **Manual deploy without a code change**: Actions tab → pick the workflow →
  "Run workflow" (both have `workflow_dispatch`), or via API:
  `POST /repos/pujosamiti/pujosamiti.github.io/actions/workflows/<file>.yml/dispatches`
  with body `{"ref":"main"}`.
- **Rollback**: revert the offending commit and push — CI redeploys the previous
  state. There is no manual rollback lever on Pages/Workers in this setup.

## Known gaps / upcoming

- `CLOUDFLARE_API_TOKEN` and `API_URL` (above) — blocked on Cloudflare account
  setup (D1 database + first `wrangler deploy` produce the Worker URL).
- GitHub is deprecating Node 20 action runtimes; `actions/checkout@v4`,
  `actions/setup-node@v4` and `cloudflare/wrangler-action@v3` currently warn.
  Bump to `checkout@v5` / `setup-node@v5` / latest wrangler-action when convenient.
