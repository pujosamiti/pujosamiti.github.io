// API contract types shared between web (GitHub Pages) and api (Cloudflare Worker).
// Change a response shape here and both sides get compile errors instead of runtime surprises.

// ── Events ──────────────────────────────────────────────────────────────────
// Events are first-class: every notice, timetable row and gallery item is tagged
// with an event id like "durga-pujo-2026". Adding Poila Baishakh next year is a
// data change, not a code change.

export const EVENT_KINDS = [
  'durga-pujo',
  'kojagari-lakshmi-pujo',
  'bijoya-sammelani',
  'saraswati-pujo',
  'poila-baishakh',
] as const;

export type EventKind = (typeof EVENT_KINDS)[number];

/** e.g. "durga-pujo-2026" */
export type EventId = `${EventKind}-${number}`;

export interface PujoEvent {
  id: EventId;
  kind: EventKind;
  year: number;
  /** Bengali display name, e.g. "দুর্গাপূজা" */
  nameBn: string;
  nameEn: string;
  startsOn: string; // ISO date
  endsOn: string; // ISO date
  isActive: boolean;
}

// ── Public content ──────────────────────────────────────────────────────────

export interface Notice {
  id: string;
  eventId: EventId | null; // null = samiti-wide notice
  title: string;
  /** Markdown body (sourced from a Drive .md file or D1) */
  body: string;
  pinned: boolean;
  publishedAt: string; // ISO datetime
}

export interface TimeTableEntry {
  id: string;
  eventId: EventId;
  /** e.g. "Maha Sasthi", "Sandhi Pujo" */
  title: string;
  detail: string | null;
  startsAt: string; // ISO datetime
  endsAt: string | null;
  venue: string | null;
}

export type GalleryKind = 'photo' | 'video';

export interface GalleryItem {
  id: string;
  eventId: EventId | null;
  kind: GalleryKind;
  /** photo: Drive file id · video: YouTube video id (unlisted) */
  ref: string;
  caption: string | null;
  sortOrder: number;
}

/** Public gallery is capped at 24 items; the API enforces it. */
export const GALLERY_MAX_ITEMS = 24;

export type PostType = 'blog' | 'magazine';

export interface PostSummary {
  slug: string;
  type: PostType;
  title: string;
  author: string | null;
  eventId: EventId | null;
  publishedAt: string;
  excerpt: string | null;
}

export interface Post extends PostSummary {
  /** Markdown, rendered client-side with react-markdown */
  body: string;
}

// ── Members & auth ──────────────────────────────────────────────────────────

export type MemberRole = 'member' | 'committee' | 'admin';

export interface Me {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: MemberRole;
  /** Portfolio, if part of the committee — e.g. "Treasurer", "Cultural Secretary" */
  portfolio: string | null;
}

// ── Onboarding & membership admin ───────────────────────────────────────────

export type FamilyTier = 'non_member' | 'member' | 'core';
export type FamilyEligibility = 'resident' | 'works_in_mgp';

/** Where a signed-in (but not-yet-member) user stands in the funnel. */
export type OnboardingState =
  | { state: 'member' }
  | { state: 'awaiting_activation'; familyName: string }
  | { state: 'request_pending'; familyName: string }
  | { state: 'no_person' };

export interface FamilySearchResult {
  id: string;
  name: string;
  society: string | null;
}

export interface CreateFamilyInput {
  familyName: string;
  eligibility: FamilyEligibility;
  society: string | null;
  residenceDetail: string | null;
  workplace: string | null;
  workplaceDetail: string | null;
  familyPhone: string | null;
  displayName: string;
  phone: string | null;
  gender: string | null;
}

export interface JoinFamilyInput {
  familyId: string;
  displayName: string;
  note: string | null;
}

export interface AdminPerson {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  isAdmin: boolean;
  portfolio: string | null;
  notes: string | null;
}

export interface AdminFamily {
  id: string;
  name: string;
  society: string | null;
  residenceDetail: string | null;
  workplace: string | null;
  workplaceDetail: string | null;
  eligibility: FamilyEligibility;
  tier: FamilyTier;
  isActive: boolean;
  phone: string | null;
  notes: string | null;
  people: AdminPerson[];
}

/** Admin edit payloads. Email nullable on person = manual/no-Google member. */
export interface AdminFamilyUpdate {
  name: string;
  society: string | null;
  residenceDetail: string | null;
  workplace: string | null;
  workplaceDetail: string | null;
  eligibility: FamilyEligibility;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
}

export interface AdminPersonInput {
  displayName: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  isAdmin: boolean;
  portfolio: string | null;
  notes: string | null;
}

export interface JoinRequestView {
  id: string;
  familyId: string;
  familyName: string;
  email: string;
  displayName: string;
  note: string | null;
  createdAt: string;
}

// ── Accounting (Sheets is source of truth; Worker reads via service account) ─

export interface CollectorWallet {
  collectorName: string;
  collected: number;
  deposited: number;
  /** collected - deposited: what the collector currently holds */
  inHand: number;
}

export interface AccountsSummary {
  eventId: EventId;
  totalCollected: number;
  totalExpense: number;
  balance: number;
  wallets: CollectorWallet[];
  updatedAt: string;
}

export interface BudgetLine {
  id: string;
  eventId: EventId;
  category: string;
  item: string;
  budgeted: number;
  actual: number | null;
  notes: string | null;
}

// ── API envelope ────────────────────────────────────────────────────────────

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

// Magarpatta location reference data (societies, towers) for pickers
export * from './locations';
