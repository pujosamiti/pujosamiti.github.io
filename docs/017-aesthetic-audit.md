# Aesthetic audit and plan — the laal-paar palette (27 Sep 2026)

The palette was re-chosen on 27 Sep 2026 against photographs of laal-paar
sarees and applied site-wide the same day. This doc records what changed,
what the audit that came with it found, and a proposed order for the rest.
The tokens themselves live in `web/src/index.css`; their roles are in
[012](012-design-system.md); `/brandcolours` shows them and keeps the
workbench they were chosen on.

## 1. What changed (done)

### Tokens, light mode

| Token | Before | After | Why |
| --- | --- | --- | --- |
| background (tant) | `#FFFFFF` | `#E8E4DD` | The unbleached cotton of the sari's body |
| card, popover (kash) | `#FFFFFF` | `#FAF8F4` | White cards look pasted on tant; a warm white lifts them like buti off the weave |
| primary, jaba, band, ring | `#D70000` | `#C40039` | Closest of the candidates to the woven cloth (hue 343°); white on it 6.2, as text on tant 4.9 |
| sindoor (hover) | `#E10D11` | `#A3002F` | The old hover jumped to an orange-red; now the same hue, one step down |
| destructive (rokto) | `#99090C` | `#7A0B24` | The cloth's fold in shadow — same family as the primary |
| palash | `#EB0000` | `#B83716` | Pure scarlet fought the crimson; now the real flame-of-the-forest orange-red |
| shiuli | `#D96410` | `#A34E0E` | Used as text in 7 places but read at 3.4 : 1 on white and 2.9 on tant; now 4.5 |
| matir | `#9A5732` | `#8A4A30` | 4.4 → 5.3 on tant; a touch rosier, to sit with the crimson |
| sharat | `#007CBE` | `#2A6493` | 3.6 → 5.0 on tant; an October sky, softer on the warm ground |
| aparajita | `#3D5A9E` | `#33388F` | Was nearly the new sharat; now the flower's deep blue, clear of sharat and jarul |
| durba | `#3A7D44` | `#17664F` | 4.0 → 5.4 on tant, and for red-green colour-blind eyes three times further from the red |
| muted, accent, border, input | cream set | `#E3DDD3`, `#F0E9DE`, `#DCD5CA`, `#998C7A` | Re-based on tant; field edges firmed to 3 : 1 (see section 2) |
| neon | `#39FF14` | `#2BF5A2` panna, icon `#0B3D2C` | The old green turns genda-yellow for colour-blind eyes, beside the genda Quiz tab; emerald sits opposite the crimson |

Dark mode got matching values (see 012). Its one structural change: at
night the primary lightens to `#F65A81` and the words on it turn dark
(`#1F0509`), because no single red can carry white text and also read as
text on the night ground.

### Code

- **Neon**: kept its own token (`--neon`), new values, plus a `neon-glow`
  utility — a hairline ring in its own dark green and a soft halo, so a
  neon that is nearly as light as the tant still has an edge.
- **Procurement**: three check boxes put `text-white` on durba — fine in
  light, unreadable in dark (durba turns light green). Now
  `text-durba-foreground`.
- **Book / markdown**: `prose-stone` + `prose-invert` replaced by the
  typography plugin's variables mapped to tokens in `index.css` — warm ink,
  matir bullets, a shiuli quote rule, in both themes.
- **Hard-coded colours**: confetti, the PDF band and spreadsheet title
  (`reports-pdf.ts`, `reports-xlsx.ts`), the Bhog print sheet's ink and
  rules.
- **Browser chrome**: `theme-color` in `index.html` and `404.html`, and the
  web manifest's theme and splash background.
- **Brand page** (`public/brand-identity.html`): palette, token table, rules
  and phone mock now show the new palette; the choosing workbench moved to
  the end as "How the red and the white were chosen".
- **Docs**: 012 rewritten for the new palette.

Verified: typecheck and build pass; every page checked in Chrome at desktop
width (home, schedule, উমা, the book, members area, ledger, wallets,
sponsorship, membership, procurement, tasks).

## 2. Audit findings, acted on the same day

| # | Finding | What was done |
| - | --- | --- |
| 2 | The public schedule showed the nirghanto's working notes ("Per purohit v3: …", "Derived.", the panjika reasoning) under every timing — 39 of 41 rows in 2026. | The public page shows the timing and the red public note only; working notes stay in the nirghanto workspace, whose two fields are now labelled "Working note — seen only here" and "Public note, in red". The public API still returns the comments (nothing in them is private). The year's long intro keeps its first paragraph in view and folds the rest under "How these timings were worked out", so on a phone the first timing is on screen. |
| 3 | "Spent this season" was washed in rokto, the destructive red. | Matir. Expense badges in ledger rows likewise moved from crimson to a new `matir` badge (with a `matir-foreground` token) — spending is ordinary, not an alarm. |
| 4 | Carry-forward notes (Wallets tile and wallets table) were in the warning colour. | Muted text; palash is kept for owed and overdue. |
| 5 | Tasks: a chosen "To Do" was filled crimson. | A quiet inset (outlined, muted fill); In progress genda, Completed durba. `aria-pressed` added. |
| 6 | Solid crimson download pills competed with the page's main action. | Crimson outline pills that fill on hover; the Excel/PDF switch stays sky. |
| 7 | Ledger rows showed ISO dates. | "26 Sept", with the year only when it is not this one — also in the void/edit dialogs and the edit form's title. |
| 8 | Schedule intro: paragraphs of white on the crimson band. | A kash card edged like the sari — a red paar, a white line, a thin red line — with a crimson serif title and ink text. |
| 9 | Field edges measured 1.4 : 1. | `--input` `#998C7A` (3.1 : 1 on a card, as WCAG asks of controls); fields read as tant wells in kash cards. Dark `#7A6551`. |
| 10 | Members Only tiles washed 9 tones — a rainbow grid. | Kash tiles; each section's colour lives in a round icon wash, the icon deepened a little so pale genda still holds; the tone tints the border on hover. |
| 11 | Three bare native selects on the Ledger. | The app's own select (`SearchSelect`), as on Wallets and Schedule. |
| 12 | Phone width unchecked. | Checked at 390 px (framed in the tab): home, উমা, schedule, members, ledger, tasks. It found one more: ledger rows squeezed the description into a narrow column on phones — now date, kind, amount and actions share the first line and the description runs full width beneath. |

### Afterwards: life for the dashboards

The calm kash tiles (item 10) read as too plain. The pastel five were added
as tokens (golap, chandan, shankha, ganga, nilkamal) with a `.tint-tile`
treatment — a wash, a thin left strip and an icon disc — on the Members Only
tiles and the Wallets page: its six figures (each with an icon), initial
discs for wallet holders, and the spending cards in turn. See 012.

Then the whole members area: every page got its own colour (title
underline matching its tile), meaningful row edges, groups in turn, and the
`soft` button for repeated actions — see 012, "The members area".

And alpona on the public pages: a lata footer on every page, the year's
festivals on Home, a motif for each pujo day on the Schedule and উমা,
chapter dividers in the book, a lotus on sign-in, and a kuri mala header
on the pujo days — see 012, "Alpona on the public pages".

## 3. Still open

| # | Finding | Proposal | Needs |
| - | --- | --- | --- |
| 1 | **Dark mode is never switched on.** Everything is defined for it, but no code adds the `.dark` class, so every visitor sees light. | A few lines in `index.html` that set `.dark` from `prefers-color-scheme` before first paint and follow changes; a dark `theme-color` meta; then a page-by-page pass in dark. | Your call — it changes the site for every phone set to dark |

Noted and left alone: the logo, the share images and the উমা photos carry
their own colours and sit well on tant; the Google sign-in button keeps
Google's colours, as it must.
