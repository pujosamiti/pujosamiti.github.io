# Design system

**লাল-পাড় সাদা** — the white sari with the red border. Light mode is a
tant-cotton ground (`#E8E4DD`) with the laal-paar crimson (`#C40039`), cards
a whiter kash lifted off it; dark mode is dhunuchi night. Alpona appears
only as white line-work on the red bands. The palette was re-chosen on
27 Sep 2026 against photographs of the saris themselves (before: jaba
`#D70000` on pure white); `/brandcolours` keeps the workbench that chose it.

The source of truth is **`web/src/index.css`** (the design tokens); this doc
and the live reference page at `/brandcolours` (`web/src/pages/
BrandColours.tsx`) mirror it. If they ever disagree, the CSS wins — update
the mirrors.

## Typography

- Headings: **Noto Serif Bengali**
- Body: **Hind Siliguri**
- Bengali and Devanagari script are first-class throughout — no special
  handling needed anywhere in the stack.

## Mobile-first, always

The portal is used almost entirely from phones (largely inside WhatsApp's
in-app browser). Hard rules:

- Bottom tab navigation
- 44 px minimum touch targets
- **Card lists instead of tables on phones**; any genuinely wide content
  (tables in the book) scrolls horizontally inside its own container — the
  page never scrolls sideways
- Test everything at phone width first; desktop is the adaptation

## Colour palette

Every colour is named for what it is in the pujo world. Light/dark values
live in `web/src/index.css`; roles:

| Token | Meaning | Role |
| --- | --- | --- |
| `tant` (background) | Unbleached sari cotton / dhunuchi night | Page ground (`#E8E4DD` / `#191008`) |
| `kash` (card, popover) | The white of the buti | Cards, sheets, dialogs, lifted off the tant (`#FAF8F4` / `#241811`) |
| `kali` (foreground) | Warm ink | Text (`#2B1A10` / `#F2E6D0`) |
| `jaba` (primary, ring, band) | The laal-paar border red | Buttons, focus ring, header bands, links (`#C40039` / `#F65A81`). White on it 6.2; as text 4.9 on tant. **At night the words on it turn dark** (`primary-foreground` `#1F0509`): no one red carries white text and also reads as text on the night ground |
| `sindoor` | The deeper red | Hover/pressed primary only (`#A3002F` / `#FF7A98`) |
| `rokto` (destructive) | The cloth's fold in shadow | Destructive actions, error text (`#7A0B24` / `#FF8FA3`); dark-mode band `#8C0028` |
| `palash` | Flame of the forest | Live, overdue, owed — attention in small doses; flame orange-red, so it never reads as a second crimson (`#B83716` / `#F2764A`) |
| `genda` (secondary) | Marigold | Accents — **never as text colour** (`#EFA51E` / `#F2B440`) |
| `shiuli` | Night-jasmine stem | Warm accent that is also read as text: Bengali day names, category titles, notes, blockquote rules (`#A34E0E` / `#E88A34`; 4.5 on tant) |
| `matir` | Fired terracotta | Dates, metadata, dividers, list bullets in the book; spending — the "Spent" tile and the `matir` expense badge, text on it `matir-foreground` (`#8A4A30` / `#D59A78`) |
| `sharat` | October sky | Info states, native control accents, the chosen option of a two-way switch (e.g. the Excel/PDF switch beside the download pills) — text on it uses `sharat-foreground` (`#2A6493` / `#7FA8D6`) |
| `aparajita` | Butterfly pea | Selection & membership chips, small doses; the flower's deep blue, kept clear of both sharat and jarul (`#33388F` / `#8FA0EC`) |
| `durba` | Sacred grass, paan-leaf deep | Success: paid, settled, money in (`#17664F` / `#6CC49A`). Teal-leaning on purpose: red-green colour-blind readers can still tell it from the red |
| `accent` / `muted` / `border` / `input` | — | Hover surface `#F0E9DE`, inset `#E3DDD3`, borders `#DCD5CA`; field edges `#998C7A` — 3 : 1 against a card, as WCAG asks of controls; fields themselves are tant wells inside kash cards |
| `golap`, `chandan`, `shankha`, `ganga`, `nilkamal` | Rose, sandalwood, conch cream, river water, blue lotus | **The pastel five** (`#DE7B9C`, `#D9BD98`, `#F2EFDA`, `#8ED1C4`, `#8D96C9`): soft colour for tiles and dashboards only — never text, never buttons. Used through `.tint-tile` in `index.css`: a wash of the tile's pastel (22 %; 12 % on cards that hold tables), a thin strip of it down the left edge, and a `.tint-disc` icon disc. A `.tint-woven` tile sits on shankha cream with all four colours in its edge, like a woven sari border, and a rangoli disc. Members Only tiles, the Wallets figures, wallet holders' initial discs and the spending cards wear them; neighbours never share one. Every text on a wash stays above 5 : 1 |
| `neon` | Panna, emerald | **Off-palette on purpose**, one use only: the উমা refresh button — an emerald neon fill with a dark-green icon (`#2BF5A2` / `#0B3D2C`, 8.5 : 1), a hairline ring and a soft halo (the `neon-glow` utility) so it keeps an edge on the tant. Emerald rather than yellow-green: it sits opposite the crimson, and colour-blind readers do not see it as the genda tab beside it |

Usage notes:

- Red is identity — jaba carries the brand; sindoor is only its hover;
  palash sparingly.
- Money UI: `durba` = money in / settled; `matir` = money out in the
  ordinary way; `rokto` reserved for destructive intent, never for expenses;
  `palash` for owed and overdue only — information stays muted.
- One filled red per view: the page's main action. Repeated actions (the
  download pills) are crimson outlines; a quiet state (a task's To Do) is an
  inset, not a fill.
- `genda` fails contrast as text in light mode — decorative only.
- Both themes are defined and components must work in each, but **dark mode
  is not switched on**: nothing adds the `.dark` class, so every visitor
  sees light. See docs/017 before turning it on.
- Long-form reading (the book) maps the typography plugin's colours to these
  tokens in `index.css`, so prose is warm ink in both themes — no
  `prose-invert`, no stone greys.

## The members area: colour with meaning

Every members-area page wears the pastel five (`web/src/lib/tint.ts`):

- **Its own colour.** `PAGE_TINT` gives each page a pastel — the colour of
  its tile on Members Only — and `PageTitle` underlines the title in it
  (woven pages get all four). One map, so tile and page never drift apart.
- **Edges that say something.** List rows carry a thin left strip and a
  faint wash (`tint(pastel, '6%')`) chosen by meaning: ledger entries by
  kind (money in river water, out sandalwood, moved blue lotus); claims by
  state (waiting rose, settled river water, closed sandalwood); members by
  tier (core rose, member blue lotus, non-member sandalwood); festivals by
  kind on Events; families and the Days of the Pujo card woven.
- **Groups in turn.** Categories and days — the sponsorship board, the
  procurement bands and master list, the bhog occasions and their day cards,
  the nirghanto's days, the planning sub-headings (Murti / Idol, Permissions…)
  with their task cards, the spending cards — take the pastels in turn
  (`pastelAt(i)`), about 10 % for cards that hold lists; section headings get
  a short pastel bar (`.tint-heading`).
- **The paar is special.** `PaarEdge` — the sari's red border, a white line,
  a thin red line — tops only the cards that speak for the samiti: the
  year's nirghanto on Schedule and the members' welcome.
- **Still one filled red per view.** Actions repeated down a list use the
  `soft` button (crimson outline, fills on hover): Pledge on every open slot.
  A chosen core tier is a crimson outline on rose, not a fill on every row.

## Reports

Downloadable reports are built in the browser and loaded on first use. The
ledger's three season lists (core subscriptions, non-core subscriptions,
sponsorships) and the sponsorship board of a pujo year each come as a
spreadsheet or a PDF: a small **Excel | PDF** switch sits before the
download pills, Excel by default. What a report holds, its order and its
totals are defined once in `web/src/lib/ledger-reports.ts`, so the two
formats never disagree.

### Spreadsheets

`web/src/lib/reports-xlsx.ts`, with write-excel-file. One sheet, named for
the report:

- Row 1 the title (with book · season, or the pujo year), bold and jaba (`#C40039`);
  row 2 "Generated <date, time> IST" in grey italics; a blank row; then the
  table, its header in the `wash` fill and frozen with the rows above it.
- The PDF's columns in the PDF's order. The values stay values: dates are
  real dates (`d mmm yyyy`), amounts real numbers shown as `₹1,00,000` —
  the sheet has the `₹` glyph the PDF fonts lack, and its format places
  lakh commas by hand, since spreadsheets have no Indian grouping of their
  own.
- Ledger lists end on a total row: the entry count, and a `SUM` over the
  amounts, so it follows any figure edited later.
- The sponsorship board is laid out landscape, like its PDF. Its English
  and Bengali one-liners get a column each instead of sitting under the
  title — Bengali as plain text, which the spreadsheet shapes itself. An
  open slot reads "open" in grey italics, a slot without a price "at cost".
  It ends on the PDF's summary line (slots, pledged, paid, received) as
  text: the sheet lists prices, and a pledge may differ from its slot's
  price, so no column adds up to the received figure.
- An empty report is a sheet with the PDF's "No …" line in place of the
  table. The file name matches the PDF's, ending `.xlsx`.

### PDF

Built with jsPDF + autotable (`web/src/lib/reports-pdf.ts`). Ledger lists are portrait; the sponsorship board is
landscape, each item carrying its English and Bengali one-liners in small
grey type under the title. **Bengali is drawn by the browser**: the PDF's
built-in fonts have no Bengali and jsPDF cannot shape the script even with a
font embedded, so each বাংলা line is rendered to a canvas in Hind Siliguri
and placed in the cell as a picture.
The page furniture is fixed so every report reads as ours:

- A thin **jaba band** (`#C40039`, 12 mm) across the top of every page, the
  small logo at the left, the report title in white beside it and the book ·
  season as a lighter subline; "Generated <date, time> IST" sits at the
  band's right edge. Nothing else is red.
- A4 portrait, Helvetica, ink-coloured text; the table header in `kali`, the
  total row bold. Rows run in payment order — date, then the time the record
  was made (the ledger stores no payment time of its own); only the date is
  printed. Amounts are right-aligned and written `Rs 10,000` — the
  built-in PDF fonts have no `₹` glyph, and embedding a font for one symbol
  is not worth the weight.
- Footer: "Page n of N", small and grey, bottom right.

## Component idiom

shadcn-style components (copied in, not a dependency) under
`web/src/components/`, styled with Tailwind v4 utilities against the tokens.
Match the existing idiom when adding UI: token colours only (no hex in
components), Bengali-first labels where the samiti speaks Bengali, cards on
phones, and the `/brandcolours` page updated when a token is added.
