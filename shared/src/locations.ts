// Magarpatta City location reference data — powers the "where do you reside /
// where do you work" pickers. Membership eligibility: resident of Magarpatta
// City, or working inside it. Lists are best-effort snapshots (sources:
// Wikipedia + office listings, 2026); the UI must always offer an "Other"
// free-text escape hatch since SEZ buildings get renamed with tenants.

/** Residential societies — apartment clusters. */
export const MAGARPATTA_APARTMENT_CLUSTERS = [
  'Annexe',
  'Cosmos',
  'Daffodils',
  'Grevillea',
  'Heliconia',
  'Iris',
  'Jasminium',
  'Laburnum Park',
  'Roystonea',
  'Sylvania',
  'Trillium',
  'Zinnia',
] as const;

/** Residential societies — villa / row-house clusters. */
export const MAGARPATTA_VILLA_CLUSTERS = [
  'Acacia Gardens Bungalows',
  'Erica Row Houses',
  'Mulberry Gardens Bungalows',
  'Zinnia Row Houses',
] as const;

export const MAGARPATTA_SOCIETIES = [
  ...MAGARPATTA_APARTMENT_CLUSTERS,
  ...MAGARPATTA_VILLA_CLUSTERS,
] as const;

/** Workplace buildings, grouped the way locals refer to them. */
export const MAGARPATTA_WORKPLACE_GROUPS = [
  {
    group: 'Cybercity Towers',
    options: Array.from({ length: 15 }, (_, i) => `Tower ${i + 1}`),
  },
  {
    group: 'Pentagon Towers',
    options: Array.from({ length: 5 }, (_, i) => `Pentagon P${i + 1}`),
  },
  {
    // Distinct from the SEZ buildings below.
    group: 'S Towers',
    options: ['Tower S1', 'Tower S2', 'Tower S3', 'Tower S4'],
  },
  {
    // Known colloquially by anchor tenant (Accenture: B1/B4, Eaton: B6/B7);
    // the flat/company free-text field carries the employer name.
    group: 'SEZ Buildings',
    options: Array.from({ length: 7 }, (_, i) => `SEZ Building B${i + 1}`),
  },
  {
    group: 'Retail & other',
    options: ['Seasons Mall', 'Destination Centre'],
  },
] as const;

export const MAGARPATTA_WORKPLACES = MAGARPATTA_WORKPLACE_GROUPS.flatMap((g) => g.options);

/** Always shown last in both pickers; selecting it enables free-text entry. */
export const LOCATION_OTHER = 'Other' as const;
