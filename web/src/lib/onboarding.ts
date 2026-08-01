import type {
  CreateFamilyInput,
  FamilySearchResult,
  JoinFamilyInput,
  OnboardingState,
} from '@pujosamiti/shared'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { useSession } from '@/lib/auth'

/** Funnel position for a signed-in user; drives the /login page states. */
export function useOnboardingState() {
  const { data: session } = useSession()
  return useQuery({
    queryKey: ['onboarding-state', session?.user.id],
    queryFn: () => api<OnboardingState>('/api/onboarding/status'),
    enabled: !!session,
  })
}

export function searchFamilies(q: string) {
  return api<FamilySearchResult[]>(`/api/onboarding/families?q=${encodeURIComponent(q)}`)
}

export function createFamily(input: CreateFamilyInput) {
  return api<{ familyId: string }>('/api/onboarding/family', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function requestToJoin(input: JoinFamilyInput) {
  return api<{ requested: true }>('/api/onboarding/join', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
}
