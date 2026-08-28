import type {
  ProcurementCellInput,
  ProcurementDayInput,
  ProcurementItemInput,
  ProcurementItemYearInput,
  ProcurementMasterItem,
  ProcurementSuggestion,
  ProcurementView,
} from '@pujosamiti/shared'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { useMemberState } from '@/lib/member'

export function useProcurement(year: number | null) {
  const { memberState } = useMemberState()
  return useQuery({
    queryKey: ['procurement', year],
    queryFn: () => api<ProcurementView>(`/api/members/procurement?year=${year}`),
    enabled: memberState?.status === 'member' && !!year,
  })
}

const post = (path: string, body: unknown) =>
  api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

export const createProcurementItem = (input: ProcurementItemInput) =>
  post('/api/members/procurement/items', input) as Promise<{ id: string }>
export const updateProcurementItem = (id: string, input: ProcurementItemInput) =>
  post(`/api/members/procurement/items/${id}`, input)
export const saveItemYear = (id: string, input: ProcurementItemYearInput) =>
  post(`/api/members/procurement/items/${id}/year`, input)
export const createDay = (input: ProcurementDayInput) =>
  post('/api/members/procurement/days', input) as Promise<{ id: string }>
export const updateDay = (id: string, input: ProcurementDayInput) =>
  post(`/api/members/procurement/days/${id}`, input)
export const deleteDay = (id: string) => post(`/api/members/procurement/days/${id}/delete`, {})
export const saveCell = (input: ProcurementCellInput) => post('/api/members/procurement/cells', input)
export const setCellPurchased = (id: string, purchased: boolean) =>
  post(`/api/members/procurement/cells/${id}/purchased`, { purchased })

export function useProcurementMaster() {
  const { memberState } = useMemberState()
  return useQuery({
    queryKey: ['procurement-master'],
    queryFn: () => api<ProcurementMasterItem[]>('/api/members/procurement/master'),
    enabled: memberState?.status === 'member',
  })
}

export const saveSuggestions = (itemId: string, suggestions: ProcurementSuggestion[]) =>
  post(`/api/members/procurement/items/${itemId}/suggestions`, { suggestions })
export const seedDeliveryColumns = (year: number) =>
  post('/api/members/procurement/days/seed', { year }) as Promise<{ created: number }>
export const prefillFromMaster = (year: number) =>
  post('/api/members/procurement/days/prefill', { year }) as Promise<{ totals: number; cells: number }>
