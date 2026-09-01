# Auth & membership

How sign-in works (including the iOS story that shaped it), and how the samiti
decides who sees what. The code: `api/src/auth.ts` (better-auth config),
`api/src/routes/members.ts` (the member gate), `api/src/routes/admin.ts` (the
admin gate), `web/src/lib/auth.ts` (client side).

## 1. Sign-in: better-auth on the Worker

better-auth owns `/api/auth/*` on the Worker (mounted in `api/src/index.ts`).
Providers: **Google** (live) and **Facebook** (configured with placeholder
credentials — deferred; the button would fail). Sessions, accounts and OAuth
state live in D1 (`user`, `session`, `account`, `verification` tables).

Signing in creates a `user` row for anyone with a Google account.
**That grants nothing by itself** — membership is a separate check (§3).

## 2. The iOS cookie problem (why sessions are bearer tokens)

The site lives on GitHub Pages, the API on workers.dev — so every auth cookie
is **third-party**. Safari and every browser on iOS (including WhatsApp's
in-app browser), plus Chrome incognito and Firefox, refuse those cookies. The
portal is used almost entirely from phones, so sign-in must not depend on
cookies at all. Two measures in `api/src/auth.ts`:

- **`bearer()` plugin** — the app authenticates with
  `Authorization: Bearer <token>`; the token is kept in localStorage
  (`pujosamiti.session`, see `web/src/lib/api.ts`). Cookies are still issued
  and used where browsers allow them; the bearer header covers everyone else.
- **`skipStateCookieCheck: true`** — drops the OAuth state *cookie* as a
  second check (iOS discards it mid-flow, which used to break the Google
  callback). The state itself is still random, stored in the `verification`
  table, matched on callback and deleted after one use — that remains the
  actual CSRF protection.

Plus `sameSite: 'none', secure: true` on cookies, and CORS locked to
`WEB_ORIGIN` with credentials.

Consequence for testing: an OAuth flow must start **and** finish in the same
browser — fetching the sign-in URL with `curl` and pasting it fails with
`state_mismatch`.

## 3. The member gate (server-side, always)

Every `/api/members/*` request passes the middleware at the top of
`members.ts`:

1. Resolve the better-auth session (cookie or bearer). None → 401.
2. Look up a `person` whose `email` **or `alt_email`** equals the session's
   email (people can hold two sign-in addresses).
3. Require `is_active` and `tier ≠ 'non_member'`, else 403
   ("not a samiti member").

Hiding routes in the React bundle protects nothing — enforcement lives here.

**⏳ OPEN MEMBERSHIP window (until 30 Oct 2026 IST, inclusive)** —
`OPEN_MEMBERSHIP_UNTIL` / `openMembershipActive()` in shared. While active,
an `is_active` person whose tier is still `non_member` passes the gate with
the computed role **`newsignin`**: two pages (Bhog & Food Menu and
Sponsorship) and exactly TWO writes — their household's headcount and their
own sponsorship pledge (create only — a pledge is released by an admin, never
by the pledger; enforced centrally in the members middleware: any other
non-GET → 403, and a non-proxy pledge is self-only). Onboarding skips "awaiting
activation" — completing the profile is enough. Stored tiers are untouched:
new sign-ins register `origin='self'` / `tier='non_member'`, appear under
**Pending activation** on /membership, and an admin setting their tier
upgrades them instantly (roles are computed per-request). Un-activated
people fall back to 403 when the window closes; to end it early, move the
date back and deploy. Role checks throughout the code use `isCoreRole()` —
never `role !== 'member'`, which `newsignin` would slip past.

## 4. Roles

> Who may do what on each page — the full matrix, and where each rule is
> enforced — is [014 · Roles & access](014-roles-and-access.md). This section
> is about how a person *becomes* a role.

Computed per-request from the person row, in priority order
(`members.ts`):

```
admin       is_admin = true            — everything
fin_admin   is_fin_admin = true        — everything money, without the membership roll
coremember  tier = 'core'              — committee: task planning, admin READS
member      tier = 'member'            — member content
newsignin   tier = 'non_member', open  — bhog + sponsorship views; headcount + own pledge (window, §3)
(non_member / inactive / no row        — public content only)
```

Gates in practice:

- **Member content** (`/api/members/*` reads, tasks, ledger *views*): any
  role above.
- **The books** (ledger/budget/sponsorship/claims **writes**): `fin_admin`
  or `admin` only (`ledger.ts` — "anything that writes the books is finance
  work"). A treasurer needs the books, not the roll; admins hold fin powers
  implicitly.
- **Admin routes** (`/api/admin/*` — people, families, events, timetable):
  middleware admits `core` tier or admins for **reads**; every **write**
  additionally requires `is_admin` (`requireAdmin`).
- The purohit's phone number appears only in the members' events feed, never
  the public one.
- **Sign-in emails are private, admins included**: the admin people API masks
  them (`maskEmail` → "xxxxxx@gmail.com"; full addresses never leave the
  Worker). The admin edit form round-trips the masked value, which the update
  route treats as "unchanged" (`isMaskedEmail`) — typing a full address still
  sets/replaces it. Search-by-email still works (matching is server-side).
  The samiti sends no email of any kind; addresses exist only to recognise
  sign-ins. The SignInCard says all this to first-time users.

## 5. Membership lifecycle

- **The roll is the truth**: `person` rows exist for the whole community
  (205 at audit time), most with `origin='roster'` — entered by admins or the
  historical import. Many have no email; they're full members who don't use
  the site.
- **Self-registration**: someone signs in → no matching person → the
  onboarding flow (`/api/onboarding/*` — status/profile/leave) creates a
  person at `tier='non_member'`, `origin='self'`, and they see the "Almost
  there" screen.
- **Activation is manual**: an admin promotes tier (admin UI → `/api/admin/
  people/:id/tier`, or SQL). Only then does member content open.
- **The participation rule** (`api/src/lib/roll.ts`, counter entries): when an
  admin/fin_admin records a headcount or a contribution for someone, the
  roll updates itself — subscription/sponsorship ≥ ₹10,000
  (`CORE_CONTRIBUTION_THRESHOLD`) → **core**, any other recorded
  participation → non-member becomes **member**, inactive people reactivate.
  Upgrades only; nothing auto-demotes. Fires on ledger contribution entries,
  pledge payments and proxied headcounts — not on self-service actions.
- **Counter entries**: admins/fin_admins carry a full-roster person picker
  (ex/non-members and inactive included, `/people-full`) on the headcount
  form and the ledger contributor/pledger fields, plus walk-up creation
  (`/counter-person`, `origin='counter'`, no email). A fresh contribution
  offers a one-tap jump to `/bhog?count=<personId>` to take the household's
  headcount immediately.
- **Tier meaning**: `core` ≈ committee (typically follows the Durga Pujo
  subscription ≥ the threshold constant); `member` = regular; promotion is
  always an explicit admin act — sponsorships never affect tier.
- **Leaving**: `is_active=false` (soft), or the self-service "leave" endpoint.
- **Duplicates**: admin merge endpoint (`/people/:id/merge`) folds one person
  into another.

### Granting access by hand (until/beyond the admin UI)

```sh
cd api
npx wrangler d1 execute pujosamiti --remote --command \
  "UPDATE person SET tier='member' WHERE email='their.email@gmail.com';"
```

(`--local` for your dev DB — separate databases, the eternal reminder.
Remember `alt_email` when someone signs in with a second address.)

## 6. Client side

`web/src/lib/api.ts` attaches the bearer token from localStorage to every
call and sends `credentials: 'include'` for the cookie-capable browsers. The
`/api/oauth/done` route finishes the popup/redirect dance after Google.
Member pages (`/membersonly`, `/ledger`, `/wallets`, `/sponsorship`,
`/reimbursements`, `/tasks`, `/membership`, `/profile`) all fetch through the
gate; the UI adapts to `me.role` but the server is the enforcer.
