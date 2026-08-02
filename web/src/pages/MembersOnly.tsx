import { useQueryClient } from '@tanstack/react-query'
import { BookOpen, FileText, Landmark, LogIn, LogOut, RefreshCw, ScrollText, Wallet } from 'lucide-react'
import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signOut } from '@/lib/auth'
import { useMemberState } from '@/lib/member'
import { useOnboardingState } from '@/lib/onboarding'

const memberSections = [
  { icon: Wallet, title: 'Collections & expenses', desc: 'Collector wallets, accounts summary', gate: 'Members only' },
  { icon: Landmark, title: 'Budget', desc: 'Event budgets vs actuals', gate: 'Members only' },
  { icon: ScrollText, title: 'Procurement', desc: 'Shopping lists and status', gate: 'Core members only' },
  { icon: FileText, title: 'Paperwork', desc: 'Police permission, PMC intimation', gate: 'Core members only' },
  { icon: BookOpen, title: 'Core Members', desc: 'Task distribution', gate: 'Members only', to: '/tasks' },
]

export function MembersOnly() {
  const queryClient = useQueryClient()
  const { session, memberState } = useMemberState()
  const { data: onboarding } = useOnboardingState()
  const me = memberState?.status === 'member' ? memberState.me : null

  const endSession = async () => {
    await signOut()
    await queryClient.invalidateQueries()
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Members Only</h1>

      {me ? (
        <Card>
          <CardHeader>
            <CardTitle>স্বাগতম, {me.name}</CardTitle>
            <CardDescription>{me.email}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <div className="flex gap-2">
              <Badge>{me.role}</Badge>
              {me.portfolio && <Badge variant="genda">{me.portfolio}</Badge>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link to="/profile">Profile</Link>
              </Button>
              {me.role === 'admin' && (
                <Button size="sm" asChild>
                  <Link to="/admin">Admin</Link>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={endSession}>
                <LogOut /> Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : session ? (
        onboarding?.state === 'no_person' ? (
          <Card>
            <CardHeader>
              <CardTitle>One step left</CardTitle>
              <CardDescription>
                You're signed in as {session.user.email} —{' '}
                <Link to="/login" className="underline">
                  complete your profile
                </Link>{' '}
                to register with the samiti.
              </CardDescription>
              <Button variant="outline" size="sm" className="mt-2 self-start" onClick={endSession}>
                <LogOut /> Sign out
              </Button>
            </CardHeader>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Registration received — membership pending</CardTitle>
              <CardDescription>
                Thanks, {session.user.email}! Your profile is registered. An admin
                activates membership (usually after the subscription) — everything below unlocks
                then.
              </CardDescription>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries()}>
                  <RefreshCw /> Refresh status
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/profile">Edit profile</Link>
                </Button>
                <Button variant="outline" size="sm" onClick={endSession}>
                  <LogOut /> Sign out
                </Button>
              </div>
            </CardHeader>
          </Card>
        )
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Core Members</CardTitle>
            <CardDescription>
              Sign in to see budgets, accounts, procurement and paperwork. Access is limited to
              samiti members.
            </CardDescription>
            <Button className="mt-2 self-start" asChild>
              <Link to="/login">
                <LogIn /> Member sign in
              </Link>
            </Button>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {memberSections.map(({ icon: Icon, title, desc, gate, to }) => {
          const card = (
            <Card className={me ? (to ? 'h-full transition-colors hover:bg-accent' : undefined) : 'opacity-70'}>
              <CardHeader>
                <Icon className="size-5 text-matir" aria-hidden="true" />
                <CardTitle>{title}</CardTitle>
                <CardDescription>{me ? (to ? desc : `${desc} — coming soon`) : `${desc} — ${gate}`}</CardDescription>
              </CardHeader>
            </Card>
          )
          return me && to ? (
            <Link key={title} to={to}>
              {card}
            </Link>
          ) : (
            <div key={title}>{card}</div>
          )
        })}
      </div>
    </div>
  )
}
