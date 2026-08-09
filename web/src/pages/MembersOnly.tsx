import { useQueryClient } from '@tanstack/react-query'
import { BookOpen, CalendarDays, Clock, Gift, LogIn, LogOut, NotebookText, Palette, ReceiptText, RefreshCw, Users, Wallet } from 'lucide-react'
import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/auth'
import { useMemberState } from '@/lib/member'
import { useOnboardingState } from '@/lib/onboarding'
import { Seo } from '@/components/Seo'

// tone = palette token washing the card background (icon wears it at full hue)
const memberSections = [
  { icon: NotebookText, title: 'Ledger', desc: 'Contributions, expenses and transfers', gate: 'Core members only', to: '/ledger', coreOnly: true, tone: 'durba' },
  { icon: Wallet, title: 'Wallets', desc: 'Season snapshot, budget and spend by category', gate: 'Members only', to: '/wallets', tone: 'genda' },
  { icon: Gift, title: 'Sponsorship', desc: 'The pledge board, item catalog', gate: 'Members only', to: '/sponsorship', tone: 'palash' },
  { icon: ReceiptText, title: 'Reimbursements', desc: 'Out-of-pocket claims and settlement', gate: 'Core members only', to: '/reimbursements', coreOnly: true, tone: 'sharat' },
  { icon: BookOpen, title: 'Puja Planning', desc: 'Task distribution', gate: 'Members only', to: '/tasks', tone: 'shiuli' },
  { icon: Users, title: 'Membership', desc: 'Members, pending activation, families', gate: 'Core members only', to: '/membership', coreOnly: true, tone: 'aparajita' },
  { icon: Clock, title: 'Nirghanto', desc: 'Durga Pujo time table workspace', gate: 'Core members only', to: '/nirghanto', coreOnly: true, tone: 'matir' },
  { icon: CalendarDays, title: 'Events', desc: 'The samiti events calendar', gate: 'Core members only', to: '/events', coreOnly: true, tone: 'sindoor' },
  { icon: Palette, title: 'Brand Colours', desc: 'The laal-paar shada identity — palette & rules', gate: 'Members only', to: '/brandcolours', tone: 'jaba' },
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
      <Seo title="Members Only" description="The samiti members area — ledger, wallets, sponsorship, planning." path="/membersonly" noindex />
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
              Sign in to see the ledger, budgets, sponsorship and task planning. Access is limited to
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
        {memberSections.map(({ icon: Icon, title, desc, gate, to, coreOnly, tone }) => {
          const unlocked = !!me && !!to && (!coreOnly || me.role !== 'member')
          const suffix = !me ? ` — ${gate}` : unlocked ? '' : coreOnly ? ' — Core members only' : ' — coming soon'
          const card = (
            <Card
              style={{ '--tone': `var(--${tone})` } as React.CSSProperties}
              className={cn(
                '[background:color-mix(in_srgb,var(--tone)_9%,var(--card))]',
                unlocked
                  ? 'h-full transition-colors hover:[background:color-mix(in_srgb,var(--tone)_16%,var(--card))]'
                  : 'opacity-70',
              )}
            >
              <CardHeader>
                <Icon className="size-5" style={{ color: `var(--${tone})` }} aria-hidden="true" />
                <CardTitle>{title}</CardTitle>
                <CardDescription>{`${desc}${suffix}`}</CardDescription>
              </CardHeader>
            </Card>
          )
          return unlocked ? (
            <Link key={title} to={to!}>
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
