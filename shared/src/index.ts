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
  /** Nirghanto header (durga pujo) */
  purohitName: string | null;
  purohitPhone: string | null;
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

/** One nirghanto row: a ritual within a tithi day (Durga Pujo only). */
export interface TimeTableEntry {
  id: string;
  eventId: EventId;
  dayDate: string; // ISO date
  dayLabelBn: string; // "মহা ষষ্ঠী"
  dayLabelEn: string; // "Maha Shashthi"
  titleBn: string; // "ষষ্ঠী পূজা"
  titleEn: string;
  timeFrom: string | null; // "08:30" 24h; null until the purohit confirms
  timeTo: string | null;
  comments: string | null;
  sortOrder: number;
}

export interface AdminTimetableInput {
  eventId: EventId;
  dayDate: string;
  dayLabelBn: string;
  dayLabelEn: string;
  titleBn: string;
  titleEn: string;
  timeFrom: string | null;
  timeTo: string | null;
  comments: string | null;
  sortOrder: number;
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

export type MemberRole = 'member' | 'coremember' | 'admin';

export interface Me {
  id: string;
  /** The person row backing this login — used e.g. for volunteering on tasks */
  personId: string;
  name: string;
  email: string;
  image: string | null;
  role: MemberRole;
  /** Portfolio, if held by a core member — e.g. "Treasurer", "Cultural Secretary" */
  portfolio: string | null;
}

// ── Task distribution (Core Members feature) ────────────────────────────────

export type TaskPhase = 'todo' | 'in_progress' | 'completed';

export const TASK_MAX_OWNERS = 5;

/** One of the three fixed checkdates/milestones. */
export interface TaskCheck {
  date: string | null; // ISO date
  notes: string | null;
}

export interface TaskPersonRef {
  id: string;
  name: string;
}

/** A master-catalog task with one year's execution state folded in. */
export interface TaskView {
  id: string; // stable slug, year-independent
  category: string;
  title: string;
  /** Free text outlining scope / subtasks (a few lines) */
  details: string | null;
  sortOrder: number;
  isActive: boolean;
  /** Year-scoped execution state (defaults when the year has no row yet) */
  skipped: boolean; // not taken up this year
  phase: TaskPhase;
  checks: [TaskCheck, TaskCheck, TaskCheck];
  /** Free-form notes for this year's run */
  notes: string | null;
  owners: TaskPersonRef[]; // max 5
  volunteers: TaskPersonRef[];
}

/** Master-catalog fields (year-independent, curated over time). */
export interface TaskMasterInput {
  category: string;
  title: string;
  details: string | null;
  sortOrder: number;
  isActive: boolean;
}

/** One year's execution state for a task. */
export interface TaskYearInput {
  year: number;
  phase: TaskPhase;
  checks: [TaskCheck, TaskCheck, TaskCheck];
  notes: string | null;
  ownerIds: string[]; // max TASK_MAX_OWNERS
  volunteerIds: string[];
}

/** Light person entry for owner/volunteer pickers. */
export interface MemberLite {
  id: string;
  name: string;
  tier: FamilyTier;
}

// ── Onboarding & membership admin ───────────────────────────────────────────

export type FamilyTier = 'non_member' | 'member' | 'core';
export type FamilyEligibility = 'resident' | 'works_in_mgp' | 'by_invitation';

/** Where a signed-in user stands: member, registered-but-waiting, or new. */
export type OnboardingState =
  | { state: 'member' }
  | { state: 'awaiting_activation' }
  | { state: 'no_person' };

/** Self-service profile — creates (or completes) the signed-in user's person. */
export interface ProfileInput {
  displayName: string;
  eligibility: FamilyEligibility;
  society: string | null;
  residenceDetail: string | null;
  workplace: string | null;
  workplaceDetail: string | null;
  phone: string | null;
  gender: string | null;
}

export interface AdminPerson {
  id: string;
  familyId: string | null;
  familyName: string | null;
  displayName: string;
  email: string | null;
  society: string | null;
  residenceDetail: string | null;
  workplace: string | null;
  workplaceDetail: string | null;
  eligibility: FamilyEligibility;
  tier: FamilyTier;
  phone: string | null;
  gender: string | null;
  isAdmin: boolean;
  isActive: boolean;
  portfolio: string | null;
  notes: string | null;
}

/** Admin person payload. Email nullable = manual/no-Google member. */
export interface AdminPersonInput {
  familyId: string | null;
  displayName: string;
  email: string | null;
  society: string | null;
  residenceDetail: string | null;
  workplace: string | null;
  workplaceDetail: string | null;
  eligibility: FamilyEligibility;
  phone: string | null;
  gender: string | null;
  isAdmin: boolean;
  isActive: boolean;
  portfolio: string | null;
  notes: string | null;
}

export interface AdminFamily {
  id: string;
  name: string;
  notes: string | null;
  isActive: boolean;
}

export interface AdminFamilyInput {
  name: string;
  notes: string | null;
  isActive: boolean;
}

/** Admin event payload. kind+year form the id and are immutable after create. */
export interface AdminEventInput {
  kind: EventKind;
  year: number;
  nameBn: string;
  nameEn: string;
  startsOn: string; // ISO date
  endsOn: string;
  isActive: boolean;
  purohitName: string | null;
  purohitPhone: string | null;
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

// ── Ledger & sponsorship (docs/tmp/ledger-schema.md) ────────────────────────

export type BookId = 'pujo-ledger' | 'poila-baishakh-ledger';
export type LedgerKind = 'contribution' | 'expense' | 'transfer';
export type ContributionCategory = 'subscription' | 'sponsorship' | 'donation' | 'misc_income';
export type PledgeStatus = 'pledged' | 'paid' | 'cancelled';
export type ClaimStatus = 'requested' | 'settled' | 'rejected' | 'cancelled';

export const BOOKS: { id: BookId; name: string }[] = [
  { id: 'pujo-ledger', name: 'Durga Pujo · Kojagari · Bijoy Sammelani · Saraswati' },
  { id: 'poila-baishakh-ledger', name: 'Poila Baishakh' },
];

export const CONTRIBUTION_CATEGORIES: ContributionCategory[] = [
  'subscription',
  'sponsorship',
  'donation',
  'misc_income',
];

/** sub_category suggestions per contribution category */
export const CONTRIBUTION_SUBCATS: Record<ContributionCategory, string[]> = {
  subscription: ['core', 'non-core'],
  sponsorship: [], // auto-filled from the pledged item's catalog category
  donation: ['small box', 'large box', 'others'],
  misc_income: [],
};

/**
 * Expense category → sub-categories, seeded from the 2024 workbook Expenses
 * tab. Every category always also offers "Misc" (appended by the UI); both
 * levels stay free text so a year can coin new ones.
 */
export const EXPENSE_TAXONOMY: Record<string, string[]> = {
  Cultural: ['Badges', 'Baul + Dhol Baadak Fee', 'Rentals', 'Sound System', 'Stationery'],
  Flowers: ['Flowers'],
  Food: ['Bhog', 'Mishti Doi', 'Sandesh Prasad', 'Tea Coffee Snacks'],
  Labour: ['Daily Fee', 'Fooding', 'Lodging'],
  Murti: ['Pratima', 'Transport', 'Transport Labour', 'Karigar Tip', 'Bisarjan Ghat Tip'],
  Pandal: ['Pandal', 'Kaash Phool', 'Fire Extinguisher', 'Plants'],
  Procurement: [
    'Daily Perishables',
    'Dashakarma',
    'Disposables',
    'Pottery Items',
    'Printing',
    'Utensils',
    'Govt. Fees',
  ],
  Purohit: ['Fee', 'Dhaki Fee', 'Dhaki Tip', 'Transport', 'Sankalpa'],
  'Lakshmi Pujo': ['Samagri'],
  'Saraswati Pujo': [],
  Misc: [],
};

export interface LedgerEntry {
  id: string;
  bookId: BookId;
  eventId: string | null;
  entryDate: string; // "YYYY-MM-DD" IST
  kind: LedgerKind;
  category: string | null;
  subCategory: string | null;
  amount: number; // whole rupees, > 0
  personId: string | null;
  personName: string | null;
  counterparty: string | null;
  walletPersonId: string;
  walletName: string;
  toWalletPersonId: string | null;
  toWalletName: string | null;
  notes: string | null;
  isActive: boolean;
  createdByName: string;
}

export interface LedgerEntryInput {
  bookId: BookId;
  eventId: string | null;
  entryDate: string;
  kind: LedgerKind;
  category: string | null;
  subCategory: string | null;
  amount: number;
  personId: string | null;
  counterparty: string | null;
  walletPersonId: string;
  toWalletPersonId: string | null;
  notes: string | null;
}

export interface SponsorshipItemView {
  id: string;
  category: string;
  title: string;
  defaultAmount: number | null;
  sortOrder: number;
  /** master is_active */
  retired: boolean;
  /** this year's offering (null = no item_year row yet → offered at default) */
  yearAmount: number | null;
  offered: boolean;
  yearNotes: string | null;
  pledge: {
    id: string;
    personId: string;
    personName: string;
    amount: number;
    status: PledgeStatus;
    pledgedOn: string;
  } | null;
}

export interface SponsorshipItemInput {
  id?: string; // slug; derived from title when omitted
  category: string;
  title: string;
  defaultAmount: number | null;
  sortOrder?: number;
}

export interface ReimbursementClaim {
  id: string;
  bookId: BookId;
  eventId: string | null;
  personId: string;
  personName: string;
  expenseDate: string;
  amount: number;
  category: string;
  subCategory: string | null;
  counterparty: string;
  details: string | null;
  status: ClaimStatus;
  assignedTo: string | null;
  assignedToName: string | null;
  assignedOn: string | null;
  settledBy: string | null;
  settledByName: string | null;
  settledOn: string | null;
  notes: string | null;
}

export interface ReimbursementClaimInput {
  bookId: BookId;
  eventId: string | null;
  expenseDate: string;
  amount: number;
  category: string;
  subCategory: string | null;
  counterparty: string;
  details: string | null;
}

export interface WalletBalance {
  personId: string;
  personName: string;
  balance: number;
  /** balance before 1 July of the snapshot year */
  carriedForward: number;
  collectedSince: number;
  spentSince: number;
  transfersInSince: number;
  transfersOutSince: number;
}

export interface LedgerSummary {
  /** snapshot season boundary, e.g. "2026-07-01" */
  seasonStart: string;
  totalBalance: number;
  carriedForward: number;
  collectedSince: number;
  spentSince: number;
  outstandingClaims: number; // Σ requested reimbursements (liability)
  wallets: WalletBalance[];
}
