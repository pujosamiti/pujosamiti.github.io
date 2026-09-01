import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// ─────────────────────────────────────────────────────────────────────────────
// 1 · Auth (better-auth managed tables)
// Standard better-auth shapes. If a better-auth upgrade changes them, regenerate
// with `npx @better-auth/cli generate` and diff against this file.
// ─────────────────────────────────────────────────────────────────────────────

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
})

// ─────────────────────────────────────────────────────────────────────────────
// 2 · Events & timetable
// Events are first-class: timetable rows, ledger entries and reimbursement
// claims tag one. The samiti year runs Poila Baishakh (April) → Saraswati
// Pujo (next Jan/Feb); seed.sql carries the 2020–2035 calendar.
// ─────────────────────────────────────────────────────────────────────────────

export const event = sqliteTable('event', {
  id: text('id').primaryKey(), // "durga-pujo-2026"
  kind: text('kind').notNull(), // EVENT_KINDS in shared
  year: integer('year').notNull(),
  nameBn: text('name_bn').notNull(),
  nameEn: text('name_en').notNull(),
  startsOn: text('starts_on').notNull(), // ISO date
  endsOn: text('ends_on').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  purohitName: text('purohit_name'), // nirghanto header (durga pujo)
  purohitPhone: text('purohit_phone'),
  /** Free note shown above the nirghanto — e.g. which panjika and place it follows. */
  notes: text('notes'),
  /**
   * Set when an admin declares the nirghanto published & final. Gates the
   * seeding of puja_day (and everything downstream); NULL = draft.
   */
  nirghantoFinalizedOn: text('nirghanto_finalized_on'), // ISO date
})

/**
 * Nirghanto rows (Durga Pujo only — one-day events publish no timetable).
 * Grouped by day (tithi label + date), each row is a bilingual ritual with
 * from/to times and panchang comments — mirroring the samiti's yearly
 * nirghanto document.
 */
export const timetableEntry = sqliteTable('timetable_entry', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .notNull()
    .references(() => event.id),
  dayDate: text('day_date').notNull(), // ISO date
  dayLabelBn: text('day_label_bn').notNull(), // "মহা ষষ্ঠী"
  dayLabelEn: text('day_label_en').notNull(), // "Maha Shashthi"
  titleBn: text('title_bn').notNull(), // "ষষ্ঠী পূজা"
  titleEn: text('title_en').notNull(),
  timeFrom: text('time_from'), // "08:30" (24h); NULL until the purohit confirms
  timeTo: text('time_to'),
  comments: text('comments'), // "Shashthi ends at 10:43 AM"
  /** A second note, shown in red beneath the comment — a departure from the printed nirghanto. */
  alertNote: text('alert_note'),
  sortOrder: integer('sort_order').notNull().default(0),
})

/**
 * THE DAYS OF THE PUJO — the canonical per-year calendar that every day-scoped
 * feature hangs off (procurement deliveries, bhog menu, RSVP, coupons,
 * ritual-volunteer slots). Seeded by an ADMIN from the finalised nirghanto:
 * Panchami → Dashami in tithi order, keeping duplicated tithis as their own
 * days ("Ashtami · Day 2" when the panjika gives Adhik Diba). `source_label`
 * preserves the nirghanto's wording for traceability; labels stay editable
 * because the panjika shifts every year.
 */
export const pujaDay = sqliteTable('puja_day', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .notNull()
    .references(() => event.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // tithi date, ISO
  labelEn: text('label_en').notNull(), // "Panchami", "Ashtami · Day 2"
  labelBn: text('label_bn'), // "মহাষ্টমী"
  sourceLabel: text('source_label'), // "Maha Ashtami (Adhik Diba)"
  sortOrder: integer('sort_order').notNull().default(1000),
  notes: text('notes'),
})

// ─────────────────────────────────────────────────────────────────────────────
// 3 · Membership
// Per person: each individual carries their own tier (promoted by an admin,
// core typically after the Durga Pujo subscription), eligibility and location.
// `family` is a thin optional grouping admins curate — it gates nothing.
// Signing in creates a `user` row; member content is served only when a
// matching (by email) active person with tier != non_member exists. People
// without email are full members on the rolls who simply don't use the site.
// ─────────────────────────────────────────────────────────────────────────────

export const family = sqliteTable('family', {
  id: text('id').primaryKey(),
  name: text('name').notNull(), // "Sudeshna & Mousum" style family name
  notes: text('notes'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const person = sqliteTable('person', {
  id: text('id').primaryKey(),
  familyId: text('family_id').references(() => family.id), // optional grouping
  displayName: text('display_name').notNull(),
  email: text('email').unique(), // login match key; NULL = no-Google member
  /** Second Google account, for people who sign in with either. Matched the same way. */
  altEmail: text('alt_email').unique(),
  society: text('society'), // from shared locations list, or free text
  residenceDetail: text('residence_detail'), // flat no
  workplace: text('workplace'), // tower, for works-in-MGP people
  workplaceDetail: text('workplace_detail'), // company name
  eligibility: text('eligibility', { enum: ['resident', 'works_in_mgp', 'by_invitation'] })
    .notNull()
    .default('resident'),
  tier: text('tier', { enum: ['non_member', 'member', 'core'] })
    .notNull()
    .default('non_member'),
  phone: text('phone'), // labelled WhatsApp number in the UI
  gender: text('gender'), // e.g. mahila-volunteer scheduling
  isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
  /**
   * Finance authority without full admin: the ledger, budgets, sponsorship
   * pricing and claim rejection. A treasurer needs the books, not the
   * membership roll. Admins hold this implicitly.
   */
  isFinAdmin: integer('is_fin_admin', { mode: 'boolean' }).notNull().default(false),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true), // false = left the portal
  portfolio: text('portfolio'), // free text, e.g. "Treasurer"
  /**
   * Seat on the Uma magazine masthead: one 'chief_editor' + up to two
   * 'editor's, core members only, assigned by an admin. Gates the editorial
   * desk; the chief editor additionally publishes Sankhyas.
   */
  umaRole: text('uma_role', { enum: ['chief_editor', 'editor'] }),
  notes: text('notes'),
  /**
   * How this record came to exist: 'roster' = entered from the samiti's own
   * records by an admin (or the historical import); 'self' = someone signed in
   * and registered themselves. It separates people genuinely awaiting
   * activation from the long tail of non-member names on the rolls.
   */
  origin: text('origin', { enum: ['roster', 'self', 'counter'] })
    .notNull()
    .default('roster'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// ─────────────────────────────────────────────────────────────────────────────
// 4 · Task distribution (the Puja Planning feature)
// `durgapuja_task` is the year-independent master catalog (curated over time,
// seeded from the samiti's 2020–2025 archives — see seed-tasks.sql).
// `task_year` carries one row per task per year: phase, the three checkdates
// with progress notes, free-form notes, and the per-year skip (is_active).
// `task_assignment` links people per year as owner (max 5, app-enforced) or
// volunteer. Soft deletes everywhere via is_active.
// ─────────────────────────────────────────────────────────────────────────────

export const durgapujaTask = sqliteTable('durgapuja_task', {
  id: text('id').primaryKey(), // stable slug, e.g. "idol-transport-in"
  category: text('category').notNull(), // e.g. "Murti / Idol", "Permissions"
  title: text('title').notNull(),
  details: text('details'), // scope / subtasks outline
  sortOrder: integer('sort_order').notNull().default(1000), // drives task AND category ordering
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const taskYear = sqliteTable('task_year', {
  id: text('id').primaryKey(),
  taskId: text('task_id')
    .notNull()
    .references(() => durgapujaTask.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(), // e.g. 2026
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true), // false = skipped this year
  phase: text('phase', { enum: ['todo', 'in_progress', 'completed'] })
    .notNull()
    .default('todo'),
  check1Date: text('check1_date'),
  check1Notes: text('check1_notes'),
  check2Date: text('check2_date'),
  check2Notes: text('check2_notes'),
  check3Date: text('check3_date'),
  check3Notes: text('check3_notes'),
  notes: text('notes'), // free-form notes for this year's run of the task
})

export const taskAssignment = sqliteTable('task_assignment', {
  id: text('id').primaryKey(),
  taskId: text('task_id')
    .notNull()
    .references(() => durgapujaTask.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  personId: text('person_id')
    .notNull()
    .references(() => person.id),
  role: text('role', { enum: ['owner', 'volunteer'] }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
})

// ─────────────────────────────────────────────────────────────────────────────
// 5 · Money: ledger, sponsorship, reimbursements, budget
// ONE money table (ledger_entry) + two PERPETUAL books. Sponsorship mirrors
// the task catalog (item → item_year → pledge); pledges and reimbursement
// claims move no money until paid/settled — then they link the ledger entry.
// Wallets are emergent: anyone named as wallet_person_id holds samiti money.
// Date columns are IST date strings "YYYY-MM-DD"; the reporting season runs
// 1 July → 30 June. Entries harden 48 h after creation (no edit/void).
// ─────────────────────────────────────────────────────────────────────────────

export const book = sqliteTable('book', {
  id: text('id').primaryKey(), // 'pujo-ledger' | 'poila-baishakh-ledger'
  name: text('name').notNull(),
  notes: text('notes'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const ledgerEntry = sqliteTable('ledger_entry', {
  id: text('id').primaryKey(),
  bookId: text('book_id')
    .notNull()
    .references(() => book.id),
  eventId: text('event_id').references(() => event.id), // optional tag
  entryDate: text('entry_date').notNull(), // "YYYY-MM-DD" IST
  kind: text('kind', { enum: ['contribution', 'expense', 'transfer'] }).notNull(),
  category: text('category'), // contribution: subscription|sponsorship|donation|misc_income; expense: taxonomy; transfer: NULL
  subCategory: text('sub_category'),
  amount: integer('amount').notNull(), // whole rupees, always > 0
  personId: text('person_id').references(() => person.id), // contributor
  counterparty: text('counterparty'), // vendor / "Hundi" when no person
  walletPersonId: text('wallet_person_id')
    .notNull()
    .references(() => person.id), // received (contribution) / paid (expense) / source (transfer)
  toWalletPersonId: text('to_wallet_person_id').references(() => person.id), // transfer target
  notes: text('notes'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true), // false = voided
  createdBy: text('created_by')
    .notNull()
    .references(() => person.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const sponsorshipItem = sqliteTable('sponsorship_item', {
  id: text('id').primaryKey(), // unique slug: 'sandhi-puja-3', 'durga-idol'
  category: text('category').notNull(), // Murti, Stage, Bhog, Puja, Dhak, Dakshina, Samagri…
  title: text('title').notNull(),
  /** One-line appeal shown under the title on the board — "Sponsor the smile on Ma's face." */
  tagline: text('tagline'),
  taglineBn: text('tagline_bn'), // "মায়ের মুখের হাসিটুকু হোক আপনার দান।"
  defaultAmount: integer('default_amount'), // NULL = priced fresh each year
  sortOrder: integer('sort_order').notNull().default(1000),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const sponsorshipItemYear = sqliteTable('sponsorship_item_year', {
  id: text('id').primaryKey(), // 'siy-<item>-<year>'
  itemId: text('item_id')
    .notNull()
    .references(() => sponsorshipItem.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  amount: integer('amount'), // NULL = master defaultAmount
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true), // false = not offered this year
  notes: text('notes'),
})

export const sponsorshipPledge = sqliteTable('sponsorship_pledge', {
  id: text('id').primaryKey(),
  itemId: text('item_id')
    .notNull()
    .references(() => sponsorshipItem.id),
  year: integer('year').notNull(),
  personId: text('person_id')
    .notNull()
    .references(() => person.id),
  amount: integer('amount').notNull(),
  status: text('status', { enum: ['pledged', 'paid', 'cancelled'] })
    .notNull()
    .default('pledged'),
  ledgerEntryId: text('ledger_entry_id').references(() => ledgerEntry.id), // set when paid
  pledgedOn: text('pledged_on').notNull(), // "YYYY-MM-DD" IST
  notes: text('notes'),
})

/**
 * Money a core member spent from their own pocket, awaiting reimbursement by
 * a wallet holder. Settlement writes the underlying VENDOR expense to the
 * ledger (the claimant is a pass-through) and links it here. Self-claim
 * assignment ("I'll pay this one") prevents two holders paying the same claim.
 */
export const expenseReimbursement = sqliteTable('expense_reimbursement', {
  id: text('id').primaryKey(),
  bookId: text('book_id')
    .notNull()
    .references(() => book.id),
  eventId: text('event_id').references(() => event.id),
  personId: text('person_id')
    .notNull()
    .references(() => person.id), // claimant
  expenseDate: text('expense_date').notNull(), // when they paid the vendor
  amount: integer('amount').notNull(),
  category: text('category').notNull(),
  subCategory: text('sub_category'),
  counterparty: text('counterparty').notNull(), // the vendor they paid
  details: text('details'),
  status: text('status', { enum: ['requested', 'settled', 'rejected', 'cancelled'] })
    .notNull()
    .default('requested'),
  assignedTo: text('assigned_to').references(() => person.id), // wallet holder who took it
  assignedOn: text('assigned_on'),
  ledgerEntryId: text('ledger_entry_id').references(() => ledgerEntry.id), // set on settlement
  settledBy: text('settled_by').references(() => person.id),
  settledOn: text('settled_on'),
  notes: text('notes'), // reviewer remarks (esp. on reject)
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

/**
 * Season expense budget, one line per (year, category, sub_category).
 * A NULL sub_category is a whole-category "General" line (e.g. Saraswati Pujo
 * budgeted as one figure); a category's budget is the sum of its lines.
 * Budgets exist from season 2026 onward — no historical budgets.
 */
export const budgetLine = sqliteTable('budget_line', {
  id: text('id').primaryKey(), // "bl-2026-food-bhog"
  year: integer('year').notNull(), // season-start year (1 July boundary)
  category: text('category').notNull(),
  subCategory: text('sub_category'),
  amount: integer('amount').notNull(),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// ─────────────────────────────────────────────────────────────────────────────
// 6 · Procurement (Durga Pujo shopping lists)
// Modelled on the samiti's 2024/2025 procurement sheets: a MATRIX of items
// (grouped in category sections) × per-year day columns, each day split
// Morning/Evening. `procurement_item` is the year-independent master catalog;
// `procurement_day` is the year's ordered column list — first-class because
// a tithi can span two calendar days ("Saptami · Day 2") and Sandhi Puja gets
// its own column when needed; `procurement_need` is one CELL (item × day ×
// slot); `procurement_item_year` carries the sheet's per-item Total Quantity,
// procurement status and remarks. Quantities are free text ("250/500 gm",
// "1 + 7", "as many as possible") because units never standardise. Core
// members curate; only the active pujo year is writable — past lists stay as
// the record of what was actually ordered.
// ─────────────────────────────────────────────────────────────────────────────

export const procurementItem = sqliteTable('procurement_item', {
  id: text('id').primaryKey(),
  category: text('category').notNull(), // "Pottery", "Grocery", "Flowers / Garlands"…
  title: text('title').notNull(), // "Jaba Phool (Red Hibiscus)"
  /**
   * Vendor-facing names, used by the printable order (the yearly flowers doc
   * is handed to a Pune phoolwala in Hindi, with Bengali for the committee).
   */
  nameHi: text('name_hi'), // "लाल जास्वंद गुड़हल फूल"
  nameBn: text('name_bn'), // "লাল জবা ফুল"
  details: text('details'), // the sheet's NOTE lines: spec, packaging, warnings
  /** Year-independent suggested total ("10 kg") — the samiti buys much the same every year. */
  suggestedTotal: text('suggested_total'),
  sortOrder: integer('sort_order').notNull().default(1000), // drives item AND category ordering
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

/**
 * Year-independent suggested quantity for one tithi × slot ("Shashthi morning:
 * 250 gm") — the master list's memory of what the samiti usually orders.
 * Tithi-relative (not day-id-relative) so it maps onto whichever actual days
 * a year has; prefill applies it to every matching day (both Ashtamis in an
 * Adhik Diba year), and the committee trims.
 */
export const procurementSuggestion = sqliteTable('procurement_suggestion', {
  id: text('id').primaryKey(),
  itemId: text('item_id')
    .notNull()
    .references(() => procurementItem.id, { onDelete: 'cascade' }),
  tithi: text('tithi').notNull(), // PUJA_TITHIS in shared: Panchami … Dashami, Sandhi Puja
  slot: text('slot', { enum: ['morning', 'evening'] })
    .notNull()
    .default('morning'),
  quantity: text('quantity').notNull(),
})

/** The sheet's Total Quantity / Procurement Status / remarks columns, per year. */
export const procurementItemYear = sqliteTable('procurement_item_year', {
  id: text('id').primaryKey(),
  itemId: text('item_id')
    .notNull()
    .references(() => procurementItem.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  totalQuantity: text('total_quantity'), // free text; buy-once items have only this
  status: text('status', { enum: ['pending', 'partial', 'done'] })
    .notNull()
    .default('pending'),
  /** Order-by deadline for advance purchases (murti garlands, pottery). */
  dueDate: text('due_date'), // ISO "YYYY-MM-DD", optional
  dueTime: text('due_time'), // "HH:MM" 24h, optional
  notes: text('notes'), // "7 mid size pradip not found in the carton", "Purohit will bring"
})

/**
 * One day column of a year's sheet, in nirghanto order. Label is free text so
 * a two-day tithi ("Saptami · Day 2") or Sandhi Puja fit; `date` optional.
 */
export const procurementDay = sqliteTable('procurement_day', {
  id: text('id').primaryKey(),
  year: integer('year').notNull(),
  /** The puja day this delivery serves; NULL for free-form columns. */
  pujaDayId: text('puja_day_id').references(() => pujaDay.id, { onDelete: 'set null' }),
  label: text('label').notNull(), // "Shashthi", "Saptami · Day 2", "Sandhi Puja"
  /**
   * Delivery moment for the vendor order. By the samiti's convention most
   * flowers arrive the EVENING BEFORE the puja day ("27th, 7 pm" for
   * Shashthi), so date/time describe the delivery, not the tithi.
   */
  date: text('date'), // ISO "YYYY-MM-DD", optional
  time: text('time'), // "HH:MM" 24h, optional ("19:00", "10:00")
  sortOrder: integer('sort_order').notNull().default(1000),
  notes: text('notes'), // e.g. "সন্ধি পুজো + নবমী combined delivery"
})

/** One cell: what to buy for one item, one day, one slot. */
export const procurementNeed = sqliteTable('procurement_need', {
  id: text('id').primaryKey(),
  itemId: text('item_id')
    .notNull()
    .references(() => procurementItem.id, { onDelete: 'cascade' }),
  dayId: text('day_id')
    .notNull()
    .references(() => procurementDay.id, { onDelete: 'cascade' }),
  slot: text('slot', { enum: ['morning', 'evening'] })
    .notNull()
    .default('morning'),
  quantity: text('quantity').notNull(), // free text, units included
  notes: text('notes'),
  /** Ticked off while shopping — the day view doubles as the market checklist. */
  purchased: integer('purchased', { mode: 'boolean' }).notNull().default(false),
})

// ─────────────────────────────────────────────────────────────────────────────
// 10 · Bhog & food menu
// One menu per calendar DATE per EVENT. Five occasions carry one each season
// (1 Jul → 30 Jun): Durga Pujo is multi-day (admin-seeded from the finalised
// Puja Days, Saptami → Dashami; a crunched year serves one lunch for two
// tithis — 2024's "Saptami/Ashtami"); Kojagari, Bijoya Sammelani, Saraswati
// and Poila Baishakh are single meals. Kojagari/Saraswati serve "Bhog",
// Bijoya Sammelani/Poila Baishakh a "Food Menu" — a naming difference the UI
// carries, not the schema. Core members compose dishes and the per-plate
// cost; publishing makes the day visible to every member. RSVP headcounts
// and bhog coupons will hang off this row.
// ─────────────────────────────────────────────────────────────────────────────

export const bhogMenu = sqliteTable('bhog_menu', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .notNull()
    .references(() => event.id, { onDelete: 'cascade' }),
  /** The (host) puja day this bhog belongs to; NULL for single-meal events and free-form days. */
  pujaDayId: text('puja_day_id').references(() => pujaDay.id, { onDelete: 'set null' }),
  date: text('date').notNull(), // ISO — the meal happens on a date
  label: text('label').notNull(), // "Saptami Bhog", "Bhog", "Food Menu"
  labelBn: text('label_bn'), // "সপ্তমীর ভোগ"
  perPlateCost: integer('per_plate_cost'), // whole ₹ (160/180/190 in 2024-25), NULL until priced
  notes: text('notes'), // "Mishti Doi +₹20", caterer notes
  /** Draft until published; members see only published days. */
  isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(1000),
})

/** One dish on a day's menu, in serving order. */
export const bhogMenuItem = sqliteTable('bhog_menu_item', {
  id: text('id').primaryKey(),
  menuId: text('menu_id')
    .notNull()
    .references(() => bhogMenu.id, { onDelete: 'cascade' }),
  title: text('title').notNull(), // "Khichuri"
  titleBn: text('title_bn'), // "খিচুড়ি"
  sortOrder: integer('sort_order').notNull().default(1000),
})

/**
 * Food count: one household's headcount for one menu day, keyed by the
 * signed-in member's person row (the digital food-coupon-details sheet —
 * one row per family per day, "Bhog Count (5+ yrs)"). Any active member
 * responds for their household; 0 is a valid answer ("not coming").
 */
export const bhogRsvp = sqliteTable('bhog_rsvp', {
  id: text('id').primaryKey(),
  menuId: text('menu_id')
    .notNull()
    .references(() => bhogMenu.id, { onDelete: 'cascade' }),
  personId: text('person_id')
    .notNull()
    .references(() => person.id, { onDelete: 'cascade' }),
  count: integer('count').notNull(),
  /** The sheet's remark column: "already paid for 10 Ashtami guests". */
  notes: text('notes'),
  updatedAt: text('updated_at').notNull(), // ISO date-time of the last change
})

// ─────────────────────────────────────────────────────────────────────────────
// 11 · Uma (উমা) — the samiti's magazine
// A Sankhya (uma_issue) is one edition — no fixed cadence, the chief editor
// opens one when enough accepted material exists. Articles arrive out of band
// (WhatsApp/email → a dev converts to markdown) and move draft → in_review →
// accepted/held/rejected; publishing a Sankhya flips its accepted articles to
// published. The magazine is fully PUBLIC; hearts/claps are anonymous
// aggregate counters bumped by a clamped public endpoint.
// ─────────────────────────────────────────────────────────────────────────────

export const umaIssue = sqliteTable('uma_issue', {
  id: text('id').primaryKey(), // 'sankhya-1'
  number: integer('number').notNull().unique(),
  title: text('title'), // optional theme name — "শারদীয়া সংখ্যা"
  coverImage: text('cover_image'), // API media path
  editorialNote: text('editorial_note'), // markdown — সম্পাদকীয়
  status: text('status', { enum: ['draft', 'published'] })
    .notNull()
    .default('draft'),
  publishedOn: text('published_on'), // ISO date
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const umaArticle = sqliteTable('uma_article', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(), // public URL identity; immutable once published
  section: text('section').notNull(), // UMA_SECTIONS in shared
  title: text('title').notNull(),
  titleBn: text('title_bn'),
  /** Byline as printed — guests are not users, so this is free text. */
  authorName: text('author_name').notNull(),
  /** The byline in Bengali script, shown when the reader is on the বাংলা pill. */
  authorNameBn: text('author_name_bn'),
  authorBio: text('author_bio'), // one-liner under the byline
  authorBioBn: text('author_bio_bn'), // the same line in Bengali
  authorPersonId: text('author_person_id').references(() => person.id), // when the writer is on the rolls
  isGuest: integer('is_guest', { mode: 'boolean' }).notNull().default(false),
  excerpt: text('excerpt'), // card teaser + SEO/OG description
  heroImage: text('hero_image'), // API media path; also the share image
  bodyMd: text('body_md').notNull(),
  /** The same piece in the other language — the article page offers বাংলা/English pills when set. */
  bodyMdAlt: text('body_md_alt'),
  lang: text('lang', { enum: ['bn', 'en'] })
    .notNull()
    .default('bn'), // primary language, for <html lang> and JSON-LD
  status: text('status', {
    enum: ['draft', 'in_review', 'accepted', 'held', 'rejected', 'published'],
  })
    .notNull()
    .default('draft'),
  issueId: text('issue_id').references(() => umaIssue.id, { onDelete: 'set null' }),
  sortOrder: integer('sort_order').notNull().default(1000), // order within the Sankhya
  submittedVia: text('submitted_via', { enum: ['whatsapp', 'email'] }),
  submittedOn: text('submitted_on'), // ISO date the entry reached the editors
  editorNote: text('editor_note'), // internal: hold/reject reason, copy-edit notes
  hearts: integer('hearts').notNull().default(0),
  claps: integer('claps').notNull().default(0),
  publishedAt: text('published_at'), // ISO datetime
  createdBy: text('created_by').references(() => person.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})
