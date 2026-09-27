# Roles & access

Who can see what, and who can change it — surface by surface. [009](009-auth-and-membership.md)
explains how a person becomes a role; this document says what each role may then
do. Verified against the code on **1 Sep 2026**.

## 1. The three axes

Access is not one ladder. Two independent things decide what somebody sees:

**The member role** — computed per request from the person row, in priority
order (`api/src/routes/members.ts`):

```
admin       is_admin = true
fin_admin   is_fin_admin = true
coremember  tier = 'core'
member      tier = 'member'
newsignin   tier = 'non_member', during the open-membership window
```

Two helpers do most of the gating, and reading them correctly matters:

| Helper | Admits | Used for |
| --- | --- | --- |
| `isCoreRole` | coremember, fin_admin, admin | committee surfaces |
| `isProxyRole` | fin_admin, admin | acting on someone else's behalf |

`fin_admin` passes `isCoreRole`, so a treasurer sees every committee surface
without holding the membership roll. `admin` passes everything.

**The webmaster** — not a role but one account, `p-samiti` ("Pujo Samiti"),
identified by `isWebmaster(personId)` in `shared`. It curates the sponsorship
catalog: which slots exist and which a given year offers. Nobody else, admins
included, gets those controls.

**The cultural admin** — a flag, not a role: `person.is_cultural_admin`,
ticked by an admin on the person's form in /membership (a "cultural" badge
on their card). A core member with it runs the cultural programme; admins
hold it implicitly. The check is `canRunCulture(me)` in `shared`.

(A further axis, **the Uma seat** on the magazine masthead, retired with the
magazine on 26 Sep 2026 — see [015](015-uma-magazine.md). `/uma` is now the
public daily quiz and puzzle, open to everyone with no sign-in.)

## 2. The Members Area, card by card

**—** not shown · **R** read · **W** write

| Card | newsignin | member | core | fin_admin | admin |
| --- | --- | --- | --- | --- | --- |
| Ledger | — | — | R | **W** | **W** |
| Wallets | — | R | R | R + budget **W** | R + budget **W** |
| Sponsorship | — ¹ | — ¹ | — ¹ | — ¹ | **W** |
| Reimbursements | — | — | R + own claims | **W** settle | **W** settle |
| Puja Planning | — | R | **W** + volunteer | **W** + volunteer | **W** + volunteer |
| Procurement | — | — | **W** | **W** | **W** |
| Bhog & Food Menu | R + headcount | R + headcount | R + headcount + responses | + ₹ + proxy count | **W** |
| Cultural Function | — | R | R (**W** if cultural admin) | R (**W** if cultural admin) | **W** |
| Membership | — | — | R | R | **W** |
| Nirghanto | — | — | R | R | **W** |
| Events | — | — | R | R | **W** |
| Brand Colours | — ² | R | R | R | R |

¹ Admin-only until **25 Sep 2026 IST** (`SPONSORSHIP_OPENS_ON`). From that
morning every member and new sign-in reads the board and pledges for
themselves; fin_admin and admin pledge for another household, record payment
and release a pledge; the **webmaster** alone offers or skips a slot.

² Reachable by URL; simply not carded for new sign-ins.

## 3. The lines that matter

**Money is written by two roles.** Core members read the ledger and do the
day-to-day — raising a claim, taking one on — but every entry, budget line,
sponsorship price and payment is `fin_admin` or `admin` (`canFinance`).
A ledger entry hardens 48 hours after creation: after that nobody edits or
voids it, admins included, and a correction needs a direct database write.

**Tiers are an admin's decision alone.** Only `admin` sets core, member or
non-member — at creation, where the choice is compulsory on every form, and
afterwards with the card buttons on /membership. No payment, pledge or
headcount changes a tier or active status, so a finance entry can never grant
committee access. People whose season's puja subscriptions and sponsorships
reach ₹10,000 are marked **Qualifies for Core** for the admin to act on.

**A new sign-in has exactly two writes**, enforced centrally in the members
middleware rather than route by route: their household's headcount, and their
own sponsorship pledge. Every other non-GET returns 403.

**Pledging is self-service; releasing is not.** Anyone may pledge for
themselves, once. Only `isProxyRole` may pledge for another household, record
a payment, or release a pledge — a slot someone has claimed goes back on the
board only when an admin decides the money is not coming.

**Bhog splits three ways.** Everyone reads the menu and gives their own
headcount. Core members also see the responses table — every household that
paid or pledged this season, answered or not, with plate counts — and download it as Excel or
PDF. fin_admin and admin additionally see the per-plate cost — on the cards,
in the `Total ₹` row, and in the downloaded sheet — and may record a
headcount for another household (closed days included), and see and share
the event's **headcount link** — the one code that opens every paying
household's counts without sign-in, so only they hold it and can replace it.
A family on the link can change any listed household's counts, within that
household's allowance. **Guest bhog** — a core household's office colleagues
and friends, charged per head — is marked received only by admin and
fin_admin (the Guest bhog panel on /bhog, or the ledger form's "Guest bhog
payment" toggle); both write the same ledger entry. Recording a count never changes that household's tier.
Only `admin` adds, edits, publishes, unpublishes or deletes a menu day.

**The cultural programme belongs to the cultural admins.** Every member
reads each evening's running order; only cultural admins — core members with
the flag, and every admin — add, edit and delete items and arrange the
running order with the ↑ / ↓ arrows, whoever added the item. Other core
members, fin_admins included, read. Which evenings have a programme is the
admin's call — a mark on each day in the Days of the Pujo. New sign-ins see
nothing of it — no card, and the API refuses them. All of this is enforced
in the API as well as the UI.

**Archival seasons are read-only for everyone**, admins included. Past
sponsorship boards take no pledges; past bhog seasons take no edits; a past
ledger year is a record, not a workspace.

## 4. Where enforcement actually lives

Not every rule in §2 is enforced on the server. Deliberately — the UI is the
product surface and the samiti is 200 people, not the public internet — but a
reader should know which is which.

| Rule | UI | API |
| --- | --- | --- |
| Ledger/budget/sponsorship writes → finance | ✅ | ✅ |
| Pledge for another household → proxy | ✅ | ✅ |
| Release a pledge → proxy | ✅ | ✅ (also removed from `MEMBER_OPEN` and the new-signin allowlist) |
| Per-plate cost → proxy | ✅ | ✅ (a core member's menu edit carries the stored price through) |
| Cultural programme writes → cultural admin | ✅ | ✅ |
| Bhog day add/edit/publish/delete → admin | ✅ | ❌ still `isCoreRole` |
| Sponsorship page closed until 25 Sep | ✅ | ❌ endpoints answer |
| Offer/skip a slot → webmaster | ✅ | ❌ route admits finance too |

The three ❌ rows are known and accepted. If any of them ever needs to be true
rather than displayed, the fix is small and local in each case.

## 5. Prod today (1 Sep 2026)

9 admins · 4 fin_admins · the webmaster is the samiti's own account.
`SELECT display_name, is_admin, is_fin_admin FROM person WHERE is_admin OR is_fin_admin;`
