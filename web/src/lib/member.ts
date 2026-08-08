import type { ApiResult, Me } from '@pujosamiti/shared'
import { useQuery } from '@tanstack/react-query'

import { API_URL } from '@/lib/api'
import { authHeaders, useSession } from '@/lib/auth'

/**
 * Signing in is necessary but not sufficient — the email must also be on the
 * member allowlist. 403 from /api/members/me is the "signed in, not a member"
 * state and deserves its own UI, so it can't go through the throwing api()
 * helper.
 */
export type MemberState = { status: 'member'; me: Me } | { status: 'not-member' }

async function fetchMemberState(): Promise<MemberState> {
  // Cookies where the browser allows them, bearer token everywhere else —
  // iOS/Safari drop the third-party cookie, so without the header this is the
  // one call that would report a signed-in member as "not a member".
  const res = await fetch(`${API_URL}/api/members/me`, {
    credentials: 'include',
    headers: authHeaders(),
  })
  if (res.status === 401 || res.status === 403) return { status: 'not-member' }
  if (!res.ok) throw new Error(`API ${res.status}: /api/members/me`)
  const body = (await res.json()) as ApiResult<Me>
  if (!body.ok) throw new Error(body.error)
  return { status: 'member', me: body.data }
}

/** Resolves the allowlist state; only queried while a session exists. */
export function useMemberState() {
  const { data: session, isPending: sessionPending } = useSession()
  const query = useQuery({
    queryKey: ['member-state', session?.user.id],
    queryFn: fetchMemberState,
    enabled: !!session,
  })
  return {
    session,
    sessionPending,
    memberState: query.data,
    memberPending: !!session && query.isPending,
  }
}
