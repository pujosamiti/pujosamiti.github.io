# Start here

Welcome to the Pujo Samiti codebase. This documentation set is written so that
a brand-new engineer — or a returning one who remembers nothing — can go from
zero to fully productive without asking anyone anything. Everything in these
docs was verified against the live systems on **28 Aug 2026**; where a fact
could drift (versions, row counts), the doc says so.

## What this project is, in one paragraph

A community app for the probasi Bengali samiti of Magarpatta City, Pune —
Durga Pujo, Kojagari Lakshmi Puja, Bijoya Sammelani, Saraswati Puja and Poila
Baishakh. A public site (events, nirghanto/schedule, the Durga Puja book) plus
member-only sections (ledger, wallets, sponsorships, reimbursements, task
planning, membership roll). It runs **entirely on free tiers**: GitHub Pages
serves the React frontend, a Cloudflare Worker with a D1 (SQLite) database is
the API, and Google Drive/Sheets (via a service account) act as a content
drop-zone. One Google account — **pujosamiti@gmail.com** — is the root of
trust for everything.

## The documents, in reading order

| # | Doc | Read it to know |
| - | --- | --- |
| 001 | [Architecture](001-architecture.md) | The whole system on one page: components, data flow, URLs, repo layout |
| 002 | [Accounts, credentials & secrets](002-accounts-and-secrets.md) | Every account, token, secret and key-value pair — what exists, where it lives, live-verified |
| 003 | [Local development](003-local-development.md) | Fresh machine → running app, start/stop, day-to-day commands |
| 004 | [Database](004-database.md) | D1, the real schema (all 18 tables), seeds, how migrations are actually applied |
| 005 | [Backup & restore](005-backup-and-restore.md) | Prod→local mirroring, snapshot backups, disaster recovery |
| 006 | [CI/CD & deployments](006-ci-cd-deployments.md) | How pushes become deploys, every GitHub setting, manual deploys, rollback |
| 007 | [Cloudflare](007-cloudflare.md) | The account, the Worker, D1 operations, logs, recovery |
| 008 | [Google services](008-google-services.md) | OAuth client, service account, wiring credentials into local & prod |
| 009 | [Auth & membership](009-auth-and-membership.md) | Sign-in flow (and the iOS cookie story), roles, the person/tier model |
| 010 | [API reference](010-api-reference.md) | Every route, what gates it, and which frontend page calls it |
| 011 | [Content & SEO](011-content-and-seo.md) | Publishing book chapters/articles, frontmatter, share previews |
| 012 | [Design system](012-design-system.md) | The লাল-পাড় সাদা palette, typography, mobile-first rules |
| 013 | [Known gaps & roadmap](013-known-gaps.md) | Everything currently broken, dormant, or deliberately deferred |
| 014 | [Roles & access](014-roles-and-access.md) | Who sees and changes what, surface by surface — and where each rule is actually enforced |
| 015 | [উমা — the magazine](015-uma-magazine.md) | Sections, sankhyas, the editorial lifecycle, the masthead, prerendering |

New engineer fast path: **001 → 002 → 003** gets you running locally.
Read 004 and 009 before touching any feature code; 006–008 before touching
anything production; 014 before changing who can do anything.

## Quick reference card

| Thing | Value |
| --- | --- |
| Site (prod) | https://pujosamiti.github.io |
| API (prod) | https://pujosamiti-api.pujosamiti.workers.dev (health: `/health`) |
| Site (local) | http://localhost:5173 (`npm run dev:web`) |
| API (local) | http://localhost:8787 (`npm run dev:api`) |
| GitHub repo | `pujosamiti/pujosamiti.github.io` (public, org site, default branch `main`) |
| Cloudflare account | `dd0f8e416db645bdc3b884f1dcf23ac3` (login: Google SSO as pujosamiti@gmail.com) |
| D1 database | `pujosamiti`, id `ecdf8218-2679-4866-abde-57d405d5efb2`, APAC region |
| Node version | 24 (from `.nvmrc`; `nvm use`) |
| Deploy | push/merge to `main` — CI does the rest ([006](006-ci-cd-deployments.md)) |
| Root of trust | **pujosamiti@gmail.com** — controls Cloudflare, Google Cloud, Drive/Sheets |

## Conventions in these docs

- Commands are written to be run from the **repo root** unless a `cd api`
  (or similar) says otherwise.
- "Prod" always means the deployed site + Worker + remote D1. "Local" means
  your machine. **Local and prod D1 are entirely separate databases** — a
  recurring source of confusion, called out wherever it bites.
- Nothing secret appears in these docs — the repo is public. Secret *names*
  and *locations* are documented exhaustively in [002](002-accounts-and-secrets.md);
  values live only in the places that doc lists.
- The previous generation of docs is archived locally at `docs/tmp/docs-v1/`
  (gitignored; also recoverable from git history). Where v1 and this set
  disagree, **this set is right** — v1 contains statements that predate
  go-live.
