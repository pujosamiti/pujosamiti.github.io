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

// ── Members & auth ──────────────────────────────────────────────────────────

/**
 * 'fin_admin' runs the money — ledger, budgets, sponsorship pricing, claim
 * rejection — without touching membership. 'admin' holds everything.
 */
/**
 * newsignin: signed in and profile completed, but not yet activated by an
 * admin (person: origin='self', tier='non_member', active). View-only access
 * to bhog and sponsorship plus TWO writes — their household's headcount and
 * their own pledge. Computed per-request, so an admin activation upgrades
 * them instantly.
 */
export type MemberRole = 'newsignin' | 'member' | 'coremember' | 'fin_admin' | 'admin';

/**
 * Email privacy: sign-in addresses are used ONLY to recognise the sign-in.
 * They are never shown to anyone — admins included — and the samiti never
 * sends email. Displays get the masked form ("xxxxxx@gmail.com").
 */
export const maskEmail = (e: string | null): string | null =>
  e ? `xxxxxx@${e.split('@')[1] ?? ''}` : null;
export const isMaskedEmail = (e: string | null | undefined): boolean => !!e && e.startsWith('xxxxxx@');

/** Roles that may record on someone's behalf: counter entries, proxy headcounts. */
export const isProxyRole = (r: MemberRole): boolean => r === 'admin' || r === 'fin_admin';

/**
 * The samiti's own account — the webmaster. It curates the catalog behind the
 * boards: which slots exist at all, and which of them a given year offers.
 * Everyone else, admins and finance included, sees only what is on offer.
 */
export const WEBMASTER_PERSON_ID = 'p-samiti';
export const isWebmaster = (personId: string | null | undefined): boolean =>
  personId === WEBMASTER_PERSON_ID;

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
  /** Uma sections this person edits — empty for everyone but section editors */
  umaSections: UmaSectionId[];
  /** Portfolio, if held by a core member — e.g. "Treasurer", "Cultural Secretary" */
  portfolio: string | null;
  /** Seat on the Uma masthead, when held — gates the editorial desk */
  umaRole: UmaRole | null;
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
  /** Proxy target (admin/fin_admin only): record for this person instead of self. */
  personId?: string | null;
  /** Optional remark stored on the rows saved this submission (proxy mode). */
  note?: string | null;
}

// ── Counter entries (recording on someone's behalf) ─────────────────────────

/** Roster row for the counter picker — every person, active or not. */
export interface PickerPerson {
  id: string;
  name: string;
  tier: FamilyTier;
  isActive: boolean;
  society: string | null;
}

/**
 * The automatic tier rule for recorded payments: a subscription or
 * sponsorship of ≥ this amount makes the payer CORE; any smaller recorded
 * participation (payment or headcount) makes a non-member a MEMBER.
 * Upgrades only — nothing ever demotes automatically.
 */
export const CORE_CONTRIBUTION_THRESHOLD = 10000;

/** Walk-up creation at the counter: no email, no sign-in — joins as a member. */
export interface CounterPersonInput {
  displayName: string;
  phone: string | null;
  society: string | null;
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
 * headcount) through this IST date, without waiting for admin activation.
 * Stored tiers are untouched — new sign-ins register as origin='self' /
 * tier='non_member', so the admin's "Pending activation" list keeps
 * recording who hasn't been approved; activating someone there grants their
 * real role instantly, and un-activated people lose access when the window
 * closes.
 */
export const OPEN_MEMBERSHIP_UNTIL = '2026-10-30'; // inclusive
export const openMembershipActive = (): boolean =>
  new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10) <= OPEN_MEMBERSHIP_UNTIL;

/**
 * The sponsorship board opens to the samiti on this IST date. Before it, the
 * page belongs to admins alone: the catalog is still being priced and the
 * slots settled, and a half-built board invites pledges nobody can honour.
 * From the 25th it is what it has always been — every member, and new
 * sign-ins during the open-membership window.
 */
export const SPONSORSHIP_OPENS_ON = '2026-09-25';
export const sponsorshipOpen = (): boolean =>
  new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10) >= SPONSORSHIP_OPENS_ON;

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
  origin: 'roster' | 'self' | 'counter';
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

/**
 * A subscription is either the core membership fee or a smaller non-core
 * one. Unlike the other sub-categories these are not suggestions: the entry
 * form is a fixed dropdown and the API rejects anything else.
 */
export const SUBSCRIPTION_SUBCATS = ['core', 'non-core'] as const;
export type SubscriptionSubCategory = (typeof SUBSCRIPTION_SUBCATS)[number];

/**
 * Season PDF reports (core / non-core subscriptions, sponsorships) exist from
 * this season on. Earlier seasons were tagged by hand before the sub-category
 * rule existed, so a report over them would mislabel members.
 */
export const LEDGER_PDF_FROM_SEASON = 2026;

/** sub_category suggestions per contribution category */
export const CONTRIBUTION_SUBCATS: Record<ContributionCategory, string[]> = {
  subscription: [...SUBSCRIPTION_SUBCATS],
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
  /** The contributor's family, when they are linked to one — what the season PDFs print. */
  familyName: string | null;
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
  /** One-line appeal under the title, both languages; either may be missing. */
  tagline: string | null;
  taglineBn: string | null;
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
    /** The ledger entry's date once the money is in; null until then. */
    paidOn: string | null;
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

// ── Uma (উমা) — the samiti's magazine ───────────────────────────────────────
// A Sankhya is one issue; there is no fixed cadence — the chief editor opens
// one when enough accepted material has piled up (fortnightly to monthly).
// The magazine itself is fully PUBLIC (that is what makes SEO and WhatsApp
// sharing real); only the editorial desk is gated. Submissions arrive out of
// band (WhatsApp/email to the editors, as Word/txt/markdown/PDF + photos) and
// a dev converts them into drafts; editors accept/hold/reject in the app.

// Order is editorial (the samiti's chosen sequence), not alphabetical —
// it drives the section chips and every section listing.
export const UMA_SECTIONS = [
  { id: 'art', en: 'Art', bn: 'শিল্পকলা' },
  { id: 'fashion', en: 'Fashion', bn: 'ফ্যাশন' },
  { id: 'stories', en: 'Stories', bn: 'গল্প' },
  { id: 'games', en: 'Games & Puzzles', bn: 'ধাঁধা' },
  { id: 'travel', en: 'Travel', bn: 'ভ্রমণ' },
  { id: 'recipes', en: 'Recipes', bn: 'হেঁশেল' },
  { id: 'health', en: 'Health', bn: 'স্বাস্থ্য' },
  { id: 'mythology', en: 'Mythology & Puja Rituals', bn: 'পুরাণ ও আচার' },
  { id: 'poetry', en: 'Poetry', bn: 'কবিতা' },
  { id: 'commentary', en: 'Commentary', bn: 'সমকাল' },
] as const;
export type UmaSectionId = (typeof UMA_SECTIONS)[number]['id'];
export const umaSection = (id: string) => UMA_SECTIONS.find((s) => s.id === id);

/**
 * Who may work the desk at all: the chief editor, anyone holding a section,
 * and admins (who are the devs doing intake).
 */
export const isUmaEditor = (me: { role: MemberRole; umaRole: UmaRole | null; umaSections: UmaSectionId[] }): boolean =>
  me.role === 'admin' || me.umaRole === 'chief_editor' || me.umaSections.length > 0;

/** Who may work THIS article: its own section's editor, the chief, an admin. */
export const canEditUmaSection = (
  me: { role: MemberRole; umaRole: UmaRole | null; umaSections: UmaSectionId[] },
  section: string,
): boolean =>
  me.role === 'admin' || me.umaRole === 'chief_editor' || me.umaSections.includes(section as UmaSectionId);

/**
 * The masthead: one chief editor, and one editor per SECTION. A section's
 * editor runs that section's queue — accept, hold, reject, copy-edit — and
 * nothing outside it. One person may hold several sections; a section that
 * has no editor yet simply sits unassigned. Seats are for active CORE members
 * and are assigned by an admin. The chief composes and publishes Sankhyas.
 * Admins hold everything implicitly (they are the devs doing intake).
 */
export type UmaRole = 'chief_editor' | 'editor';

/** One section's seat on the masthead. */
export interface UmaSeat {
  section: UmaSectionId;
  personId: string | null;
  personName: string | null;
}

/**
 * draft      — dev still converting; not yet in the editors' queue
 * in_review  — waiting for an editor's verdict
 * accepted   — slotted into a (still unpublished) Sankhya
 * held       — parked; any editor can pull it into a later Sankhya
 * rejected   — with the editor's note
 * published  — live on the public site (set by publishing its Sankhya)
 */
export type UmaArticleStatus = 'draft' | 'in_review' | 'accepted' | 'held' | 'rejected' | 'published';

/** Claps are Medium-style: tap repeatedly, capped per reader. Hearts are one per reader. */
export const UMA_MAX_CLAPS = 21;

/** Public card — everything a listing needs, no body. */
export interface UmaArticleCard {
  slug: string;
  section: UmaSectionId;
  title: string;
  titleBn: string | null;
  authorName: string;
  /** Byline in Bengali script; shown when reading the বাংলা version */
  authorNameBn: string | null;
  isGuest: boolean;
  excerpt: string | null;
  /** API path ("/api/public/uma/media/…") — prefix with the API origin to display */
  heroImage: string | null;
  issueNumber: number | null;
  publishedAt: string | null; // ISO datetime
  hearts: number;
  claps: number;
  readingMinutes: number;
  /** Primary language, for <html lang> and JSON-LD */
  lang: 'bn' | 'en';
}

export interface UmaArticleView extends UmaArticleCard {
  authorBio: string | null;
  authorBioBn: string | null;
  bodyMd: string;
  /** The piece in the OTHER language; when set, the page shows বাংলা/English pills */
  bodyMdAlt: string | null;
  issueTitle: string | null;
}

export interface UmaIssueCard {
  id: string; // 'sankhya-1'
  number: number;
  /** Optional theme name — "শারদীয়া সংখ্যা"; display falls back to "সংখ্যা <n>" */
  title: string | null;
  coverImage: string | null;
  /** Markdown — the chief editor's desk (সম্পাদকীয়) */
  editorialNote: string | null;
  status: 'draft' | 'published';
  publishedOn: string | null; // ISO date
  articleCount: number;
}

export interface UmaIssueView extends UmaIssueCard {
  articles: UmaArticleCard[];
}

export interface UmaHomeView {
  latest: UmaIssueView | null;
  /** Published issues, newest first (latest included) */
  issues: UmaIssueCard[];
  masthead: { chief: string | null; editors: string[] }; // public: names only
}

/** Anonymous public reaction, sent as deltas the server clamps. */
export interface UmaReactInput {
  slug: string;
  /** -1 (un-heart), 0 or 1 */
  hearts: number;
  /** 0..UMA_MAX_CLAPS additional claps */
  claps: number;
}

// — editorial desk —

export interface UmaDeskArticle extends UmaArticleView {
  id: string;
  status: UmaArticleStatus;
  issueId: string | null;
  sortOrder: number;
  authorPersonId: string | null;
  submittedVia: 'whatsapp' | 'email' | null;
  submittedOn: string | null; // ISO date
  /** Internal — hold/reject reason, copy-edit notes; never shown publicly */
  editorNote: string | null;
  updatedAt: string;
}

export interface UmaDeskView {
  articles: UmaDeskArticle[];
  issues: UmaIssueCard[]; // drafts included, newest first
  masthead: { chief: { id: string; name: string } | null; seats: UmaSeat[] };
}

export interface UmaArticleInput {
  /** Derived from the title when omitted; REQUIRED when the title has no ASCII letters */
  slug?: string;
  section: UmaSectionId;
  title: string;
  titleBn: string | null;
  authorName: string;
  authorNameBn: string | null;
  authorBio: string | null;
  authorBioBn: string | null;
  authorPersonId: string | null;
  isGuest: boolean;
  excerpt: string | null;
  heroImage: string | null;
  bodyMd: string;
  /** Optional translation into the other language */
  bodyMdAlt: string | null;
  lang: 'bn' | 'en';
  submittedVia: 'whatsapp' | 'email' | null;
  submittedOn: string | null;
}

export interface UmaStatusInput {
  status: UmaArticleStatus;
  /** Required when accepting: the (unpublished) Sankhya to slot into */
  issueId?: string | null;
  editorNote?: string | null;
}

export interface UmaIssueInput {
  number: number;
  title: string | null;
  coverImage: string | null;
  editorialNote: string | null;
}

export interface BudgetLineInput {
  year: number;
  category: string;
  subCategory: string | null;
  amount: number;
  notes?: string | null;
}

/** Where a carried-forward balance came from — Poila Baishakh money is not
 *  pujo money, even when the same person is holding both. */
export interface BookShare {
  bookId: BookId;
  amount: number;
}

export interface WalletBalance {
  personId: string;
  personName: string;
  balance: number;
  /** balance before 1 July of the snapshot year */
  carriedForward: number;
  /** that same figure, split by the book it was earned in (non-zero shares only) */
  carriedForwardByBook: BookShare[];
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
  /** the same figure, split by book — Poila Baishakh's surplus is its own */
  carriedForwardByBook: BookShare[];
  collectedSince: number;
  /** portion of collectedSince that is sponsorship money */
  collectedSponsorship: number;
  spentSince: number;
  outstandingClaims: number; // Σ requested reimbursements (liability)
  wallets: WalletBalance[];
}
