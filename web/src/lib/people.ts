import type { CounterPersonInput, PickerPerson } from '@pujosamiti/shared'
import { isProxyRole } from '@pujosamiti/shared'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { useMemberState } from '@/lib/member'

/**
 * The counter picker roster — EVERY person on the roll, active or not.
 * Only fetched for admin/fin_admin; the Worker enforces the same.
 */
export function usePickerPeople() {
  const { memberState } = useMemberState()
  const me = memberState?.status === 'member' ? memberState.me : null
  return useQuery({
    queryKey: ['people-full'],
    queryFn: () => api<PickerPerson[]>('/api/members/people-full'),
    enabled: !!me && isProxyRole(me.role),
  })
}

/** Walk-up creation at the counter: joins the roll as an active member. */
export const createCounterPerson = (input: CounterPersonInput) =>
  api<{ id: string }>('/api/members/counter-person', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
