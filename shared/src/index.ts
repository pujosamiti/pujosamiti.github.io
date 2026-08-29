// API contract types shared between web (GitHub Pages) and api (Cloudflare Worker).
// Change a response shape here and both sides get compile errors instead of runtime surprises.

// ── Events ──────────────────────────────────────────────────────────────────
// Events are first-class: timetable rows, ledger entries and claims are tagged
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
  /** Free note shown above the nirghanto */
  notes: string | null;
  /** Set when an admin declares the nirghanto published & final; null = draft */
  nirghantoFinalizedOn: string | null;
}

// ── Public content ──────────────────────────────────────────────────────────

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
  /** A second note shown in red beneath the comment — a departure from the printed nirghanto */
  alertNote: string | null;
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
  alertNote: string | null;
  sortOrder: number;
}

// ── Days of the Pujo ────────────────────────────────────────────────────────
// The canonical per-year calendar (seeded by an admin from the FINALISED
// nirghanto) that every day-scoped feature references: procurement
// deliveries, bhog menu, RSVP, coupons, ritual-volunteer slots.

/** Canonical tithi names, in ritual order — the master list's day vocabulary. */
export const PUJA_TITHIS = [
  'Panchami',
  'Shashthi',
  'Saptami',
  'Ashtami',
  'Sandhi Puja',
  'Nabami',
  'Dashami',
] as const;
export type PujaTithi = (typeof PUJA_TITHIS)[number];

export interface PujaDay {
  id: string;
  eventId: EventId;
  date: string; // tithi date, ISO
  labelEn: string; // "Panchami", "Ashtami · Day 2"
  labelBn: string | null;
  sourceLabel: string | null; // the nirghanto's wording, e.g. "Maha Ashtami (Adhik Diba)"
  sortOrder: number;
  notes: string | null;
}

export interface PujaDaysView {
  /** Event's nirghanto finalisation date; null = draft (seeding blocked) */
  finalizedOn: string | null;
  /** Whether the year has any nirghanto rows at all */
  hasNirghanto: boolean;
  /** False when the nirghanto changed after the days were seeded */
  inSync: boolean;
  days: PujaDay[];
}

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

/**
 * 'fin_admin' runs the money — ledger, budgets, sponsorship pricing, claim
 * rejection — without touching membership. 'admin' holds everything.
 */
/**
 * newsignin: signed in and profile completed, but not yet activated by an
 * admin (person: origin='self', tier='non_member', active). View-only member
 * access plus ONE write — their household's food count. Computed per-request,
 * so an admin activation upgrades them instantly.
 */
export type MemberRole = 'newsignin' | 'member' | 'coremember' | 'fin_admin' | 'admin';

/** Roles that curate content; member and newsignin are consumers. */
export const isCoreRole = (r: MemberRole): boolean =>
  r === 'coremember' || r === 'fin_admin' || r === 'admin';

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

// ── Procurement (Durga Pujo shopping lists) ─────────────────────────────────
// Modelled on the samiti's 2024/2025 procurement sheets: items × per-year day
// columns, each day split Morning/Evening, plus a per-item Total Quantity and
// procurement status.

export const PROCUREMENT_SLOTS = ['morning', 'evening'] as const;
export type ProcurementSlot = (typeof PROCUREMENT_SLOTS)[number];

export type ProcurementStatus = 'pending' | 'partial' | 'done';

/** One day column of a year's procurement sheet. */
export interface ProcurementDay {
  id: string;
  year: number;
  /** The puja day this delivery serves; null for free-form columns */
  pujaDayId: string | null;
  label: string;
  /** Delivery moment for the vendor order — often the evening BEFORE the puja day. */
  date: string | null; // ISO date, optional
  time: string | null; // "HH:MM" 24h, optional
  sortOrder: number;
  notes: string | null; // e.g. "সন্ধি পুজো + নবমী combined delivery"
}

/** One cell: quantity for an item on one day, one slot. */
export interface ProcurementCell {
  id: string;
  dayId: string;
  slot: ProcurementSlot;
  quantity: string; // free text, units included ("250/500 gm", "1 + 7")
  notes: string | null;
  purchased: boolean;
}

/** Year-independent suggested quantity for one tithi × slot. */
export interface ProcurementSuggestion {
  tithi: PujaTithi | string;
  slot: ProcurementSlot;
  quantity: string;
}

/** Master-list entry: the catalog item plus its suggested quantities. */
export interface ProcurementMasterItem {
  id: string;
  category: string;
  title: string;
  nameHi: string | null;
  nameBn: string | null;
  details: string | null;
  suggestedTotal: string | null;
  sortOrder: number;
  isActive: boolean;
  suggestions: ProcurementSuggestion[];
}

/** A master-catalog item with one year's totals and cells folded in. */
export interface ProcurementItemView {
  id: string;
  category: string;
  title: string;
  /** Vendor-facing names for the printable order (Hindi for the phoolwala, Bengali for the committee). */
  nameHi: string | null;
  nameBn: string | null;
  details: string | null; // the sheet's NOTE lines
  suggestedTotal: string | null; // from the master list
  sortOrder: number;
  isActive: boolean;
  totalQuantity: string | null; // buy-once items have only this
  status: ProcurementStatus;
  /** Order-by deadline for advance purchases (murti garlands, pottery). */
  dueDate: string | null; // ISO date, optional
  dueTime: string | null; // "HH:MM" 24h, optional
  yearNotes: string | null; // remarks ("Purohit will bring")
  cells: ProcurementCell[];
}

export interface ProcurementView {
  days: ProcurementDay[];
  items: ProcurementItemView[];
}

export interface ProcurementItemInput {
  category: string;
  title: string;
  nameHi: string | null;
  nameBn: string | null;
  details: string | null;
  suggestedTotal: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface ProcurementItemYearInput {
  year: number;
  totalQuantity: string | null;
  status: ProcurementStatus;
  dueDate: string | null;
  dueTime: string | null;
  notes: string | null;
}

export interface ProcurementDayInput {
  year: number;
  label: string;
  date: string | null;
  time: string | null;
  sortOrder: number;
  notes: string | null;
}

/** Upsert one cell; an empty/blank quantity clears it. */
export interface ProcurementCellInput {
  itemId: string;
  dayId: string;
  slot: ProcurementSlot;
  quantity: string;
  notes: string | null;
}

// ── Bhog & food menus (per-event daily menus + per-plate cost) ──────────────

/**
 * Which events serve a "Bhog" vs a "Food Menu" — a naming convention the
 * samiti uses: pujas offer bhog, the social occasions a food menu.
 */
export const FOOD_MENU_KINDS: EventKind[] = ['bijoya-sammelani', 'poila-baishakh'];
export const menuKindLabel = (kind: EventKind): 'Bhog' | 'Food Menu' =>
  FOOD_MENU_KINDS.includes(kind) ? 'Food Menu' : 'Bhog';

/** Samiti season of an ISO date: 1 July → 30 June, named by its starting year. */
export const seasonOf = (iso: string): number => {
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7));
  return m >= 7 ? y : y - 1;
};

/** One dish on a day's menu, in serving order. */
export interface BhogMenuItem {
  id: string;
  title: string; // "Khichuri"
  titleBn: string | null; // "খিচুড়ি"
  sortOrder: number;
}

/**
 * One menu day of an event: per calendar DATE (a crunched year serves one
 * lunch for two tithis — 2024's "Saptami/Ashtami"); single-meal events carry
 * exactly one. Draft until published; members see only published days,
 * editors see everything.
 */
export interface BhogMenuView {
  id: string;
  eventId: EventId;
  pujaDayId: string | null; // host Puja Day, when seeded from one
  date: string; // ISO
  label: string; // "Saptami Bhog", "Bhog", "Food Menu"
  labelBn: string | null;
  perPlateCost: number | null; // whole ₹ (160/180/190 in 2024-25)
  notes: string | null; // "Mishti Doi +₹20"
  isPublished: boolean;
  sortOrder: number;
  items: BhogMenuItem[];
  /** This member's household headcount for the day; null = not answered yet. */
  myCount: number | null;
  /** Everyone's plates so far, and how many households have answered. */
  totalCount: number;
  responses: number;
}

/** One member's headcounts for an event's published days — Durga Puja in one go. */
export interface BhogRsvpInput {
  eventId: EventId;
  counts: { menuId: string; count: number }[];
}

/** One cell of the household-by-household count sheet (core view). */
export interface BhogCountRow {
  personId: string;
  name: string;
  tier: FamilyTier; // Core vs Member tag on the response
  menuId: string;
  count: number;
  notes: string | null; // the sheet's remark ("already paid for 10 guests")
}

export interface BhogDayInput {
  eventId: EventId;
  label: string;
  labelBn: string | null;
  date: string;
  perPlateCost: number | null;
  notes: string | null;
  sortOrder: number;
}

/** Replace a day's dishes wholesale (the editor is a lines textarea). */
export interface BhogItemsInput {
  items: { title: string; titleBn: string | null }[];
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

/**
 * OPEN MEMBERSHIP window for the 2026 season: everyone who signs in and
 * completes their profile gets in immediately as a NEWSIGNIN (view-only +
 * food count) through this IST date, without waiting for admin activation.
 * Stored tiers are untouched — new sign-ins register as origin='self' /
 * tier='non_member', so the admin's "Pending activation" list keeps
 * recording who hasn't been approved; activating someone there grants their
 * real role instantly, and un-activated people lose access when the window
 * closes.
 */
export const OPEN_MEMBERSHIP_UNTIL = '2026-10-15'; // inclusive
export const openMembershipActive = (): boolean =>
  new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10) <= OPEN_MEMBERSHIP_UNTIL;

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
  /** 'self' = registered themselves and awaits activation; 'roster' = on the samiti's rolls */
  origin: 'roster' | 'self';
  /** epoch ms — the merge keeps the older record */
  createdAt: number;
  id: string;
  familyId: string | null;
  familyName: string | null;
  displayName: string;
  email: string | null;
  /** Second sign-in address; either matches this person */
  altEmail: string | null;
  society: string | null;
  residenceDetail: string | null;
  workplace: string | null;
  workplaceDetail: string | null;
  eligibility: FamilyEligibility;
  tier: FamilyTier;
  phone: string | null;
  gender: string | null;
  isAdmin: boolean;
  /** Finance authority without the membership roll */
  isFinAdmin: boolean;
  isActive: boolean;
  portfolio: string | null;
  notes: string | null;
}

/** Admin person payload. Email nullable = manual/no-Google member. */
export interface AdminPersonInput {
  familyId: string | null;
  displayName: string;
  email: string | null;
  /** Second sign-in address; either matches this person */
  altEmail: string | null;
  society: string | null;
  residenceDetail: string | null;
  workplace: string | null;
  workplaceDetail: string | null;
  eligibility: FamilyEligibility;
  phone: string | null;
  gender: string | null;
  isAdmin: boolean;
  /** Finance authority without the membership roll */
  isFinAdmin: boolean;
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
  notes: string | null;
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
  misc_income: ['Anandamela', 'Cultural Participation Contri', 'Food Coupons', 'Guest Bhog', 'Refund'],
};

/**
 * Expense category → sub-categories, seeded from the 2024 workbook Expenses
 * tab. Every category always also offers "Misc" (appended by the UI); both
 * levels stay free text so a year can coin new ones.
 */
export const EXPENSE_TAXONOMY: Record<string, string[]> = {
  Cultural: ['Badges', 'External Artists', 'Games Props/Artifacts', 'Prize/Awards', 'Rentals', 'Sound System', 'Stationery'],
  Flowers: ['Flowers'],
  Food: ['Bhog', 'Mishti Doi', 'Prasad Pack/Sandesh/Sweet', 'Tea Coffee Snacks'],
  Labour: ['Daily Fee', 'Fooding', 'Lodging'],
  Murti: [
    'Pratima',
    'Transport',
    'Transport Labour',
    'Karigar Tip',
    'Bisarjan Ghat Tip',
    'Bisarjan Ghat Boat',
    'Bisarjan Ghat Expenses',
  ],
  Pandal: ['Pandal', 'Decoration Items', 'Fire Extinguisher', 'Plants'],
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
  'Lakshmi Pujo': ['Bhog', 'Samagri', 'Purohit', 'Flowers'],
  'Saraswati Pujo': ['Bhog', 'Samagri', 'Purohit', 'Flowers', 'Murti', 'Decoration', 'Labour'],
  'Bijoy Sammelani': [],
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
  /** epoch ms; edit/void lock 48 h after this, admin included */
  createdAt: number;
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

export interface BudgetLine {
  id: string;
  /** season-start year (season = 1 July → 30 June) */
  year: number;
  category: string;
  /** null = whole-category "General" line */
  subCategory: string | null;
  amount: number;
  notes: string | null;
}

/**
 * One season's expense total for a category/sub-category — what the Budget vs
 * Spend table needs. Aggregated on the server so the table can be shown to
 * every member without handing over the individual ledger entries.
 * Uncategorised spend lands under "Misc", matching the report's own fallback.
 */
export interface SpendRow {
  /** season-start year (season = 1 July → 30 June) */
  season: number;
  category: string;
  subCategory: string;
  total: number;
  /** how many entries make up the total */
  n: number;
}

export interface BudgetLineInput {
  year: number;
  category: string;
  subCategory: string | null;
  amount: number;
  notes?: string | null;
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
  /** exclusive end of the season window, e.g. "2027-07-01" */
  seasonEnd: string;
  /** season-start year this summary covers (season = 1 July → 30 June) */
  seasonYear: number;
  currentSeasonYear: number;
  /** season-start years that have ledger entries (newest first) */
  seasons: number[];
  totalBalance: number;
  carriedForward: number;
  collectedSince: number;
  /** portion of collectedSince that is sponsorship money */
  collectedSponsorship: number;
  spentSince: number;
  outstandingClaims: number; // Σ requested reimbursements (liability)
  wallets: WalletBalance[];
}
