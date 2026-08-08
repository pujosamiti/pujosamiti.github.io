import { useQueryClient } from '@tanstack/react-query'
import { Loader2, UserX } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'

import { ProfileForm } from '@/components/Onboarding'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signOut, useSession } from '@/lib/auth'
import { useMemberState } from '@/lib/member'
import { leavePortal, useMyProfile } from '@/lib/onboarding'
import { Seo } from '@/components/Seo'

/** Self-service profile: any registered signed-in person, member or pending. */
export function Profile() {
  const navigate = useNavigate()
  const { data: session, isPending: sessionPending } = useSession()
  const { data: profile, isPending: profilePending } = useMyProfile()
  const { memberState } = useMemberState()
  const isAdmin = memberState?.status === 'member' && memberState.me.role === 'admin'

  if (sessionPending || (session && profilePending)) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    )
  }
  // Not signed in, or never registered → the login/registration flow handles it
  if (!session || !profile) return <Navigate to="/login" replace />

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <Seo title="Profile" description="Your samiti profile." path="/profile" noindex />
      <ProfileForm
        email={session.user.email}
        initial={profile}
        title="Your profile"
        description="Kept up to date, this is how the samiti reaches you."
        submitLabel="Save changes"
        onSkip={() => navigate('/membersonly')}
      />
      {!isAdmin && <LeaveCard />}
    </div>
  )
}

function LeaveCard() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const leave = async () => {
    if (
      !confirm(
        'Leave the samiti portal? Your membership will be deactivated. You can sign in and register again anytime — an admin would then re-activate your membership.',
      )
    )
      return
    setBusy(true)
    setError(null)
    try {
      await leavePortal()
      await signOut() // leaving also ends the session
      await queryClient.invalidateQueries()
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'something went wrong')
      setBusy(false)
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-base">Leave the portal</CardTitle>
        <CardDescription>
          Deactivates your membership. Rejoining later is easy — sign in, confirm your details,
          and an admin re-activates you.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button variant="outline" className="self-start text-destructive" onClick={leave} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <UserX />} Leave the samiti portal
        </Button>
      </CardContent>
    </Card>
  )
}
