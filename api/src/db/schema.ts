import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// ─────────────────────────────────────────────────────────────────────────────
// Auth (better-auth managed tables)
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
// Membership
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
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true), // false = left the portal
  portfolio: text('portfolio'), // free text, e.g. "Treasurer"
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// ─────────────────────────────────────────────────────────────────────────────
// Task distribution (the Core Members feature)
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
// Events & public content
// Events are first-class: notices, timetable rows and gallery items tag one.
// The samiti year runs Poila Baishakh (April) → Saraswati Pujo (next Jan/Feb);
// seed.sql carries the 2020–2035 calendar.
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
})

export const notice = sqliteTable('notice', {
  id: text('id').primaryKey(),
  eventId: text('event_id').references(() => event.id), // NULL = samiti-wide
  title: text('title').notNull(),
  body: text('body').notNull(), // markdown
  pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false),
  publishedAt: integer('published_at', { mode: 'timestamp' }).notNull(),
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
  sortOrder: integer('sort_order').notNull().default(0),
})

export const galleryItem = sqliteTable('gallery_item', {
  id: text('id').primaryKey(),
  eventId: text('event_id').references(() => event.id),
  kind: text('kind', { enum: ['photo', 'video'] }).notNull(),
  ref: text('ref').notNull(), // Drive file id or YouTube video id
  caption: text('caption'),
  sortOrder: integer('sort_order').notNull().default(0),
})

// ─────────────────────────────────────────────────────────────────────────────
// Event operations
// ─────────────────────────────────────────────────────────────────────────────

export const procurementItem = sqliteTable('procurement_item', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .notNull()
    .references(() => event.id),
  item: text('item').notNull(),
  quantity: text('quantity'),
  status: text('status', { enum: ['needed', 'ordered', 'received'] })
    .notNull()
    .default('needed'),
  assignee: text('assignee'),
  notes: text('notes'),
})

// ─────────────────────────────────────────────────────────────────────────────
// Ledger & sponsorship
// ONE money table (ledger_entry) + two PERPETUAL books. Sponsorship mirrors
// the task catalog (item → item_year → pledge); pledges and reimbursement
// claims move no money until paid/settled — then they link the ledger entry.
// Wallets are emergent: anyone named as wallet_person_id holds samiti money.
// Date columns are IST date strings "YYYY-MM-DD"; report year = substr(1,4).
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
