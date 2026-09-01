# Roles & access

Who can see what, and who can change it — surface by surface. [009](009-auth-and-membership.md)
explains how a person becomes a role; this document says what each role may then
do. Verified against the code on **1 Sep 2026**.

## 1. The three axes

Access is not one ladder. Three independent things decide what somebody sees:

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

**The Uma seat** — `person.uma_role` (`chief_editor`) and rows in
`uma_section_editor`, orthogonal to tier. A plain `member` holding a section
runs that section's queue while still being locked out of the ledger. See
[015](015-uma-magazine.md).

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
| Uma · Editorial Desk | seat-gated ² | seat-gated ² | seat-gated ² | seat-gated ² | **W** |
| Membership | — | — | R | R | **W** |
| Nirghanto | — | — | R | R | **W** |
| Events | — | — | R | R | **W** |
| Brand Colours | — ³ | R | R | R | R |

¹ Admin-only until **25 Sep 2026 IST** (`SPONSORSHIP_OPENS_ON`). From that
morning every member and new sign-in reads the board and pledges for
themselves; fin_admin and admin pledge for another household, record payment
and release a pledge; the **webmaster** alone offers or skips a slot.

² Shown to anyone holding a Uma seat, whatever their tier, plus admins.

³ Reachable by URL; simply not carded for new sign-ins.

## 3. The lines that matter

**Money is written by two roles.** Core members read the ledger and do the
day-to-day — raising a claim, taking one on — but every entry, budget line,
sponsorship price and payment is `fin_admin` or `admin` (`canFinance`).
A ledger entry hardens 48 hours after creation: after that nobody edits or
voids it, admins included, and a correction needs a direct database write.

**A new sign-in has exactly two writes**, enforced centrally in the members
middleware rather than route by route: their household's headcount, and their
own sponsorship pledge. Every other non-GET returns 403.

**Pledging is self-service; releasing is not.** Anyone may pledge for
themselves, once. Only `isProxyRole` may pledge for another household, record
a payment, or release a pledge — a slot someone has claimed goes back on the
board only when an admin decides the money is not coming.

**Bhog splits three ways.** Everyone reads the menu and gives their own
headcount. Core members also see the responses table (plate counts). fin_admin
and admin additionally see the per-plate cost — on the cards, in the `Total ₹`
row, and in the CSV and printed sheet — and may record a headcount for another
household, which runs the participation rule and can promote a non-member.
Only `admin` adds, edits, publishes, unpublishes or deletes a menu day.

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
| Uma section scope | ✅ | ✅ |
| Bhog day add/edit/publish/delete → admin | ✅ | ❌ still `isCoreRole` |
| Sponsorship page closed until 25 Sep | ✅ | ❌ endpoints answer |
| Offer/skip a slot → webmaster | ✅ | ❌ route admits finance too |

The three ❌ rows are known and accepted. If any of them ever needs to be true
rather than displayed, the fix is small and local in each case.

## 5. Prod today (1 Sep 2026)

9 admins · 4 fin_admins · the webmaster is the samiti's own account.
`SELECT display_name, is_admin, is_fin_admin FROM person WHERE is_admin OR is_fin_admin;`
