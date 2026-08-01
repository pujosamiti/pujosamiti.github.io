import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Hourglass, Loader2, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import { Onboarding } from '@/components/Onboarding'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signInWithGoogle, signOut } from '@/lib/auth'
import { useMemberState } from '@/lib/member'
import { useOnboardingState } from '@/lib/onboarding'

/** Signed-in but not a member: route to the right funnel stage. */
function SignedInFunnel({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const { data: ob, isPending } = useOnboardingState()

  if (isPending || !ob) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    )
  }

  if (ob.state === 'no_person') {
    return (
      <>
        <Onboarding email={email} />
        <Button variant="outline" className="self-start" onClick={onSignOut}>
          <LogOut /> Sign out
        </Button>
      </>
    )
  }

  const copy =
    ob.state === 'request_pending'
      ? {
          title: 'Request sent',
          body: `Your request to join the ${ob.familyName} family is with the committee admins. You'll get access as soon as it's approved — check back here.`,
        }
      : {
          title: 'Registration received',
          body: `Your family (${'familyName' in ob ? ob.familyName : ''}) is registered but membership isn't active yet. A committee admin confirms membership (usually after the subscription) — then everything unlocks here.`,
        }

  return (
    <Card>
      <CardHeader>
        <Hourglass className="size-6 text-shiuli" aria-hidden="true" />
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>
          Signed in as <span className="font-medium">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{copy.body}</p>
        <Button variant="outline" className="self-start" onClick={onSignOut}>
          <LogOut /> Sign out
        </Button>
      </CardContent>
    </Card>
  )
}

/** Google's "G" — brand guidelines want the multicolour mark on sign-in buttons. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

export function Login() {
  const [params] = useSearchParams()
  const queryClient = useQueryClient()
  const { session, sessionPending, memberState, memberPending } = useMemberState()
  const [redirecting, setRedirecting] = useState(false)
  const oauthError = params.get('error')

  const startGoogle = async () => {
    setRedirecting(true)
    try {
      await signInWithGoogle()
    } catch {
      setRedirecting(false)
    }
  }

  const endSession = async () => {
    await signOut()
    await queryClient.invalidateQueries()
  }

  if (sessionPending || memberPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
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
                <Link to="/more">Member area</Link>
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
      <Card>
        <CardHeader>
          <CardTitle>Member sign in</CardTitle>
          <CardDescription>
            Budgets, accounts, procurement and paperwork — for samiti families. Signing in only
            shares your name and email with the samiti.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {oauthError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
              <p>
                Google sign-in didn't complete — it was cancelled or timed out. Please try again.
              </p>
            </div>
          )}
          <Button onClick={startGoogle} disabled={redirecting} className="justify-center">
            {redirecting ? <Loader2 className="animate-spin" /> : <GoogleMark />}
            Continue with Google
          </Button>
          <Button variant="outline" disabled className="justify-center">
            Facebook — coming soon
          </Button>
          <p className="text-xs text-muted-foreground">
            Anyone can sign in, but member content unlocks only for emails on the samiti's member
            list. No password is ever stored by the samiti.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
