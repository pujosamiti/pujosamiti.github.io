import type {
  BhogCountSheet,
  BhogDayInput,
  BhogHeadcountView,
  BhogItemsInput,
  BhogLinkInfo,
  BhogLinkSaveInput,
  BhogLinkSheet,
  BhogMenuView,
  BhogRsvpInput,
  BhogSettingInfo,
  GuestBhogReceiveInput,
  GuestBhogSheet,
} from '@pujosamiti/shared'
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
  post('/api/members/bhog/rsvp', input) as Promise<{ saved: number }>

/** The household-by-household count sheet for one event (core). */
export function useBhogCounts(eventId: string | null) {
  const { memberState } = useMemberState()
  return useQuery({
    queryKey: ['bhog-counts', eventId],
    queryFn: () => api<BhogCountSheet>(`/api/members/bhog/counts?eventId=${eventId}`),
    // Counts arrive from other phones (the ?c= link): always fetch when the
    // sheet opens and when the tab comes back into view — the ↻ is for "now".
    staleTime: 0,
    enabled: memberState?.status === 'member' && !!eventId,
  })
}

/**
 * A household's headcount form for one event, signed in: the member's own
 * household (no target), or — admin / fin_admin at the counter — a household
 * from the Responses list (`householdKey`) or a person's (`personId`).
 */
export function useHeadcount(
  eventId: string | null,
  target: { householdKey?: string | null; personId?: string | null } | null,
  enabled = true,
) {
  const { memberState } = useMemberState()
  const q = target?.householdKey
    ? `&householdKey=${encodeURIComponent(target.householdKey)}`
    : target?.personId
      ? `&personId=${encodeURIComponent(target.personId)}`
      : ''
  return useQuery({
    queryKey: ['bhog-headcount', eventId, q],
    queryFn: () => api<BhogHeadcountView>(`/api/members/bhog/headcount?eventId=${eventId}${q}`),
    enabled: memberState?.status === 'member' && !!eventId && enabled,
  })
}

// ── The headcount link (admin / fin_admin) ──────────────────────────────────

export function useBhogLink(eventId: string | null) {
  return useQuery({
    queryKey: ['bhog-link', eventId],
    queryFn: () => api<BhogLinkInfo | null>(`/api/members/bhog/link?eventId=${eventId}`),
    enabled: !!eventId,
  })
}
export const issueBhogLink = (eventId: string, replace = false) =>
  post('/api/members/bhog/link', { eventId, replace }) as Promise<BhogLinkInfo>

/** Where a code opens: the public count page, on whichever site this is. */
export const bhogLinkUrl = (code: string) => `${window.location.origin}/bhog/count/?c=${code}`

// ── The link's own page: no sign-in, the code is the key ────────────────────

export function useLinkSheet(code: string) {
  return useQuery({
    queryKey: ['bhog-link-sheet', code],
    queryFn: () => api<BhogLinkSheet>(`/api/public/bhog/headcount?c=${encodeURIComponent(code)}`),
    enabled: !!code,
    retry: false,
  })
}
export function useLinkHousehold(code: string, householdKey: string | null) {
  return useQuery({
    queryKey: ['bhog-link-household', code, householdKey],
    queryFn: () =>
      api<BhogHeadcountView>(
        `/api/public/bhog/headcount/household?c=${encodeURIComponent(code)}&h=${encodeURIComponent(householdKey!)}`,
      ),
    enabled: !!code && !!householdKey,
    retry: false,
    staleTime: 0,
  })
}
export const saveLinkCounts = (input: BhogLinkSaveInput) =>
  post('/api/public/bhog/headcount', input) as Promise<BhogHeadcountView>

// ── Guest bhog (admin / fin_admin) ──────────────────────────────────────────

/** The guest bhog board — also what the ledger form's toggle picks a household from. */
export function useGuestBoard(eventId: string | null) {
  return useQuery({
    queryKey: ['bhog-guests', eventId],
    queryFn: () => api<GuestBhogSheet>(`/api/members/bhog/guests?eventId=${eventId}`),
    enabled: !!eventId,
    // Guests and payments come from other phones and other admins: fetch on
    // open and on returning to the tab, as the Responses sheet does.
    staleTime: 0,
  })
}
export const saveBhogSetting = (input: { eventId: string; inchargePersonId: string | null; guestRate: number | null }) =>
  post('/api/members/bhog/setting', input) as Promise<BhogSettingInfo>
export const receiveGuestBhog = (input: GuestBhogReceiveInput) =>
  post('/api/members/bhog/guests/receive', input) as Promise<{ id: string }>
