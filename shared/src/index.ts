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
  /** `guests`: guest bhog heads that day (core households only); omitted = unchanged. */
  counts: { menuId: string; count: number; guests?: number }[];
  /** Proxy target (admin/fin_admin only): record for this person's household instead of self. */
  personId?: string | null;
  /** Proxy target by household (admin/fin_admin only) — the Responses list's key; wins over personId. */
  householdKey?: string | null;
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
 * The core line: a person whose puja subscriptions and puja sponsorships in
 * one season (1 July → 30 June, the pujo ledger only) add up to at least this
 * amount QUALIFIES for core — one payment or several, either category or both.
 * Donations and other income don't count. Qualifying changes nothing by
 * itself: the Membership page marks the person and an admin promotes them.
 * No payment or headcount ever changes a tier or active status.
 */
export const CORE_CONTRIBUTION_THRESHOLD = 10000;

/**
 * Walk-up creation at the counter: no email, no sign-in. The admin always
 * names the tier — nobody joins the roll by default.
 */
export interface CounterPersonInput {
  displayName: string;
  phone: string | null;
  society: string | null;
  tier: FamilyTier;
}

/**
 * One household on the count sheet: the family, or the person when they
 * belong to none. Every household that paid or pledged in the season is
 * listed, answered or not, so the sheet doubles as the blank form for the
 * counter.
 */
export interface BhogHousehold {
  key: string; // family id, or person id for someone without a family
  name: string; // family name, else the person's display name
  tier: 'core' | 'member'; // core when anyone in the household is core
  /** Durga Pujo only: counts above what the household's money allows (a pledge cancelled after they were given). */
  overAllowance: boolean;
}

/** One cell of the household-by-household count sheet (core view). */
export interface BhogCountRow {
  personId: string;
  name: string;
  householdKey: string; // BhogHousehold.key
  menuId: string;
  count: number;
  guests: number; // guest bhog heads on top of `count`
  notes: string | null; // the sheet's remark ("already paid for 10 guests")
}

export interface BhogCountSheet {
  households: BhogHousehold[]; // sorted: core first, then by name
  rows: BhogCountRow[];
}

// ── Durga Pujo bhog coupons: who may bring how many ─────────────────────────

/**
 * What a household's season money buys in Durga Pujo bhog. The money is the
 * whole family's, one season (1 July → 30 June, pujo ledger): subscriptions
 * and sponsorships paid, plus sponsorship pledges not yet paid — a pledge
 * counts before the money arrives.
 *
 * - ₹10,000 or more, however it is made up: up to 10 people each day.
 * - Less: one coupon per ₹500, spent on any days — all on one day if they like.
 *
 * Kojagari, Saraswati and the food menus carry no allowance.
 */
export type BhogAllowance =
  | { kind: 'per_day'; perDay: number }
  | { kind: 'coupons'; coupons: number };

export const BHOG_PER_DAY_CAP = 10;
export const BHOG_RUPEES_PER_COUPON = 500;
/** Guest bhog: at most this many office colleagues / friends a day per household. */
export const BHOG_GUEST_CAP = 20;
/** The ledger sub-category guest bhog money lands under (contribution · misc_income), as in 2025. */
export const GUEST_BHOG_SUBCATEGORY = 'Guest Bhog';

/** A day's count closes this many days before it: Saptami (17 Oct) takes its last change on 13 Oct, IST. */
export const BHOG_CUTOFF_DAYS = 4;

export const bhogAllowance = (total: number): BhogAllowance =>
  total >= CORE_CONTRIBUTION_THRESHOLD
    ? { kind: 'per_day', perDay: BHOG_PER_DAY_CAP }
    : { kind: 'coupons', coupons: Math.floor(Math.max(0, total) / BHOG_RUPEES_PER_COUPON) };

/** Do these day counts (every day of the event, answered or not) fit the allowance? */
export const bhogFits = (a: BhogAllowance, counts: number[]): boolean =>
  a.kind === 'per_day' ? counts.every((n) => n <= a.perDay) : counts.reduce((s, n) => s + n, 0) <= a.coupons;

/** "Up to 10 people each day" / "8 coupons for the five days" — the allowance in words. */
export const bhogAllowanceText = (a: BhogAllowance, dayCount: number): string =>
  a.kind === 'per_day'
    ? `Up to ${a.perDay} people each day`
    : `${a.coupons} coupon${a.coupons === 1 ? '' : 's'} for the ${dayCount === 5 ? 'five' : dayCount} days — use them on any day`;

/** The last date (ISO, IST) a day's count can change: BHOG_CUTOFF_DAYS before it. */
export const bhogLastChange = (date: string): string => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - BHOG_CUTOFF_DAYS);
  return d.toISOString().slice(0, 10);
};

/** Today in IST, as an ISO date — the samiti's calendar, whatever the device or server clock says. */
export const todayIST = (now: Date = new Date()): string =>
  new Date(now.getTime() + 330 * 60 * 1000).toISOString().slice(0, 10);

/** Is a day still open for changes? Open through the whole of its last-change date, IST. */
export const bhogDayOpen = (date: string, now: Date = new Date()): boolean => todayIST(now) <= bhogLastChange(date);

/** One day on a household's headcount form. */
export interface BhogHeadcountDay {
  menuId: string;
  date: string; // ISO
  label: string;
  labelBn: string | null;
  /** The household's count; null = not answered yet. */
  count: number | null;
  /** Guest bhog heads that day, on top of `count`. */
  guests: number;
  /** Still taking changes (see bhogDayOpen). */
  open: boolean;
  /** The last date a change is taken, ISO. */
  lastChange: string;
}

/**
 * A household's headcount for one event — what the form shows, whether it
 * was opened from a ?c= link, by a signed-in member, or by an admin at the
 * counter. The server builds it; the browser only draws it.
 */
export interface BhogHeadcountView {
  eventId: EventId;
  eventName: string; // "Durga Pujo 2026"
  eventNameBn: string | null;
  household: { key: string; name: string };
  /** null = no limit (occasions other than Durga Pujo). */
  allowance: BhogAllowance | null;
  /**
   * Counts already above the allowance — a pledge was cancelled after they
   * were given. They stand, but can only come down; the admin sees a flag.
   */
  overAllowance: boolean;
  days: BhogHeadcountDay[];
  /**
   * Guest bhog, for a core household (₹10,000+ this season) when the event
   * has a guest rate set; null otherwise — no toggle is shown.
   */
  guestBhog: {
    /** May add guests: core now. False keeps guests already given visible, to come down only. */
    canAdd: boolean;
    rate: number; // ₹ per head
    inchargeName: string | null; // "Suvadip(Suvo) Gupta" — who to pay
    heads: number; // guests across the days
    due: number;
    received: number; // from the ledger (misc_income · Guest Bhog)
  } | null;
}

/**
 * What the ?c= link opens on: the event and the households to pick from —
 * exactly the Responses list (households that paid or pledged this season,
 * and anyone who has already answered), core first, names only.
 */
export interface BhogLinkSheet {
  eventId: EventId;
  eventName: string; // "Durga Pujo 2026"
  eventNameBn: string | null;
  households: { key: string; name: string; tier: 'core' | 'member' }[];
}

/** Save one household's counts from the link — no sign-in, the code is the key. */
export interface BhogLinkSaveInput {
  code: string;
  householdKey: string;
  counts: { menuId: string; count: number; guests?: number }[];
}

/** An event's bhog settings: the Food & Bhog in-charge and the guest rate. */
export interface BhogSettingInfo {
  inchargePersonId: string | null;
  inchargeName: string | null;
  guestRate: number | null; // ₹ per head; null = no guest bhog
}

/** One household on the guest bhog board (admin / fin_admin). */
export interface GuestBhogRow {
  householdKey: string;
  name: string;
  /** Who a payment is recorded against: the household's top giver this season. */
  contactPersonId: string;
  guestsByDay: number[]; // in day order
  heads: number;
  due: number;
  received: number;
  /** due − received; negative when overpaid (no refunds). */
  balance: number;
}

/** The guest bhog board of one event: settings, days, and every household with guests or payments. */
export interface GuestBhogSheet {
  setting: BhogSettingInfo;
  days: { menuId: string; label: string; date: string }[];
  rows: GuestBhogRow[];
  /**
   * Every household that may bring guests — core, ₹10,000+ this season —
   * answered or not: what the ledger's "Core Member Guest Bhog" picks from,
   * since a core member often pays at the counter for a friend on the day.
   */
  eligible: { householdKey: string; name: string; contactPersonId: string }[];
}

/** Record a guest bhog payment — a ledger entry, misc_income · Guest Bhog. */
export interface GuestBhogReceiveInput {
  eventId: EventId;
  householdKey: string;
  amount: number;
  entryDate: string; // ISO, IST
  walletPersonId: string; // received by
  /**
   * Guests paid for at the counter on the day, added to that day's guests for
   * the household (so the board's due matches the money) — optional.
   */
  menuId?: string | null;
  guests?: number;
  /** A remark added to the ledger note ("friend from office"). */
  note?: string | null;
}

/** An event's live headcount link, for admin / fin_admin to share. */
export interface BhogLinkInfo {
  code: string;
  createdAt: number; // ms since epoch
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
export const FAMILY_TIERS: readonly FamilyTier[] = ['core', 'member', 'non_member'];
export const isFamilyTier = (t: unknown): t is FamilyTier => FAMILY_TIERS.includes(t as FamilyTier);
export const TIER_LABEL: Record<FamilyTier, string> = {
  core: 'Core',
  member: 'Member',
  non_member: 'Non-member',
};
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
  /**
   * Set when this season's puja subscriptions and sponsorships reach
   * CORE_CONTRIBUTION_THRESHOLD and the person isn't core yet — a marker for
   * the admin, never an automatic promotion. Null otherwise.
   */
  qualifiesForCore: { season: number; total: number } | null;
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

/**
 * Creating a person (admin): the profile plus the tier, which the admin must
 * choose — there is no default. Edits leave tier out; the card's tier
 * buttons change it.
 */
export interface AdminPersonCreateInput extends AdminPersonInput {
  tier: FamilyTier;
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
