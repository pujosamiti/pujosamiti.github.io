# Pujo Samiti

[![Deploy web](https://github.com/pujosamiti/pujosamiti.github.io/actions/workflows/deploy-web.yml/badge.svg)](https://github.com/pujosamiti/pujosamiti.github.io/actions/workflows/deploy-web.yml)
[![Deploy api](https://github.com/pujosamiti/pujosamiti.github.io/actions/workflows/deploy-api.yml/badge.svg)](https://github.com/pujosamiti/pujosamiti.github.io/actions/workflows/deploy-api.yml)

![Node](https://img.shields.io/badge/Node-24-5FA04E?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19.2-087EA4?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?logo=tailwindcss&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-8.3-CA4245?logo=reactrouter&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?logo=reactquery&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-4.12-E36002?logo=hono&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Wrangler-4-F38020?logo=cloudflareworkers&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-0.45-C5F74F?logo=drizzle&logoColor=black)
![better-auth](https://img.shields.io/badge/better--auth-1.6-121212)
![oxlint](https://img.shields.io/badge/oxlint-1.71-7A64FF)

App for the probasi bengali community of Magarpatta City, Pune — Durga Pujo, Kojagari
Lakshmi Puja, Bijoya Sammelani, Saraswati Puja and Poila Baishakh. Public site plus
member-only sections (budget, accounts with collector wallets, procurement, paperwork).

**Runs entirely on free tiers**: GitHub Pages (frontend), Cloudflare Workers + D1 (API + DB),
Google Drive/Sheets via a service account (content drop-zone + treasurers' accounting).

## Layout

| Folder    | What                                                        | Deploys to |
| --------- | ----------------------------------------------------------- | ---------- |
| `web/`    | React 19 + Vite + Tailwind v4 + shadcn-style UI, mobile-first | GitHub Pages |
| `api/`    | Hono on Cloudflare Workers, D1 (Drizzle), better-auth        | Cloudflare |
| `shared/` | API contract types used by both                              | —          |

### Dependency policy

Everything tracks `latest`; `npm outdated` at the root is the health check — badge
versions above are a snapshot, `package.json` is the truth. One deliberate holdback:
`@types/node` stays on major 24 to match the Node 24 LTS runtime (`.nvmrc`) — bump
both together when the next LTS lands.

## Local dev

```sh
nvm use               # Node 24
npm ci
cp api/.dev.vars.example api/.dev.vars   # fill in secrets
npm run dev:api       # Worker on :8787
npm run dev:web       # Vite on :5173
```

Create the local DB once: `npm run db:generate -w api && npm run db:migrate:local -w api`.

## One-time production setup (all free, no card)

1. **Cloudflare**: `wrangler login`, then `wrangler d1 create pujosamiti` — put the
   `database_id` into `api/wrangler.jsonc`. Apply migrations with
   `npm run db:migrate:remote -w api`.
2. **Google OAuth**: Google Cloud console → Credentials → OAuth client (web).
   Authorized redirect: `https://<worker>.workers.dev/api/auth/callback/google`.
3. **Facebook Login**: developers.facebook.com app → add the same style callback
   `/api/auth/callback/facebook`.
4. **Service account**: Google Cloud console → Service account → JSON key. Share the
   accounts spreadsheet and the content Drive folder with the service-account email
   (viewer). Nothing needs to be public.
5. **Worker secrets**: for each name in `api/.dev.vars.example`, `wrangler secret put NAME`.
   Set `WEB_ORIGIN` var in `wrangler.jsonc` to the Pages URL.
6. **GitHub**: this repo lives at `pujosamiti/pujosamiti.github.io` (org site → served
   at https://pujosamiti.github.io from `/`; the repo must be public on the free plan).
   Settings → Pages → Source: GitHub Actions. Add repo secret `CLOUDFLARE_API_TOKEN`
   (Workers deploy template) and repo variable `API_URL` (the worker URL). Push to
   `main` — path-filtered workflows deploy each side. Build output is never committed;
   Pages serves the workflow artifact.

## Content workflow

- **Blogs/magazine**: drop markdown into the content Drive folder, named
  `blog--<event-id>--<slug>.md` or `magazine--<slug>.md`, with optional
  `--- title: … / author: … / date: … ---` frontmatter. The site renders it as HTML.
- **Accounting**: treasurers keep working in the Google Sheet (`Wallets`, `Expenses`
  tabs); the API serves read views to signed-in members.
- **Notices, time tables, gallery, events**: rows in D1 (admin UI to come; until then
  `wrangler d1 execute`).
- **Members**: sign-in is open (Google/Facebook) but content is allowlisted — add each
  family to the `member` table to grant access.

## Design

লাল-পাড় সাদা — the white sari with the red border. Light mode is a pure-white ground
with sindoor red; dark mode is dhunuchi night. Alpona appears only as white line-work
on sindoor bands. Headings set in **Noto Serif Bengali**, body in **Hind Siliguri**.
Mobile-first: bottom tab nav, 44px touch targets, card lists instead of tables on phones.

Tokens live in [`web/src/index.css`](web/src/index.css) — that file is the source of
truth; the table below mirrors it. Every colour is named for what it is in the pujo world.

### Colour palette

| Token | Light | Dark | Role |
| ----- | ----- | ---- | ---- |
| **shada** / background | ![#FFFFFF](https://img.shields.io/badge/%23FFFFFF-FFFFFF?style=flat-square) | ![#191008](https://img.shields.io/badge/%23191008-191008?style=flat-square) | Page ground — pure white / dhunuchi night |
| **kali** / foreground | ![#2B1A10](https://img.shields.io/badge/%232B1A10-2B1A10?style=flat-square) | ![#F2E6D0](https://img.shields.io/badge/%23F2E6D0-F2E6D0?style=flat-square) | Warm ink text |
| **sindoor** / primary | ![#E10D11](https://img.shields.io/badge/%23E10D11-E10D11?style=flat-square) | ![#FF5A52](https://img.shields.io/badge/%23FF5A52-FF5A52?style=flat-square) | Buttons, focus ring, header bands |
| **jaba** | ![#D70000](https://img.shields.io/badge/%23D70000-D70000?style=flat-square) | ![#E5322C](https://img.shields.io/badge/%23E5322C-E5322C?style=flat-square) | Hibiscus — hover/pressed red |
| **palash** | ![#EB0000](https://img.shields.io/badge/%23EB0000-EB0000?style=flat-square) | ![#FF4C42](https://img.shields.io/badge/%23FF4C42-FF4C42?style=flat-square) | Flame of the forest — vivid highlight, small doses |
| **rokto** / destructive | ![#99090C](https://img.shields.io/badge/%2399090C-99090C?style=flat-square) | ![#FF928C](https://img.shields.io/badge/%23FF928C-FF928C?style=flat-square) | Destructive actions (dark-mode bands also use #99090C) |
| **genda** / secondary | ![#EFA51E](https://img.shields.io/badge/%23EFA51E-EFA51E?style=flat-square) | ![#F2B440](https://img.shields.io/badge/%23F2B440-F2B440?style=flat-square) | Marigold — never used as text colour |
| **shiuli** | ![#D96410](https://img.shields.io/badge/%23D96410-D96410?style=flat-square) | ![#E88A34](https://img.shields.io/badge/%23E88A34-E88A34?style=flat-square) | Night-jasmine stem orange accent |
| **matir** | ![#9A5732](https://img.shields.io/badge/%239A5732-9A5732?style=flat-square) | ![#B97A4C](https://img.shields.io/badge/%23B97A4C-B97A4C?style=flat-square) | Terracotta earth accent |
| **sharat** | ![#2E6E8E](https://img.shields.io/badge/%232E6E8E-2E6E8E?style=flat-square) | ![#6FA8C4](https://img.shields.io/badge/%236FA8C4-6FA8C4?style=flat-square) | Autumn-sky blue — info states in admin tables only |
