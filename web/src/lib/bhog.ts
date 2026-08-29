import type { BhogCountRow, BhogDayInput, BhogItemsInput, BhogMenuView, BhogRsvpInput } from '@pujosamiti/shared'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { useMemberState } from '@/lib/member'

export function useBhog(season: number | null) {
  const { memberState } = useMemberState()
  return useQuery({
    queryKey: ['bhog', season],
    queryFn: () => api<BhogMenuView[]>(`/api/members/bhog?season=${season}`),
    enabled: memberState?.status === 'member' && season != null,
  })
}

const post = (path: string, body: unknown) =>
  api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

export const seedBhogDays = (eventId: string) =>
  post('/api/members/bhog/days/seed', { eventId }) as Promise<{ created: number }>
export const createBhogDay = (input: BhogDayInput) =>
  post('/api/members/bhog/days', input) as Promise<{ id: string }>
export const updateBhogDay = (id: string, input: BhogDayInput) => post(`/api/members/bhog/days/${id}`, input)
export const deleteBhogDay = (id: string) => post(`/api/members/bhog/days/${id}/delete`, {})
export const publishBhogDay = (id: string, published: boolean) =>
  post(`/api/members/bhog/days/${id}/publish`, { published })
export const saveBhogItems = (id: string, input: BhogItemsInput) =>
  post(`/api/members/bhog/days/${id}/items`, input) as Promise<{ count: number }>
export const submitBhogCounts = (input: BhogRsvpInput) =>
  post('/api/members/bhog/rsvp', input) as Promise<{ saved: number; rollUpdated: 'core' | 'member' | 'reactivated' | null }>

/** The household-by-household count sheet for one event (core). */
export function useBhogCounts(eventId: string | null) {
  const { memberState } = useMemberState()
  return useQuery({
    queryKey: ['bhog-counts', eventId],
    queryFn: () => api<BhogCountRow[]>(`/api/members/bhog/counts?eventId=${eventId}`),
    enabled: memberState?.status === 'member' && !!eventId,
  })
}
