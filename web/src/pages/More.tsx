import { useQueryClient } from '@tanstack/react-query'
import { BookOpen, FileText, Landmark, LogIn, LogOut, ScrollText, Wallet } from 'lucide-react'
import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signOut } from '@/lib/auth'
import { useMemberState } from '@/lib/member'

const memberSections = [
  { icon: Wallet, title: 'Collections & expenses', desc: 'Collector wallets, accounts summary' },
  { icon: Landmark, title: 'Budget', desc: 'Event budgets vs actuals' },
  { icon: ScrollText, title: 'Procurement', desc: 'Shopping lists and status' },
  { icon: FileText, title: 'Paperwork', desc: 'Police permission, PMC intimation' },
  { icon: BookOpen, title: 'Committee', desc: 'Portfolio distribution' },
]

export function More() {
  const queryClient = useQueryClient()
  const { session, memberState } = useMemberState()
  const me = memberState?.status === 'member' ? memberState.me : null

  const endSession = async () => {
    await signOut()
    await queryClient.invalidateQueries()
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">More</h1>

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
            <Button variant="outline" size="sm" onClick={endSession}>
              <LogOut /> Sign out
            </Button>
          </CardContent>
        </Card>
      ) : session ? (
        <Card>
          <CardHeader>
            <CardTitle>Signed in — membership pending</CardTitle>
            <CardDescription>
              {session.user.email} isn't on the member list yet.{' '}
              <Link to="/login" className="underline">
                Details
              </Link>
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Committee members</CardTitle>
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
        {memberSections.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className={me ? undefined : 'opacity-70'}>
            <CardHeader>
              <Icon className="size-5 text-matir" aria-hidden="true" />
              <CardTitle>{title}</CardTitle>
              <CardDescription>{me ? `${desc} — coming soon` : `${desc} — after sign in`}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
