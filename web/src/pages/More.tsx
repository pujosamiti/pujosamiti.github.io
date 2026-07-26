import { BookOpen, FileText, Landmark, LogIn, ScrollText, Wallet } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const memberSections = [
  { icon: Wallet, title: 'Collections & expenses', desc: 'Collector wallets, accounts summary' },
  { icon: Landmark, title: 'Budget', desc: 'Event budgets vs actuals' },
  { icon: ScrollText, title: 'Procurement', desc: 'Shopping lists and status' },
  { icon: FileText, title: 'Paperwork', desc: 'Police permission, PMC intimation' },
  { icon: BookOpen, title: 'Committee', desc: 'Portfolio distribution' },
]

export function More() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">More</h1>

      <Card>
        <CardHeader>
          <CardTitle>Committee members</CardTitle>
          <CardDescription>
            Sign in to see budgets, accounts, procurement and paperwork. Access is limited to
            samiti members.
          </CardDescription>
          <Button className="mt-2 self-start" asChild>
            {/* better-auth social sign-in kicks off at the Worker */}
            <Link to="/login">
              <LogIn /> Member sign in
            </Link>
          </Button>
        </CardHeader>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {memberSections.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="opacity-70">
            <CardHeader>
              <Icon className="size-5 text-matir" aria-hidden="true" />
              <CardTitle>{title}</CardTitle>
              <CardDescription>{desc} — after sign in</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
