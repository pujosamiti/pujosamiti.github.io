import { useQueryClient } from '@tanstack/react-query'
import logoBw from '@/assets/logo-bw.png'
import { AlertTriangle, Hourglass, Loader2, LogOut, RefreshCw } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Outlet, useLocation, useSearchParams } from 'react-router'

import { ProfileForm } from '@/components/Onboarding'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signInWithGoogle, signOut } from '@/lib/auth'
import { useMemberState } from '@/lib/member'
import { useMyProfile, useOnboardingState } from '@/lib/onboarding'

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

/**
 * The samiti's sign-in card — the one place the "Continue with Google" flow
 * lives. `next` is the in-site path to land back on after Google; a gated
 * page passes its own URL so a shared link drops the person right where they
 * were headed.
 */
export function SignInCard({
  next = '/login',
  title = 'Member sign in',
  description = 'The ledger, wallets, sponsorship and task planning — for samiti families. Signing in only shares your name and email with the samiti.',
}: {
  next?: string
  title?: string
  description?: string
}) {
  const [params] = useSearchParams()
  const [redirecting, setRedirecting] = useState(false)
  const oauthError = params.get('error')

  const startGoogle = async () => {
    setRedirecting(true)
    try {
      await signInWithGoogle(next)
    } catch {
      setRedirecting(false)
    }
  }

  return (
    <>
      <img
        src={logoBw}
        alt=""
        aria-hidden="true"
        width={112}
        height={112}
        className="mx-auto mt-2 size-28 opacity-80"
      />
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
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
    </>
  )
}

/** Signed-in but not a member: route to the right funnel stage. */
export function SignedInFunnel({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const queryClient = useQueryClient()
  const onRefresh = () => queryClient.invalidateQueries()
  const { data: ob, isPending } = useOnboardingState()
  // Someone who left and is rejoining still has their old profile — pre-fill it
  const { data: oldProfile, isPending: profilePending } = useMyProfile(ob?.state === 'no_person')

  if (isPending || !ob || (ob.state === 'no_person' && profilePending)) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    )
  }

  if (ob.state === 'no_person') {
    return (
      <>
        <ProfileForm email={email} initial={oldProfile} />
        <Button variant="outline" className="self-start" onClick={onSignOut}>
          <LogOut /> Sign out
        </Button>
      </>
    )
  }

  return (
    <Card>
      <CardHeader>
        <Hourglass className="size-6 text-shiuli" aria-hidden="true" />
        <CardTitle>Registration received</CardTitle>
        <CardDescription>
          Signed in as <span className="font-medium">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Your profile is registered but membership isn't active yet. An admin confirms
          membership (usually after the subscription) — then everything unlocks here.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw /> Refresh status
          </Button>
          <Button variant="outline" onClick={onSignOut}>
            <LogOut /> Sign out
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Route gate for member-only URLs. A shared link to /ledger (or any gated
 * page) must never dead-end: signed-out visitors get the sign-in card and
 * come back to the same URL after Google; signed-in non-members get the
 * onboarding funnel. Only actual members reach the page — which keeps each
 * page's own role checks meaning exactly what they say ("core members only"
 * is now always about tier, never about being signed out).
 *
 * Use as a layout route (children render via <Outlet/>):
 *   <Route element={<RequireMember />}> …gated routes… </Route>
 * or as a wrapper: <RequireMember><Page/></RequireMember>.
 */
export function RequireMember({ children }: { children?: ReactNode }) {
  const location = useLocation()
  const queryClient = useQueryClient()
  const { session, sessionPending, memberState, memberPending } = useMemberState()

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

  if (!session) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <SignInCard next={location.pathname} />
      </div>
    )
  }

  if (memberState?.status !== 'member') {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <SignedInFunnel email={session.user.email} onSignOut={endSession} />
      </div>
    )
  }

  return children ?? <Outlet />
}
