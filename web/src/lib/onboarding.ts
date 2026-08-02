import type { OnboardingState, ProfileInput } from '@pujosamiti/shared'
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

export function saveProfile(input: ProfileInput) {
  return api<{ id: string }>('/api/onboarding/profile', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
}
