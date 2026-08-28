import type { PujaDaysView } from '@pujosamiti/shared'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { useMemberState } from '@/lib/member'

/** The Days of the Pujo — the calendar every day-scoped feature hangs off. */
export function usePujaDays(year: number | null) {
  const { memberState } = useMemberState()
  return useQuery({
    queryKey: ['puja-days', year],
    queryFn: () => api<PujaDaysView>(`/api/members/puja-days?year=${year}`),
    enabled: memberState?.status === 'member' && !!year,
  })
}

const post = (path: string, body: unknown) =>
  api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

export const setNirghantoFinalized = (eventId: string, finalized: boolean) =>
  post(`/api/admin/events/${eventId}/nirghanto-finalize`, { finalized })
export const seedPujaDays = (eventId: string) => post(`/api/admin/events/${eventId}/seed-puja-days`, {})
export const resyncPujaDays = (eventId: string) =>
  post(`/api/admin/events/${eventId}/resync-puja-days`, {}) as Promise<{
    updated: number
    created: number
    orphaned: string[]
  }>
