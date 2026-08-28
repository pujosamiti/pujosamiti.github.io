# CI/CD & deployments

How code gets built, verified and deployed, plus every GitHub setting
involved. **There is no manual deploy step in normal work**: push (or merge a
PR) to `main` and GitHub Actions builds and deploys whatever changed. Build
output (`web/dist/`, the Worker bundle) is never committed; it exists only
inside CI runs.

Settings and statuses below were **live-verified 28 Aug 2026** — both
pipelines are healthy and have been deploying since early August.

## 1. What triggers what

Two workflows in `.github/workflows/`, both **only on pushes to `main`**,
both **path-filtered**:

| Files touched | `deploy-web.yml` | `deploy-api.yml` |
| --- | :-: | :-: |
| `web/**` | ✅ | — |
| `api/**` | — | ✅ |
| `shared/**` | ✅ | ✅ |
| the workflow file itself | ✅ (its own) | ✅ (its own) |
| anything else (docs, README, …) | — | — |

- A merged PR **is** a push to `main` — merging deploys.
- A docs-only push deploys nothing. No run in the Actions tab after such a
  push is the system working, not failing.
- Pushes to other branches never deploy — feature branches are safe.

## 2. The web pipeline (`deploy-web.yml`)

Two jobs in sequence:

**`build`** (ubuntu-latest): checkout → `setup-node` with
`node-version-file: .nvmrc` (bump `.nvmrc` and CI follows) + npm cache →
`npm ci` → `npm run build -w web` (`tsc -b && vite build` — full typecheck,
then a production bundle to `web/dist/`, with per-page prerendering for the
book). Two values are injected at build time:

- `VITE_BASE: /` — this is an **org site** (repo named
  `pujosamiti.github.io`) served from the domain root. ⚠️ If the code ever
  moves to an ordinary project repo, Pages serves from `/<repo>/` and this
  must change or every asset 404s.
- `VITE_API_URL: ${{ vars.API_URL }}` — the Worker URL from the repository
  variable (§4.3), **baked into the JS bundle**. Changing the variable later
  requires a web re-deploy before the site picks it up.

Then `upload-pages-artifact` zips `dist/`.

**`deploy`**: `needs: build`, `environment: github-pages` (auto-created;
no secrets/vars of its own — verified), single step `deploy-pages@v4`.
Authorization is the workflow's own `permissions:` block (`pages: write`,
`id-token: write`) — **no secret involved on the web side**.

Concurrency: `group: pages, cancel-in-progress: true` — pushing twice fast
cancels the older run (grey octagon = normal, not an error).

## 3. The api pipeline (`deploy-api.yml`)

One job: checkout → node from `.nvmrc` → `npm ci` →
**`npm run typecheck -w api`** (the quality gate — a type error in `api/` or
`shared/` fails the run before anything deploys) →
`cloudflare/wrangler-action` with `workingDirectory: api`, which runs
`wrangler deploy` authenticated by the **`CLOUDFLARE_API_TOKEN`** repository
secret (§4.2). Wrangler talks to Cloudflare directly; no artifact.

**CI never touches the database.** Applying migrations is a deliberate manual
step *before* the deploy that needs them — the exact workflow is
[004-database.md](004-database.md) §4. (Do not use `npm run db:migrate:remote`;
it's currently broken — [004](004-database.md) §6.)

## 4. GitHub settings the pipelines depend on

All under https://github.com/pujosamiti/pujosamiti.github.io → Settings.
The complete secret/variable inventory (including every store verified
empty) is in [002-accounts-and-secrets.md](002-accounts-and-secrets.md) §2.

### 4.1 Pages source — the setting that broke once

**Settings → Pages → Source: "GitHub Actions"** (currently correct —
`build_type: workflow`, HTTPS enforced).

The wrong mode, "Deploy from a branch" (the default for new repos), makes
GitHub ignore our artifact and run its own hidden Jekyll build — the site
then shows the **README as the homepage**, and a run named "pages build and
deployment" (which we didn't write) appears in Actions. Fix: flip the
dropdown back, then re-run the web deploy (§5). Check via API:
`GET /repos/pujosamiti/pujosamiti.github.io/pages` must report
`"build_type": "workflow"`.

### 4.2 Repository secret `CLOUDFLARE_API_TOKEN` — ✅ set (27 Jul 2026)

The one credential CI depends on: a Cloudflare token from the **"Edit
Cloudflare Workers"** template ([007](007-cloudflare.md) §2, credential #3).
Secrets are write-only — replace, never read. If api deploys start failing
with *"it's necessary to set a CLOUDFLARE_API_TOKEN"*, this secret is missing
or expired: Settings → Secrets and variables → Actions → Secrets → replace
(a local copy of the value lives at `~/.cf_token.txt`).

### 4.3 Repository variable `API_URL` — ✅ set

`https://pujosamiti-api.pujosamiti.workers.dev`. Not sensitive (it's in every
browser request), hence a variable, not a secret. If it were ever wrong or
unset, the site would be built with the code fallback `http://localhost:8787`
(`web/src/lib/api.ts`) and all data calls would go nowhere — fix the
variable, then **manually run the web deploy** (bake-in, see §2).

### 4.4 Branch protection — none (known gap)

No rulesets or protected branches exist, so any collaborator push to `main`
deploys straight to prod. Tracked in [013-known-gaps.md](013-known-gaps.md).

## 5. Manual deploys

Both workflows declare `workflow_dispatch`. When: after changing `API_URL`
(rebake), after replacing the Cloudflare token (retry), after fixing the
Pages source, or any suspected-stale deploy.

**Website**: Actions tab → pick the workflow in the left sidebar → "Run
workflow" dropdown on the blue banner → keep branch `main` → green button →
refresh; watch the run (web: 1–2 min, api: <1 min). Verify web deploys in an
incognito window (caching).

**CLI**:

```sh
curl -X POST \
  -H "Authorization: Bearer $(cat ~/.github_pat.txt)" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/pujosamiti/pujosamiti.github.io/actions/workflows/deploy-web.yml/dispatches \
  -d '{"ref":"main"}'          # swap deploy-web.yml → deploy-api.yml for the api
```

`204 No Content` = accepted. **Re-running a past run** re-uses that run's
commit — new secrets/variables are picked up, new code is not; push fresh
code via "Run workflow" instead. Emergency escape hatch for the api only:
`cd api && npx wrangler deploy` from a logged-in machine.

## 6. Watching health & troubleshooting

Actions tab (amber = running, green = success, red = failed, grey octagon =
superseded by a newer push); the two README badges link to each workflow's
run list; GitHub emails the triggering user on failure.

| Symptom | Cause | Fix |
| --- | --- | --- |
| Site shows the README | Pages source flipped | §4.1 |
| api deploy: "necessary to set a CLOUDFLARE_API_TOKEN" | Secret missing/expired | §4.2 |
| api deploy: auth/permission error at `wrangler deploy` | Token lacks Workers-edit scope | Recreate from the "Edit Cloudflare Workers" template |
| Site data empty; network tab calls `localhost:8787` | `API_URL` was unset at build time | §4.3, then web re-deploy |
| CORS errors in prod | Worker `WEB_ORIGIN` ≠ site origin | It's a plain var in `api/wrangler.jsonc`; fix and redeploy api |
| Prod API 500s right after an api deploy with a migration | Migration not applied before deploy | [004](004-database.md) §4 — apply, errors stop immediately |
| Pushed, no workflow ran | Docs-only change, or not on `main` | Expected (§1) |
| Typecheck step fails | Real type error | `npm run typecheck` locally, fix, push |

**Rollback**: `git revert <bad-sha> && git push origin main` — CI redeploys
the previous state. For broken deploy *configuration* (secret, Pages source),
fix the setting and re-run; no git change needed. For bad *data*,
[005-backup-and-restore.md](005-backup-and-restore.md) §4.
