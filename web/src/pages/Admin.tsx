import type { AdminFamily, FamilyTier, JoinRequestView } from '@pujosamiti/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, ShieldCheck, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useMemberState } from '@/lib/member'

const TIERS: FamilyTier[] = ['non_member', 'member', 'core']
const TIER_LABEL: Record<FamilyTier, string> = {
  non_member: 'Non-member',
  member: 'Member',
  core: 'Core',
}

export function Admin() {
  const { memberState, memberPending, sessionPending } = useMemberState()
  const me = memberState?.status === 'member' ? memberState.me : null

  if (sessionPending || memberPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    )
  }
  if (me?.role !== 'admin') {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Admins only</CardTitle>
          <CardDescription>This area is for committee admins.</CardDescription>
        </CardHeader>
      </Card>
    )
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-6 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-bold">Membership admin</h1>
      </div>
      <JoinRequests />
      <Families />
    </div>
  )
}

function JoinRequests() {
  const queryClient = useQueryClient()
  const { data: requests, isPending } = useQuery({
    queryKey: ['admin-join-requests'],
    queryFn: () => api<JoinRequestView[]>('/api/admin/join-requests'),
  })
  const decide = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      api(`/api/admin/join-requests/${id}/decide`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      }),
    onSuccess: () => queryClient.invalidateQueries(),
  })

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Join requests</h2>
      {isPending ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
      ) : !requests?.length ? (
        <p className="text-sm text-muted-foreground">No pending requests.</p>
      ) : (
        requests.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {r.displayName} <span className="text-muted-foreground">({r.email})</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  wants to join <span className="font-medium text-foreground">{r.familyName}</span>
                  {r.note && <> — “{r.note}”</>}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => decide.mutate({ id: r.id, action: 'approve' })}
                  disabled={decide.isPending}
                >
                  <Check /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => decide.mutate({ id: r.id, action: 'reject' })}
                  disabled={decide.isPending}
                >
                  <X /> Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </section>
  )
}

function Families() {
  const queryClient = useQueryClient()
  const { data: families, isPending } = useQuery({
    queryKey: ['admin-families'],
    queryFn: () => api<AdminFamily[]>('/api/admin/families'),
  })
  const setTier = useMutation({
    mutationFn: ({ id, tier }: { id: string; tier: FamilyTier }) =>
      api(`/api/admin/families/${id}/tier`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tier }),
      }),
    onSuccess: () => queryClient.invalidateQueries(),
  })

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Families</h2>
      {isPending ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
      ) : (
        families?.map((f) => (
          <Card key={f.id} className={f.isActive ? undefined : 'opacity-60'}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">
                  {f.name}
                  {f.society && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">{f.society}</span>
                  )}
                </CardTitle>
                <div className="flex gap-1">
                  {TIERS.map((t) => (
                    <Button
                      key={t}
                      size="sm"
                      variant={f.tier === t ? (t === 'core' ? 'default' : 'secondary') : 'outline'}
                      onClick={() => f.tier !== t && setTier.mutate({ id: f.id, tier: t })}
                      disabled={setTier.isPending}
                    >
                      {TIER_LABEL[t]}
                    </Button>
                  ))}
                </div>
              </div>
              <CardDescription>
                {f.people.length ? (
                  f.people.map((p) => (
                    <span key={p.id} className="mr-3">
                      {p.displayName}
                      {p.isAdmin && (
                        <Badge className="ml-1 align-middle" variant="outline">
                          admin
                        </Badge>
                      )}
                      {!p.email && <span className="text-muted-foreground"> (no login)</span>}
                    </span>
                  ))
                ) : (
                  <span>No people yet</span>
                )}
              </CardDescription>
            </CardHeader>
          </Card>
        ))
      )}
    </section>
  )
}
