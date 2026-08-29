import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, LogOut } from 'lucide-react'
import { Link } from 'react-router'

import { SignInCard, SignedInFunnel } from '@/components/RequireMember'
import { LogoSpinner } from '@/components/LogoSpinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

  // ── Signed in, on the allowlist ───────────────────────────────────────────
  if (session && memberState?.status === 'member') {
    const { me } = memberState
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <Card>
          <CardHeader>
            <CheckCircle2 className="size-6 text-primary" aria-hidden="true" />
            <CardTitle>স্বাগতম, {me.name}</CardTitle>
            <CardDescription>You're signed in as a samiti member.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              {me.image && (
                <img
                  src={me.image}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="size-10 rounded-full border"
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{me.email}</p>
                <div className="mt-1 flex gap-2">
                  <Badge>{me.role}</Badge>
                  {me.portfolio && <Badge variant="genda">{me.portfolio}</Badge>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link to="/membersonly">Member area</Link>
              </Button>
              <Button variant="outline" onClick={endSession}>
                <LogOut /> Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
