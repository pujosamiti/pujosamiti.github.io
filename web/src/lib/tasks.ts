import type { MemberLite, PujoEvent, TaskMasterInput, TaskView, TaskYearInput } from '@pujosamiti/shared'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { useMemberState } from '@/lib/member'

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => api<PujoEvent[]>('/api/public/events'),
  })
}

export function useTasks(year: number | null) {
  const { memberState } = useMemberState()
  return useQuery({
    queryKey: ['tasks', year],
    queryFn: () => api<TaskView[]>(`/api/members/tasks?year=${year}`),
    enabled: memberState?.status === 'member' && !!year,
  })
}

export function useMembersLite() {
  const { memberState } = useMemberState()
  return useQuery({
    queryKey: ['members-lite'],
    queryFn: () => api<MemberLite[]>('/api/members/people'),
    enabled: memberState?.status === 'member',
  })
}

const post = (path: string, body: unknown) =>
  api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

export const createMasterTask = (input: TaskMasterInput) => post('/api/members/tasks', input) as Promise<{ id: string }>
export const updateMasterTask = (id: string, input: TaskMasterInput) => post(`/api/members/tasks/${id}`, input)
export const saveTaskYear = (id: string, input: TaskYearInput) => post(`/api/members/tasks/${id}/year`, input)
export const setVolunteering = (id: string, year: number, join: boolean) =>
  post(`/api/members/tasks/${id}/volunteer`, { year, join })
