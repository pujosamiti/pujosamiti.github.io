import { LOCATION_OTHER, MAGARPATTA_SOCIETIES, MAGARPATTA_WORKPLACE_GROUPS } from '@pujosamiti/shared'

import type { SearchSelectOption } from '@/components/SearchSelect'

/**
 * The society (residents) or tower/building (those who work in Magarpatta)
 * as picker options: buildings under their group headings, "Other" last.
 * `empty` adds a first row for no answer yet (its value is '').
 */
export function locationOptions(resident: boolean, empty?: string): SearchSelectOption[] {
  const places: SearchSelectOption[] = resident
    ? MAGARPATTA_SOCIETIES.map((s) => ({ value: s, label: s }))
    : MAGARPATTA_WORKPLACE_GROUPS.flatMap((g) => g.options.map((o) => ({ value: o, label: o, group: g.group })))
  // under groups, "Other" gets a heading of its own so it isn't read as part of the last group
  const other: SearchSelectOption = { value: LOCATION_OTHER, label: LOCATION_OTHER, ...(resident ? {} : { group: 'Elsewhere' }) }
  return [...(empty ? [{ value: '', label: empty }] : []), ...places, other]
}
