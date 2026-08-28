# Architecture

The whole system, on one page.

## The picture

```
                 ┌──────────────────────────────────────────────────────┐
                 │                    pujosamiti@gmail.com              │
                 │        (root of trust — owns everything below)       │
                 └──────────────────────────────────────────────────────┘
                       │                    │                     │
        ┌──────────────┴─────┐   ┌──────────┴──────────┐   ┌──────┴─────────────┐
        │   GitHub (org      │   │  Cloudflare account │   │  Google Cloud      │
        │   "pujosamiti")    │   │  (Google SSO login) │   │  project           │
        │                    │   │                     │   │  "pujosamiti"      │
        │  repo: pujosamiti. │   │  Worker:            │   │                    │
        │  github.io (public)│   │   pujosamiti-api    │   │  OAuth client      │
        │        │           │   │        │            │   │  (member sign-in)  │
        │  GitHub Actions    │   │  D1: pujosamiti     │   │  Service account   │
        │  (2 workflows)     │   │  (SQLite at edge)   │   │  (robot reader)    │
        │        │           │   │  Worker secrets     │   │        │           │
        │  GitHub Pages      │   │  (runtime vault)    │   │  Drive folder +    │
        │        │           │   └─────────────────────┘   │  accounts Sheet    │
        └────────┼───────────┘              ▲              └────────────────────┘
                 ▼                          │
   https://pujosamiti.github.io ──fetch──► https://pujosamiti-api
   (static React SPA)                       .pujosamiti.workers.dev
                                            (Hono API + D1)
```

Browsers load the static React app from GitHub Pages; every data call is a
cross-origin `fetch` to the Worker, which reads/writes D1 and (for dormant
content features) Google APIs. There is no server we manage, no VM, no
container — and **no card on file anywhere**; every service is on its free
tier with orders-of-magnitude headroom (100k Worker requests/day, 5 GB D1,
5M D1 reads/day vs. samiti-scale traffic).

## The stack

| Layer | Technology | Where |
| --- | --- | --- |
| Frontend | React 19, Vite, Tailwind CSS v4, shadcn-style components, React Router, TanStack Query | `web/` |
| API | Hono on Cloudflare Workers | `api/` |
| Database | Cloudflare D1 (SQLite), Drizzle ORM | `api/src/db/schema.ts` |
| Auth | better-auth (Google sign-in live, Facebook stubbed), bearer-token sessions | `api/src/auth.ts` |
| Shared types | Hand-written API contract types | `shared/` |
| Google integration | Hand-rolled JWT + REST (googleapis npm doesn't run on Workers) | `api/src/lib/google.ts` |
| Hosting | GitHub Pages (site), Cloudflare (API + DB) | — |
| CI/CD | GitHub Actions (2 workflows, path-filtered) | `.github/workflows/` |

Dependency policy: everything tracks `latest`; `npm outdated` at the root is
the health check. One deliberate holdback: `@types/node` stays on major 24 to
match the Node 24 LTS runtime (`.nvmrc`) — bump both together.

## Monorepo layout

npm workspaces (`shared`, `web`, `api` — declared in root `package.json`):

```
├── web/                  React SPA → GitHub Pages
│   ├── src/pages/        One file per routed page (Home, Ledger, Tasks, …)
│   ├── src/components/   Shared UI (MarkdownArticle, Seo, …)
│   ├── src/content/      durga-puja/*.md — the book, compiled at build time
│   ├── src/lib/          api.ts (fetch wrapper), auth.ts, markdown.ts
│   └── public/           Static assets (bookdurgapuja/ images, og.webp)
├── api/                  Hono Worker → Cloudflare
│   ├── src/index.ts      App entry: CORS, /health, route mounting
│   ├── src/auth.ts       better-auth configuration (read its comments!)
│   ├── src/env.ts        The full environment-variable contract
│   ├── src/db/schema.ts  Drizzle schema — the single source of DB truth
│   ├── src/routes/       public, members, ledger, tasks, admin, onboarding, oauth, posts
│   ├── src/lib/          google.ts (SA JWT + Sheets/Drive REST), pujo.ts
│   ├── drizzle/          SQL migrations 0000–0005 (+ meta/)
│   ├── seed*.sql         seed.sql, seed-tasks.sql, seed-nirghanto.sql, seed-ledger.sql
│   ├── wrangler.jsonc    Worker + D1 binding config
│   └── .dev.vars         LOCAL secrets (git-ignored; template: .dev.vars.example)
├── shared/               @pujosamiti/shared — API contract types + constants
│   └── src/index.ts      EVENT_KINDS, MemberRole, PujoEvent, TaskView, …
│       src/locations.ts  Societies/towers list (deliberately code, not DB)
├── docs/                 You are here (tmp/ = gitignored scratch, backups & archived v1 docs)
└── .github/workflows/    deploy-web.yml, deploy-api.yml
```

## Environments

| | Local | Prod |
| --- | --- | --- |
| Site | http://localhost:5173 (Vite dev server) | https://pujosamiti.github.io (Pages) |
| API | http://localhost:8787 (`wrangler dev`, Miniflare) | https://pujosamiti-api.pujosamiti.workers.dev |
| DB | SQLite file under `api/.wrangler/state/v3/d1/` | D1 `pujosamiti` in Cloudflare APAC |
| Secrets | `api/.dev.vars` (git-ignored file) | Cloudflare Worker secrets (`wrangler secret put`) |
| `WEB_ORIGIN` | `http://localhost:5173` (from `.dev.vars`) | `https://pujosamiti.github.io` (plain var in `wrangler.jsonc`) |
| Google credentials | **Same** OAuth client + service account as prod (both localhost and prod URLs are registered on the one client) | same |
| `BETTER_AUTH_SECRET` | **Different** from prod, deliberately | own value |

The two databases never sync automatically. To refresh local with prod data,
follow [005-backup-and-restore.md](005-backup-and-restore.md).

## Key data flows

1. **Public browsing** — Pages serves the SPA; it calls `/api/public/events`
   and `/api/public/timetable` (no auth). The Durga Puja book needs no API at
   all: chapters are markdown compiled into the bundle, prerendered to real
   HTML per page for search engines and WhatsApp previews.
2. **Member sign-in** — "Continue with Google" → better-auth on the Worker →
   Google OAuth → session row in D1. The session travels as a **bearer token
   in localStorage**, not (only) a cookie — see
   [009-auth-and-membership.md](009-auth-and-membership.md) for why (iOS).
3. **Member content** — every `/api/members/*` call is checked server-side:
   session email → `person` row → active + tier ≠ `non_member`, else 403.
   Role (`member`/`coremember`/`fin_admin`/`admin`) is computed per request.
4. **Money** — fin_admins/admins write `ledger_entry` rows (one money table,
   two perpetual books); wallets are derived, entries harden after 48 h.
   Details in [004-database.md](004-database.md) §5.
5. **Deploys** — push to `main` → path-filtered GitHub Actions →
   Pages artifact (web) / `wrangler deploy` (api). No build output in git.
   Details in [006-ci-cd-deployments.md](006-ci-cd-deployments.md).

## The samiti year (domain context you'll need)

The samiti year runs Poila Baishakh (April) → Saraswati Pujo (next Jan/Feb);
the **ledger reporting season runs 1 July → 30 June** (season-start year keys
`budget_line.year`). Five event kinds are fixed in code (`EVENT_KINDS` in
`shared/src/index.ts`) — adding a kind is a code change, by design. The
2020–2035 event calendar is seeded (`api/seed.sql`). Historical books from
2020 were imported through a one-time ETL, reconciled to the rupee against
the treasurers' original sheets.
