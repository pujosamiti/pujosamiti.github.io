import type { SearchSelectOption } from '@/components/SearchSelect'

const GENDERS: SearchSelectOption[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
]
/** Asked of the person themselves: saying nothing is a choice, and the default. */
export const GENDER_OPTIONS_SELF: SearchSelectOption[] = [{ value: '', label: 'Prefer not to say' }, ...GENDERS]
/** An admin's record: '' is simply not known. */
export const GENDER_OPTIONS_ADMIN: SearchSelectOption[] = [{ value: '', label: '—' }, ...GENDERS]
