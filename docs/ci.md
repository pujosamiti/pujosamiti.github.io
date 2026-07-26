# CI / CD — the complete guide

This document explains how code in this repository gets built, tested, and
deployed. It assumes you're a developer who has just cloned the repo and has
never seen the setup before. Read it top to bottom once; after that, the
[cheat-sheet](#cheat-sheet) at the end is all you'll need day to day.

---

## 1. The big picture

This is a monorepo with two deployable halves and one shared package:

| Folder    | What it is                                            | Where it deploys                       |
| --------- | ----------------------------------------------------- | -------------------------------------- |
| `web/`    | React 19 + Vite + Tailwind v4 frontend                | GitHub Pages → https://pujosamiti.github.io |
| `api/`    | Hono API on Cloudflare Workers with a D1 database     | Cloudflare's edge network              |
| `shared/` | TypeScript types both halves import (the API contract) | Nowhere — it's compiled into both      |

**There is no manual deploy step in normal work.** You push (or merge a pull
request) to the `main` branch, and GitHub Actions — GitHub's built-in CI/CD
service — builds and deploys whatever changed. Build output (`web/dist/`, the
Worker bundle) is **never committed to git**; it exists only inside CI runs.

The two pipelines are defined by two YAML files in `.github/workflows/`:

- `deploy-web.yml` — builds the frontend and publishes it to GitHub Pages
- `deploy-api.yml` — typechecks the API and deploys it to Cloudflare Workers

GitHub reads every file in `.github/workflows/` automatically; there is nothing
to install or register. Editing one of those files and pushing it *is* the
deployment-pipeline change.

### What triggers what

Both workflows run **only on pushes to `main`** and **only when relevant files
changed** (this is called *path filtering*):

| Files touched by the push        | web deploy runs? | api deploy runs? |
| -------------------------------- | :--------------: | :--------------: |
| `web/**`                         | ✅               | —                |
| `api/**`                         | —                | ✅               |
| `shared/**`                      | ✅               | ✅               |
| the workflow file itself         | ✅ (its own)     | ✅ (its own)     |
| anything else (`README.md`, `docs/**`, `.vscode/**`, …) | — | — |

Notes:

- A **merged pull request is a push to `main`** — merging deploys.
- `shared/**` triggers *both* because both halves compile against those types.
- A docs-only or README-only push deploys **nothing**. This is intentional; if
  you push a docs change and see no run appear in the Actions tab, that is the
  system working correctly, not a failure.
- Pushes to any branch other than `main` never deploy anything. Feature
  branches are safe to push freely.

---

## 2. The web pipeline in detail (`.github/workflows/deploy-web.yml`)

**Goal**: turn `web/` source into static files and hand them to GitHub Pages.

The workflow has two jobs that run in sequence:

### Job 1 — `build`

Runs on a fresh `ubuntu-latest` virtual machine. Steps, in order:

1. **`actions/checkout@v4`** — clones the repo into the VM.
2. **`actions/setup-node@v4`** — installs Node. The version is *not* hardcoded
   here: `node-version-file: .nvmrc` makes CI use exactly the version in the
   repo-root `.nvmrc` file (currently Node 24), the same file `nvm use` reads
   locally. Bump `.nvmrc` and CI follows automatically. `cache: npm` caches
   `~/.npm` between runs so installs are fast.
3. **`npm ci`** — installs all workspace dependencies exactly as pinned in
   `package-lock.json` (`ci` = clean, reproducible install; it never updates
   the lockfile).
4. **`npm run build -w web`** — runs the `build` script of the `web` workspace
   (`tsc -b && vite build`): a full typecheck, then a production bundle into
   `web/dist/`. Two environment variables are injected at this step:
   - `VITE_BASE: /` — the URL path the app is served from. This repo is a
     GitHub **organization site** (repo named `pujosamiti.github.io`), which
     serves from the domain root `/`. ⚠️ If this code ever moves to an
     ordinary project repo, Pages would serve it from `/<repo-name>/` and this
     value must change accordingly — otherwise every asset 404s.
   - `VITE_API_URL: ${{ vars.API_URL }}` — the public URL of the Cloudflare
     Worker, read from a **repository variable** named `API_URL` (see
     [§4](#4-repository-settings-secrets-and-variables)). Vite bakes this
     string into the JavaScript bundle at build time — which is why changing
     the variable later requires a rebuild before the site picks it up.
5. **`actions/upload-pages-artifact@v3`** — zips `web/dist/` and uploads it as
   a "Pages artifact", the hand-off format the deploy job expects.

### Job 2 — `deploy`

Declares `needs: build` (waits for the build job) and
`environment: github-pages` (a deployment environment GitHub creates
automatically — you'll see it under the repo's **Environments** sidebar; no
setup needed). Its single step, **`actions/deploy-pages@v4`**, takes the
uploaded artifact and publishes it to https://pujosamiti.github.io. The
workflow's `permissions` block (`pages: write`, `id-token: write`) is what
authorizes this — no secret or token is involved for the web side.

### Concurrency

```yaml
concurrency:
  group: pages
  cancel-in-progress: true
```

If you push twice in quick succession, the older in-flight run is **cancelled**
and only the newest deploys. A run that ends with a red "cancelled" status for
this reason is normal, not an error.

---

## 3. The api pipeline in detail (`.github/workflows/deploy-api.yml`)

**Goal**: verify the API compiles, then push it to Cloudflare Workers.

One job, `deploy`, on `ubuntu-latest`:

1. **`actions/checkout@v4`** — clone.
2. **`actions/setup-node@v4`** — Node from `.nvmrc`, npm cache (same as web).
3. **`npm ci`** — install.
4. **`npm run typecheck -w api`** — `tsc --noEmit` over the API. This is the
   quality gate: a type error anywhere in `api/` (or in `shared/`, which it
   imports) fails the run *before* anything deploys.
5. **`cloudflare/wrangler-action@v3`** with `workingDirectory: api` — runs
   `wrangler deploy`, which bundles `api/src/index.ts` per `api/wrangler.jsonc`
   and uploads it to Cloudflare. Authentication comes from the
   `CLOUDFLARE_API_TOKEN` **repository secret** passed to the action —
   this is the one credential the whole CI setup depends on.

There is no Pages-style artifact here; wrangler talks to Cloudflare directly.

**Database migrations are NOT run by CI.** Applying D1 migrations
(`npm run db:migrate:remote -w api`) is a deliberate manual step from a
developer machine — schema changes are too destructive to auto-apply on every
push.

---

## 4. Repository settings, secrets, and variables

These live in the GitHub repo (not in git files), were configured once, and
are what a new maintainer most needs to know exists. All paths below start
from the repo page: https://github.com/pujosamiti/pujosamiti.github.io

### 4.1 Pages source — the setting that broke once already

**Settings → Pages → "Build and deployment" → Source: "GitHub Actions"**

There are two modes and only one is correct for us:

- **"GitHub Actions"** (correct) — Pages serves whatever artifact our workflow
  uploads.
- **"Deploy from a branch"** (the default for new repos, wrong for us) — GitHub
  ignores our workflow's artifact and instead runs its own hidden Jekyll build
  over the repo root, which renders `README.md` as the homepage.

**Symptom of it being wrong**: https://pujosamiti.github.io shows the README
instead of the app, and a workflow run named **"pages build and deployment"**
(which we did not write) appears in the Actions tab. **Fix**: flip the Source
dropdown back to "GitHub Actions", then re-run the web deploy
([§5](#5-running-a-deploy-manually-step-by-step)). It can also be checked or
fixed via the REST API: `GET /repos/pujosamiti/pujosamiti.github.io/pages`
should report `"build_type": "workflow"`.

### 4.2 Repository secret: `CLOUDFLARE_API_TOKEN`

- **What**: a Cloudflare API token that lets CI deploy the Worker. Secrets are
  write-only — once saved, nobody can read the value back, only replace it.
- **Where**: **Settings → Secrets and variables → Actions → "Secrets" tab →
  "New repository secret"**. Name must be exactly `CLOUDFLARE_API_TOKEN`.
- **How to get the value**: Cloudflare dashboard (dash.cloudflare.com) → click
  the profile icon (top right) → **My Profile → API Tokens → Create Token** →
  use the **"Edit Cloudflare Workers"** template → scope it to the account →
  Create, then copy the token (shown only once).
- **Status right now**: ⚠️ **not set** — every api deploy run currently fails
  at the wrangler step with *"it's necessary to set a CLOUDFLARE_API_TOKEN"*.
  That error message = this secret is missing or expired.

### 4.3 Repository variable: `API_URL`

- **What**: the public URL of the deployed Worker, e.g.
  `https://pujosamiti-api.<subdomain>.workers.dev`. Unlike a secret it is not
  sensitive (it's visible in every browser request anyway), so it's a
  *variable* — readable after saving.
- **Where**: **Settings → Secrets and variables → Actions → "Variables" tab →
  "New repository variable"**. Name must be exactly `API_URL`.
- **Status right now**: ⚠️ **not set** — so the deployed site was built with
  the code fallback `http://localhost:8787` (see `web/src/lib/api.ts:4`) and
  its data calls go nowhere. **After setting it you must trigger a web
  deploy** (push something under `web/**`, or run it manually per §5) because
  the URL is baked in at build time.

### 4.4 Repo visibility

The repo is **public**, and must stay public: GitHub Pages for a user/org site
requires it on the free plan. This is safe by design — no secret is ever in
git. Local secrets live in `api/.dev.vars` (git-ignored; only the template
`api/.dev.vars.example` is committed), production secrets live in Cloudflare
(`wrangler secret put`) and in the Actions secrets above.

---

## 5. Running a deploy manually, step by step

Both workflows declare `workflow_dispatch`, which means they can be run by
hand without pushing any code. You need **write access** to the repo to see
the button. When would you do this?

- After setting/changing the `API_URL` variable (rebake the web bundle)
- After adding the `CLOUDFLARE_API_TOKEN` secret (retry the api deploy)
- After fixing the Pages source setting
- Any time you suspect the deployed state is stale and want a fresh one

### From the GitHub website (the normal way)

1. Open https://github.com/pujosamiti/pujosamiti.github.io in a browser and
   sign in.
2. Click the **"Actions"** tab in the horizontal menu near the top of the repo
   page (between "Pull requests" and "Projects").
3. In the **left sidebar** under "All workflows" you'll see the workflow list:
   - **Deploy web to GitHub Pages**
   - **Deploy api to Cloudflare Workers**

   Click the one you want to run.
4. A blue banner appears above the run list saying *"This workflow has a
   workflow_dispatch event trigger."* On the **right side of that banner**,
   click the **"Run workflow"** dropdown button.
5. A small panel opens with a branch selector. Leave it on **`main`** (running
   from another branch would deploy that branch's code — almost never what you
   want).
6. Click the green **"Run workflow"** button inside the panel.
7. The page won't jump anywhere — **refresh after a few seconds** and a new
   run appears at the top of the list with a yellow/amber dot (queued or in
   progress).
8. Click the run's title to open it. You'll see the job graph (for web:
   `build` → `deploy`; for api: a single `deploy` job). Click a job to watch
   its live log, and click any step name to expand that step's output.
9. Wait for the status to turn into a **green check** (success) or **red X**
   (failure — see [§7 Troubleshooting](#7-troubleshooting)). The web deploy
   typically takes 1–2 minutes; the api deploy under a minute.
10. For a web deploy, verify by opening https://pujosamiti.github.io in a
    private/incognito window (your normal window may show a cached page —
    or hard-refresh with **Cmd+Shift+R** / **Ctrl+F5**).

### From the command line / API (no `gh` CLI needed)

```sh
curl -X POST \
  -H "Authorization: Bearer <a-GitHub-PAT-with-repo-scope>" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/pujosamiti/pujosamiti.github.io/actions/workflows/deploy-web.yml/dispatches \
  -d '{"ref":"main"}'
```

Swap `deploy-web.yml` for `deploy-api.yml` for the api side. A `204 No
Content` response means it was accepted; check the Actions tab for the run.

### Re-running a past run (e.g. after fixing a secret)

1. **Actions** tab → click the failed run in the list.
2. Top-right of the run page: **"Re-run jobs"** dropdown → **"Re-run all
   jobs"** (or "Re-run failed jobs" to skip already-green ones).
3. Note: a re-run uses the **same commit** the original run used — new
   *secrets/variables* are picked up, but new *code* is not. If you've pushed
   code since, do a fresh "Run workflow" instead.

---

## 6. Watching CI health

- **Actions tab** — every run, newest first, filterable by workflow via the
  left sidebar. Amber dot = running, green check = success, red X = failed,
  grey octagon = cancelled (usually by the concurrency rule, see §2).
- **README badges** — the two badges at the top of `README.md` show the latest
  run status of each workflow live, and clicking one takes you straight to
  that workflow's run list.
- **Email** — GitHub emails the person who triggered a run when it fails
  (Settings → Notifications on your GitHub account controls this).

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Site shows the README instead of the app; a run named "pages build and deployment" appears | Pages source flipped to "Deploy from a branch" | §4.1 — set Source back to "GitHub Actions", re-run web deploy |
| api deploy fails: *"it's necessary to set a CLOUDFLARE_API_TOKEN"* | The secret is missing or expired | §4.2 — create/replace the secret, then re-run |
| api deploy fails at `wrangler deploy` with an auth/permission error | Token exists but lacks Workers-edit scope on the account | Recreate the token from the "Edit Cloudflare Workers" template |
| Site loads but all data is empty / network tab shows calls to `localhost:8787` | `API_URL` variable missing when the bundle was built | §4.3 — set the variable, then manually run the **web** deploy |
| Site loads but API calls fail with CORS errors | Worker's `WEB_ORIGIN` var doesn't match the site origin | Set `"WEB_ORIGIN": "https://pujosamiti.github.io"` in `api/wrangler.jsonc` (or as a Cloudflare var) and redeploy the api |
| Pushed a change, no workflow ran | The push touched no filtered path (docs/README only), or wasn't on `main` | Expected behavior — see the trigger table in §1 |
| Run cancelled with grey octagon | A newer push superseded it (concurrency group) | Nothing — the newer run is the one that matters |
| Typecheck step fails | Real type error in `api/`/`web/`/`shared/` | Run `npm run typecheck` locally, fix, push |
| "Node 20 is being deprecated" warnings in logs | Action versions are behind | Bump to `actions/checkout@v5`, `actions/setup-node@v5`, latest `cloudflare/wrangler-action` — cosmetic until GitHub enforces it |

### Reading a failed run's logs

Actions tab → click the red run → click the failed job (red X in the job
graph) → the log auto-scrolls to the first failed step, expanded. Lines
prefixed `##[error]` are the actual failure. The search box (top right of the
log pane) searches within the log. **"Download log archive"** (gear icon, top
right) grabs the full text if you want to share or grep it.

### Rollback

There is no rollback button in this setup. To roll back, revert in git:

```sh
git revert <bad-commit-sha>
git push origin main
```

CI redeploys the reverted (i.e. previous) state automatically. For a broken
*deploy configuration* (bad secret, wrong Pages source), fix the setting and
re-run — no git change needed.

---

## 8. What CI does *not* do (manual responsibilities)

- **D1 database migrations** — run `npm run db:migrate:remote -w api` from a
  machine with `wrangler login` done. CI never touches the schema.
- **Cloudflare Worker secrets** — set once per secret with
  `wrangler secret put <NAME>` from `api/` (names listed in
  `api/.dev.vars.example`). Not in GitHub at all.
- **Linting** — `npm run lint -w web` (oxlint) is currently local-only; CI
  gates on typecheck, not lint.
- **Tests** — there is no test suite yet; when one lands it should be added as
  a step before the deploy steps in both workflows.

---

## Cheat-sheet

- Deploy = push/merge to `main`. `web/**`→ site, `api/**`→ Worker,
  `shared/**`→ both, docs/README → nothing.
- Manual deploy: **Actions → pick workflow → "Run workflow" → branch `main` →
  green button.**
- Site showing README? Settings → Pages → Source must be **"GitHub Actions"**.
- api deploy red? Check the `CLOUDFLARE_API_TOKEN` secret.
- Site calling localhost? Set `API_URL` variable, then re-run **web** deploy.
- Changed a secret/variable? **Re-run** picks it up; new code needs a fresh
  **Run workflow**.
- Rollback = `git revert` + push.
