import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// ── better-auth tables ──────────────────────────────────────────────────────
// Standard better-auth shapes. If a better-auth upgrade changes them, regenerate
// with `npx @better-auth/cli generate` and diff against this file.

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

// ── App tables ──────────────────────────────────────────────────────────────

/**
 * Membership is per person: each individual carries their own tier (promoted
 * by an admin, core typically after the Durga Pujo subscription), eligibility
 * and location. `family` is only a thin manual grouping admins curate — it
 * gates nothing. Signing in creates a `user` row; member content is served
 * only when a matching (by email) active person with tier != non_member
 * exists. People without email are full members on the rolls who simply
 * don't use the site.
 */
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
  phone: text('phone'),
  gender: text('gender'), // e.g. mahila-volunteer scheduling
  isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  portfolio: text('portfolio'), // free text, e.g. "Treasurer"
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const event = sqliteTable('event', {
  id: text('id').primaryKey(), // "durga-pujo-2026"
  kind: text('kind').notNull(),
  year: integer('year').notNull(),
  nameBn: text('name_bn').notNull(),
  nameEn: text('name_en').notNull(),
  startsOn: text('starts_on').notNull(),
  endsOn: text('ends_on').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
})

export const notice = sqliteTable('notice', {
  id: text('id').primaryKey(),
  eventId: text('event_id').references(() => event.id),
  title: text('title').notNull(),
  body: text('body').notNull(), // markdown
  pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false),
  publishedAt: integer('published_at', { mode: 'timestamp' }).notNull(),
})

export const timetableEntry = sqliteTable('timetable_entry', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .notNull()
    .references(() => event.id),
  title: text('title').notNull(),
  detail: text('detail'),
  startsAt: text('starts_at').notNull(), // ISO datetime
  endsAt: text('ends_at'),
  venue: text('venue'),
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

export const budgetLine = sqliteTable('budget_line', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .notNull()
    .references(() => event.id),
  category: text('category').notNull(), // "Pandal", "Protima", "Bhog", "Music"...
  item: text('item').notNull(),
  budgeted: integer('budgeted').notNull(), // paise-free: whole rupees
  actual: integer('actual'),
  notes: text('notes'),
})

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
