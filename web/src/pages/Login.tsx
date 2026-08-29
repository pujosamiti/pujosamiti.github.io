import { useQueryClient } from '@tanstack/react-query'
import { Navigate } from 'react-router'

import { SignInCard, SignedInFunnel } from '@/components/RequireMember'
import { LogoSpinner } from '@/components/LogoSpinner'
import { signOut } from '@/lib/auth'
import { useMemberState } from '@/lib/member'
import { Seo } from '@/components/Seo'

export function Login() {
  const queryClient = useQueryClient()
  const { session, sessionPending, memberState, memberPending } = useMemberState()

  const endSession = async () => {
    await signOut()
    await queryClient.invalidateQueries()
  }

  if (sessionPending || memberPending) {
    return (
      <div className="flex justify-center py-16">
        <LogoSpinner />
      </div>
    )
  }

  // ── Signed in, on the allowlist: nothing to do here — go to the member area
  if (session && memberState?.status === 'member') {
    return <Navigate to="/membersonly" replace />
  }

  // ── Signed in, but not (yet) a member: the onboarding funnel ──────────────
  if (session) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <SignedInFunnel email={session.user.email} onSignOut={endSession} />
      </div>
    )
  }

  // ── Signed out ────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <Seo title="Member sign in" description="Sign in to the samiti members area." path="/login" noindex />
      <SignInCard />
    </div>
  )
}
