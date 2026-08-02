import type { MemberLite, PujoEvent, TaskInput, TaskPhase, TaskView } from '@pujosamiti/shared'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { useMemberState } from '@/lib/member'

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => api<PujoEvent[]>('/api/public/events'),
  })
}

export function useTasks(eventId: string | null) {
  const { memberState } = useMemberState()
  return useQuery({
    queryKey: ['tasks', eventId],
    queryFn: () => api<TaskView[]>(`/api/members/tasks?event=${encodeURIComponent(eventId!)}`),
    enabled: memberState?.status === 'member' && !!eventId,
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

export const createTask = (input: TaskInput) => post('/api/members/tasks', input)
export const updateTask = (id: string, input: TaskInput) => post(`/api/members/tasks/${id}`, input)
export const setTaskPhase = (id: string, phase: TaskPhase) => post(`/api/members/tasks/${id}/phase`, { phase })
export const setVolunteering = (id: string, join: boolean) => post(`/api/members/tasks/${id}/volunteer`, { join })
export const deleteTask = (id: string) => api(`/api/members/tasks/${id}`, { method: 'DELETE' })
