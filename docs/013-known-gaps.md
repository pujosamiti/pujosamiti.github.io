# Known gaps & roadmap

Everything currently broken, dormant, stale or deliberately deferred — found
during the full system audit of **28 Aug 2026**. If you fix one, update this
page (and the doc it points at).

## Broken (would bite someone today)

1. **`npm run db:migrate:local` / `db:migrate:remote` fail.** No environment
   has the `d1_migrations` bookkeeping table (migrations 0000–0005 were
   applied by hand), so `wrangler d1 migrations apply` re-runs `0000_init`
   and dies on "table already exists".
   *Workaround*: apply with `d1 execute --file` — [004-database.md](004-database.md) §4.
   *Fix*: create and seed `d1_migrations` (rows for 0000–0005) on **both**
   prod and local; then the scripts work incrementally as designed.

2. **No branch protection on `main`.** No rulesets, no protected branches
   (verified via API). Any collaborator push to `main` deploys straight to
   prod with no review and no required checks.
   *Fix*: a GitHub ruleset on `main` — at minimum require the typecheck to
   pass; require PRs if the two-person committee wants review discipline.

## Dormant (built, but switched off — decide, then finish or delete)

3. **Google Sheet accounts summary** — `GET /api/members/accounts/:eventId`
   reads the treasurers' Sheet (`Wallets`/`Expenses` tabs) but has **no
   frontend caller**, and `ACCOUNTS_SHEET_ID` is unset in prod. The D1 ledger
   (`/api/members/ledger/*`) has since become the real accounting system.
   *Decide*: if the ledger has fully replaced the Sheet, delete the endpoint,
   `readSheetRange`, and the two env vars; if treasurers still keep the
   Sheet, set the secret and surface the page.

4. **Drive-folder blog/magazine posts** — `GET /api/public/posts[* ]` lists
   markdown from the content Drive folder; no frontend caller,
   `CONTENT_DRIVE_FOLDER_ID` unset in prod. The Durga Puja book shipped as
   docs-as-code instead ([011](011-content-and-seo.md)).
   *Decide* when Pujo Sankhya is built: same docs-as-code machinery (then
   delete this path) or the drop-zone (then set the secret and build the UI).

5. **Facebook login** — configured end-to-end in better-auth but both prod
   secrets are the literal string `placeholder`; no Facebook app exists. The
   login button path would fail if surfaced.
   *Fix if wanted*: create the FB app, register
   `/api/auth/callback/facebook`, set the two secrets.

## Stale / housekeeping

6. **Wrangler pinned-by-lockfile at 4.114.0; 4.127.0 available.** Routine
   `npm update` territory; nothing known to depend on the gap.
7. **The archived v1 docs (`docs/tmp/docs-v1/`, local-only + git history)
   contain superseded statements** (pre-go-live "not set"
   warnings, the abandoned `member`-table model, the v2 schema *sketch* that
   differs from the shipped schema). It's kept as history — never cite it
   without checking the current docs first.
8. **CI Node deprecation warnings** may appear as GitHub retires older
   action runtimes — bumping `actions/*` versions is cosmetic until enforced.

## Deliberately deferred (not bugs)

- **No custom domain.** Site on `pujosamiti.github.io`, API on
  `workers.dev` — free, but the cross-site cookie situation this creates is
  permanently papered over by the bearer-token design
  ([009](009-auth-and-membership.md) §2). A shared custom domain would let
  cookies work everywhere; revisit only if the bearer approach ever hurts.
- **No test suite.** CI gates on typecheck only; lint (`oxlint`) is
  local-only. When tests land, add them to both workflows before the deploy
  steps.
- **No R2 bucket.** A commented-out `pujosamiti-files` binding waits in
  `wrangler.jsonc` for a file-upload feature.
- **Admin UI coverage** — some flows still go through documented SQL
  (member activation edge cases) until the UI grows into them.

## Roadmap notes carried from planning

- Seed a **fin_admin** (the role exists; assignment is an admin/SQL act).
- **Pujo Sankhya** magazine on the book machinery (§4 above decides the
  content path; `author` exists, add `publishedOn`; per-article `image`
  editorially required — links live on WhatsApp).
- **CI migrations** — once gap #1 is fixed, revisit whether CI should verify
  (not apply) pending migrations to catch the deploy-before-migrate mistake.
