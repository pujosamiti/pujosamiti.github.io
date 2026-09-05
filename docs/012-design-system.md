# Design system

**লাল-পাড় সাদা** — the white sari with the red border. Light mode is a
pure-white ground with sindoor red; dark mode is dhunuchi night. Alpona
appears only as white line-work on sindoor bands.

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
| `shada` (background) | White / dhunuchi night | Page ground (`#FFFFFF` / `#191008`) |
| `kali` (foreground) | Warm ink | Text (`#2B1A10` / `#F2E6D0`) |
| `jaba` (primary) | Hibiscus | Buttons, focus ring, header bands (`#D70000` / `#E5322C`) |
| `sindoor` | Vermillion | Hover/pressed primary, ritual red (`#E10D11` / `#FF5A52`) |
| `palash` | Flame of the forest | Vivid highlight, small doses (`#EB0000` / `#FF4C42`) |
| `rokto` (destructive) | Blood red | Destructive actions (`#99090C` / `#FF928C`; dark-mode bands still `#99090C`) |
| `genda` (secondary) | Marigold | Accents — **never as text colour** (`#EFA51E` / `#F2B440`) |
| `shiuli` | Night-jasmine stem | Orange accent; blockquote borders in the book (`#D96410` / `#E88A34`) |
| `matir` | Terracotta | Earth accent (`#9A5732` / `#B97A4C`) |
| `sharat` | Autumn sky | Info states, native control accents (`#007CBE` / `#4FA8D8`) |
| `aparajita` | Butterfly pea | Selection & info chips, small doses (`#3D5A9E` / `#8CA5E6`) |
| `durba` | Sacred grass | Success: paid, settled, money in (`#3A7D44` / `#7FC08A`) |

Usage notes:

- Red is identity — jaba/sindoor carry the brand; palash sparingly.
- Money UI: `durba` = money in / settled; `rokto` reserved for destructive
  intent, not ordinary expenses.
- `genda` fails contrast as text in light mode — decorative only.
- Both themes are complete; components must work in each (the site follows
  the visitor's scheme).

## PDF reports

Downloadable reports (the ledger's season lists) are built in the browser
with jsPDF + autotable (`web/src/lib/ledger-pdf.ts`), loaded on first use.
The page furniture is fixed so every report reads as ours:

- A thin **jaba band** (`#D70000`, 12 mm) across the top of every page, the
  small logo at the left, the report title in white beside it and the book ·
  season as a lighter subline. Nothing else is red.
- A4 portrait, Helvetica, ink-coloured text; the table header in `kali`, the
  total row bold. Amounts are right-aligned and written `Rs 10,000` — the
  built-in PDF fonts have no `₹` glyph, and embedding a font for one symbol
  is not worth the weight.
- Footer: "Generated <date> · Page n of N", small and grey.

## Component idiom

shadcn-style components (copied in, not a dependency) under
`web/src/components/`, styled with Tailwind v4 utilities against the tokens.
Match the existing idiom when adding UI: token colours only (no hex in
components), Bengali-first labels where the samiti speaks Bengali, cards on
phones, and the `/brandcolours` page updated when a token is added.
