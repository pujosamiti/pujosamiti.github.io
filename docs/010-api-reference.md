# API reference

Every route the Worker serves, what gates it, and which frontend page calls
it. Mount points are in `api/src/index.ts`; response envelope is
`ApiResult<T>` = `{ ok: true, data }` | `{ ok: false, error }` (types in
`shared/src/index.ts` — the API contract both sides compile against).

Base URLs: prod `https://pujosamiti-api.pujosamiti.workers.dev`,
local `http://localhost:8787`.

## Route map

| Mount | File | Gate |
| --- | --- | --- |
| `GET /health` | `index.ts` | none |
| `/api/auth/*` | better-auth handler | its own flows |
| `/api/oauth` | `routes/oauth.ts` | none (OAuth completion) |
| `/api/public` | `routes/public.ts` + `routes/posts.ts` | none |
| `/api/onboarding` | `routes/onboarding.ts` | signed-in user |
| `/api/members` | `routes/members.ts` (mounts `ledger.ts` at `/ledger`, `tasks.ts` at `/tasks`) | active member ([009](009-auth-and-membership.md) §3) |
| `/api/admin` | `routes/admin.ts` | core/admin read · admin write |

## Public (no auth)

The three `/api/public/bhog/headcount` routes are the **headcount link**
(`/bhog/count/?c=X481216`): one code per Durga Pujo, shared on WhatsApp, no
sign-in. A wrong, revoked or past-season code gets a plain message; every
call is capped per IP (`HEADCOUNT_LIMITER`, 60 a minute — see
[007](007-cloudflare.md)).

| Route | Returns | Called by |
| --- | --- | --- |
| `GET /health` | `{ok:true}` | monitoring / smoke tests |
| `GET /api/public/events` | Event list (no purohit phone) | Home, Events, Schedule pages |
| `GET /api/public/timetable` | Nirghanto rows for the active event | Nirghanto page |
| `GET /api/public/bhog/headcount?c=` | The headcount link's front page (`BhogLinkSheet`): the event and the households to pick from — the Responses list, names only | `/bhog/count/` |
| `GET /api/public/bhog/headcount/household?c=&h=` | One listed household's form (`BhogHeadcountView`): days, counts, allowance, which days are open | `/bhog/count/` |
| `POST /api/public/bhog/headcount` | Save one listed household's counts (`{code, householdKey, counts}`), same rules as `/rsvp`; recorded against the household's contact (its top giver this season) | `/bhog/count/` |
| `GET /api/public/posts` · `GET /api/public/posts/:slug` | Blog/magazine posts listed from the content **Drive folder** | ⚠️ **dormant — no frontend caller**; needs `CONTENT_DRIVE_FOLDER_ID` (unset in prod) |

## OAuth completion

| Route | Purpose |
| --- | --- |
| `GET /api/oauth/done` | Lands after the Google flow; hands the session/bearer token back to the SPA |

## Onboarding (signed-in, not yet a member)

| Route | Purpose |
| --- | --- |
| `GET /api/onboarding/status` | Where am I in the flow? (`OnboardingState`) |
| `GET /api/onboarding/me` | The self-registered profile |
| `POST /api/onboarding/profile` | Create/update own person row (`origin='self'`, tier stays `non_member`) |
| `POST /api/onboarding/leave` | Self-service leave |

## Members (active member required)

| Route | Purpose |
| --- | --- |
| `GET /api/members/me` | Identity + computed role + portfolio |
| `GET /api/members/people` | Light people list (pickers) |
| `GET /api/members/events` | Events **including purohit phone** |
| `GET /api/members/people-full` | **Admin/fin_admin**: the counter picker roster — every person, active or not (name, tier, society only) |
| `POST /api/members/counter-person` | **Admin/fin_admin**: walk-up creation — joins the roll active at the `tier` the admin chose (required: `core` · `member` · `non_member`), `origin='counter'` |
| `GET /api/members/accounts/:eventId` | Wallet/expense summary read live from the treasurers' **Google Sheet** (`Wallets`/`Expenses` tabs) | ⚠️ **dormant — no frontend caller**; needs `ACCOUNTS_SHEET_ID` (unset in prod); superseded in practice by `/ledger/*` |

### Tasks (`/api/members/tasks` — Puja Planning; writes are member-wide, reads too)

| Route | Purpose |
| --- | --- |
| `GET /` | Task catalog + this year's state + assignments (`TaskView`) |
| `POST /` · `POST /:id` | Create / edit a master task |
| `POST /:id/year` | Year row: phase, checkdates, notes, owners (max 5) |
| `POST /:id/skip` | Skip a task this year |
| `POST /:id/volunteer` | Sign up / withdraw as volunteer |

### Ledger (`/api/members/ledger` — reads for all members; **writes require fin_admin/admin**)

| Route | Purpose |
| --- | --- |
| `GET /entries` · `GET /summary?year=` · `GET /spend` | The books: entries, season summary, spend aggregates |
| `POST /entries` · `POST /entries/:id/update` · `POST /entries/:id/void` | Write/correct/void (48 h hardening window — [004](004-database.md) §2) |
| `GET /sponsorship?year=` | Items + year state + pledges |
| `POST /sponsorship/items` · `POST /sponsorship/items/:id/year` | Catalog & yearly pricing |
| `POST /sponsorship/pledges` · `…/:id/pay` · `…/:id/cancel` | Pledge lifecycle. Anyone pledges (self only unless admin/fin_admin); pay and cancel are admin/fin_admin — pay writes the ledger entry |
| `GET /budget?year=` · `POST /budget` · `POST /budget/bulk` · `POST /budget/:id/delete` | Season budget lines |
| `GET /claims` · `POST /claims` · `…/:id/assign` · `…/:id/settle` · `…/:id/reject` · `…/:id/cancel` | Reimbursements (settle writes the vendor expense + link) |

### Puja Days & nirghanto finalisation

| Route | Purpose |
| --- | --- |
| `GET /api/members/puja-days?year=` | The year's canonical days + finalisation state + nirghanto-sync flag |
| `POST /api/admin/events/:id/nirghanto-finalize` | Admin: declare the nirghanto published & final (or reopen) |
| `POST /api/admin/events/:id/seed-puja-days` | Admin: create Puja Days from the finalised nirghanto |
| `POST /api/admin/events/:id/resync-puja-days` | Admin: re-align days after nirghanto edits (orphans reported, never auto-deleted) |

### Procurement (`/api/members/procurement` — CORE-ONLY, reads included; seeding/prefill admin-only, active pujo year only)

The yearly shopping sheet: items × day columns × Morning/Evening
([004](004-database.md) §2 "Procurement").

| Route | Purpose |
| --- | --- |
| `GET /?year=` | `ProcurementView`: the year's day columns + items with totals/status and cells |
| `POST /items` · `POST /items/:id` | Catalog item create/edit (isActive=false = soft delete) |
| `POST /items/:id/year` | Upsert the item's Total Quantity / status / remarks for the year |
| `POST /days` · `POST /days/:id` · `POST /days/:id/delete` | The year's day columns (delete cascades its cells) |
| `POST /cells` | Upsert one cell (item × day × slot); a blank quantity clears it, and the blank is remembered so prefill never resurrects it |
| `POST /cells/:id/purchased` | Tick / untick while shopping |
| `GET /master` | The master list: catalog + suggested totals + tithi × slot suggestions |
| `POST /items/:id/suggestions` | Replace an item's suggested quantities (core) |
| `POST /days/seed` | **Admin**: create the year's delivery columns from its Puja Days (evening-before 19:00; Sandhi same-morning 10:00) |
| `POST /days/prefill` | **Admin**: fill totals + cells from the master list, mapping tithis onto the year's actual days; adds only, never overwrites |

### Bhog & food menus (`/api/members/bhog` — published days for all members; drafts and writes are core work, current season only)

One menu per calendar date per event — five occasions a season
([004](004-database.md) §2 "Bhog & food menus").

| Route | Purpose |
| --- | --- |
| `GET /?season=` | The season's menu days across its events (`BhogMenuView[]`) — members get published only, editors everything |
| `POST /days/seed` | **Admin**: create a Durga Pujo event's bhog days from its Puja Days, Saptami → Dashami, one per calendar date (`{eventId}`) |
| `POST /days` · `POST /days/:id` · `POST /days/:id/delete` | Day CRUD (event/label/date/per-plate ₹/notes) — single-meal events add their one menu here |
| `POST /days/:id/publish` | Publish/unpublish a day to the members |
| `POST /days/:id/items` | Replace a day's dishes wholesale |
| `GET /headcount?eventId=&householdKey=&personId=` | A household's form (`BhogHeadcountView`) — the member's own; admin/fin_admin pass `householdKey` (the Responses list, as the link's picker) or `personId` (a walk-in) for anyone's. `POST /rsvp` takes the same two |
| `POST /rsvp` | **Any member**: their household's headcount, in one go; admin/fin_admin may pass `personId` to record for any household (+optional `note`); never changes a tier. One row per household per day (a family's old rows are replaced). **Durga Pujo** enforces the allowance and the cut-off (`api/src/lib/headcount.ts`); admin/fin_admin may still change a closed day |
| `GET /counts?eventId=` | **Core**: the household-by-household count sheet for one event — `{households, rows}`: every household (a family, or the person when they have none) where someone paid a subscription or sponsorship, or holds a sponsorship pledge that isn't cancelled, in the event's season — answered or not — plus anyone who has answered; each row carries its `householdKey` and a family's counts are the sum of its people's; Durga Pujo households over their allowance carry `overAllowance` |
| `GET /guests?eventId=` | **admin/fin_admin**: the guest bhog board (`GuestBhogSheet`) — settings, and each household with guests or guest money: guests by day, due, received (from the ledger), balance |
| `POST /setting` | **admin/fin_admin**: the event's Food & Bhog in-charge and guest rate (`{eventId, inchargePersonId, guestRate}`; null rate = off) |
| `POST /guests/receive` | **admin/fin_admin**: record a guest bhog payment — writes the ledger entry `misc_income · Guest Bhog`, event-tagged, payer = the household's contact, wallet = the receiver. Optional `{menuId, guests}` adds guests paid for at the counter to that day's count first (20-a-day cap, cut-off waived), so due and money agree; the ledger form's "Core Member Guest Bhog" toggle posts here for any eligible core household |
| `GET /link?eventId=` · `POST /link` | **admin/fin_admin**: the event's one headcount link (`{code, createdAt}` or null); `POST {eventId, replace?}` issues it — Durga Pujo, current season — and with `replace` revokes the live one first |

## Admin (`/api/admin` — core/admin read, admin write)

| Route | Purpose |
| --- | --- |
| `GET/POST /people` · `POST /people/:id` · `POST /people/:id/tier` · `POST /people/:id/merge` · `DELETE /people/:id` | The membership roll. Creating (`POST /people`) requires `tier` — `core` · `member` · `non_member`, no default. `GET /people` rows carry `qualifiesForCore` (`{season, total}` or null), the core marker |
| `GET/POST /families` · `POST /families/:id` | Family groupings |
| `GET/POST /events` · `POST /events/:id` · `DELETE /events/:id` | Event calendar (incl. purohit fields, notes) |
| `POST /timetable` · `POST /timetable/:id` · `DELETE /timetable/:id` | Nirghanto rows |

## Frontend pages → API (the reverse map)

Routes from `web/src/main.tsx`:

| Page (URL) | Talks to |
| --- | --- |
| `/` Home, `/events`, `/schedule` | `/api/public/events`, `/api/public/timetable` |
| `/durga-puja`, `/durga-puja/:slug` | **no API** — markdown compiled into the bundle ([011](011-content-and-seo.md)) |
| `/nirghanto` | `/api/public/timetable` (+ members events for phone if signed in) |
| `/login`, `/profile` | `/api/auth/*`, `/api/oauth/done`, `/api/members/me`, onboarding |
| `/membersonly` | `/api/members/*` |
| `/tasks` | `/api/members/tasks/*` |
| `/procurement` | `/api/members/procurement/*`, `/api/members/puja-days` |
| `/procurement/master` | `/api/members/procurement/master` + item/suggestion writes |
| `/bhog` | `/api/members/bhog/*`, `/api/members/puja-days` |
| `/nirghanto` | timetable routes + `/api/members/puja-days` + admin finalise/seed/resync |
| `/membership` | `/api/admin/people`, `/api/admin/families` |
| `/ledger`, `/wallets`, `/sponsorship`, `/reimbursements` | `/api/members/ledger/*` |
| `/brandcolours` | nothing — the design-system reference page ([012](012-design-system.md)) |

Adding a route: define it in the right `routes/*.ts` file (respecting the
mount's gate), add/extend the contract type in `shared/src/index.ts`, and
call it through `web/src/lib/api.ts` — the shared types make a mismatch a
compile error on both sides, which the CI typecheck gate then catches.

## উমা

The magazine's endpoints (`/api/public/uma/*` and the desk at
`/api/members/uma/*`) were removed when the magazine was archived on
26 Sep 2026 — see [015](015-uma-magazine.md) and the git tag
`uma-magazine-archive`. The daily quiz and puzzle that replaced it
([016](016-uma-games.md)) run entirely in the browser and call no API.
