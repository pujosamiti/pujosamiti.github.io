import type {
  CulturalEvening,
  CulturalItem,
  CulturalItemInput,
  CulturalItemType,
  CulturalPerformers,
} from '@pujosamiti/shared'
import { canRunCulture, CULTURAL_ITEM_TYPES, CULTURAL_PERFORMERS } from '@pujosamiti/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronLeft, ChevronRight, Clock, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'

import { BackLink } from '@/components/BackLink'
import { Field, inputCls } from '@/components/form'
import { LogoSpinner } from '@/components/LogoSpinner'
import { PageTitle } from '@/components/PageTitle'
import { SearchSelect } from '@/components/SearchSelect'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useMemberState } from '@/lib/member'
import { PAGE_TINT, tint } from '@/lib/tint'
import { cn } from '@/lib/utils'

/**
 * Cultural Function — the evening programmes of the pujo. The evenings are
 * the Days of the Pujo an admin has marked (on the Nirghanto page), so their
 * names and dates come from the database and follow the nirghanto. The
 * page is the cultural admins' alone (canRunCulture: core members with the
 * flag, and admins) — they read each evening's running order and add, edit,
 * delete and arrange its items. Other members don't see it (no card, and the
 * API refuses them).
 */

/** "Sat, 17 Oct" */
const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

/** "Sat, 17 Oct 2026" */
const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

/**
 * A tithi that spans two dates is a second Puja Day, "Ashtami · Day 2" — its
 * evening is that tithi's second: "Ashtami Sondhya 2", "Ashtami Evening 2".
 */
const eveningName = (e: CulturalEvening, word: 'Sondhya' | 'Evening') => {
  const [, tithi, n] = e.labelEn.match(/^(.+) · Day (\d+)$/) ?? []
  return tithi ? `${tithi} ${word} ${n}` : `${e.labelEn} ${word}`
}

/** "Saptami Sondhya", "Ashtami Sondhya 2" */
const sondhya = (e: CulturalEvening) => eveningName(e, 'Sondhya')

/** Back to an evening's schedule. */
const eveningHref = (pujaDayId: string) => `/cultural/?day=${pujaDayId}`

const typeLabel = (i: Pick<CulturalItem, 'itemType' | 'itemTypeOther'>) =>
  i.itemType === 'others' && i.itemTypeOther ? i.itemTypeOther : CULTURAL_ITEM_TYPES[i.itemType]


/** The active pujo's evenings with a cultural programme, in the order of the pujo. */
const useEvenings = (enabled: boolean) =>
  useQuery({
    queryKey: ['cultural-evenings'],
    queryFn: () => api<CulturalEvening[]>('/api/members/cultural/evenings'),
    enabled,
  })

const useEvening = (pujaDayId: string | null) =>
  useQuery({
    queryKey: ['cultural', pujaDayId],
    queryFn: () => api<CulturalItem[]>(`/api/members/cultural?day=${pujaDayId}`),
    enabled: !!pujaDayId,
  })

/**
 * The list and the form hand over to each other — Save sits at the foot of a
 * long form, an item's pencil can be far down the list — so each opens at
 * its top rather than where the last page was left.
 */
const useTopOnOpen = () =>
  useEffect(() => {
    // a block body: an effect may return only a cleanup, and scrollTo can return a promise
    window.scrollTo(0, 0)
  }, [])

/** The page's gate: cultural admins only (canRunCulture). */
function useMe() {
  const { memberState, memberPending, sessionPending } = useMemberState()
  const me = memberState?.status === 'member' ? memberState.me : null
  return { me, pending: sessionPending || memberPending }
}

function CulturalAdminsOnlyCard() {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Cultural admins only</CardTitle>
        <CardDescription>The cultural programme is run by the admins and the cultural admins.</CardDescription>
      </CardHeader>
    </Card>
  )
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <LogoSpinner />
    </div>
  )
}

export function Cultural() {
  const { me, pending } = useMe()
  useTopOnOpen()
  const [params, setParams] = useSearchParams()
  const allowed = !!me && canRunCulture(me)
  const evenings = useEvenings(allowed)
  // the evening in the address, else the first of the pujo
  const evening = evenings.data?.find((e) => e.pujaDayId === params.get('day')) ?? evenings.data?.[0] ?? null
  const items = useEvening(allowed && evening ? evening.pujaDayId : null)

  if (pending) return <Spinner />
  if (!allowed) return <CulturalAdminsOnlyCard />

  return (
    <div className="flex flex-col gap-4">
      <Seo title="Cultural Function" description="The evening programmes of the pujo." path="/cultural" noindex />
      <BackLink />
      <PageTitle tint={PAGE_TINT.cultural}>Cultural Function</PageTitle>

      {evenings.error && <p className="text-sm text-destructive">Failed to load: {evenings.error.message}</p>}
      {evenings.isPending ? (
        <Spinner />
      ) : !evening ? (
        <p className="text-sm text-muted-foreground">
          No cultural evenings are set for this year's pujo yet. An admin marks them in the Days of the Pujo on the
          Nirghanto page.
        </p>
      ) : (
        <>
          <EveningSwitch
            evenings={evenings.data ?? []}
            value={evening.pujaDayId}
            onChange={(id) => setParams({ day: id }, { replace: true })}
          />
          {items.error && <p className="text-sm text-destructive">Failed to load: {items.error.message}</p>}
          {items.isPending ? <Spinner /> : items.data && <Schedule evening={evening} items={items.data} />}
        </>
      )}
    </div>
  )
}

/**
 * The evenings side by side: one tap between them, all always in view. The
 * chosen one is filled in sharat blue — a choice, like the Excel | PDF
 * switch — so it reads apart from the crimson Add entry, the action. Up to
 * three sit in one row; four or more go two to a row on a phone, and the
 * switch widens from tablet width so the row still fits.
 */
function EveningSwitch({ evenings, value, onChange }: { evenings: CulturalEvening[]; value: string; onChange: (pujaDayId: string) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label="Evening"
      className={cn(
        'grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] rounded-xl border bg-card p-1 sm:grid-cols-[repeat(var(--cols-sm),minmax(0,1fr))]',
        evenings.length > 2 ? 'sm:max-w-2xl' : 'sm:max-w-md',
      )}
      style={{ '--cols': evenings.length > 3 ? 2 : evenings.length, '--cols-sm': evenings.length } as React.CSSProperties}
    >
      {evenings.map((e) => (
        <button
          key={e.pujaDayId}
          type="button"
          role="radio"
          aria-checked={value === e.pujaDayId}
          onClick={() => onChange(e.pujaDayId)}
          className={cn(
            'flex min-h-11 flex-col items-center justify-center rounded-lg px-2 py-1.5 transition-colors',
            value === e.pujaDayId ? 'bg-sharat text-sharat-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          <span className="text-sm font-semibold">{sondhya(e)}</span>
          <span className="text-xs opacity-85">{shortDate(e.date)}</span>
        </button>
      ))}
    </div>
  )
}

type Direction = 'up' | 'down'
/** The list is drawn twice — a table from tablet width, rows on a phone — so an arrow says which. */
type View = 'table' | 'rows'

/** Performers, short enough for a table cell or a phone row (the form keeps the full words). */
const PERFORMERS_SHORT: Record<CulturalItem['performers'], string> = { kids: 'Kids', adults: 'Adults', both: 'Kids + Adults' }

function Schedule({ evening, items }: { evening: CulturalEvening; items: CulturalItem[] }) {
  const queryClient = useQueryClient()
  const key = ['cultural', evening.pujaDayId]
  const [error, setError] = useState<string | null>(null)
  // phones show the arrows only while arranging, so reading the programme stays calm
  const [arranging, setArranging] = useState(false)
  // After a move re-renders the list, focus goes back to the arrow that was pressed,
  // so repeated taps or ↑ / ↓ keys keep moving the same item.
  const refocus = useRef<{ id: string; direction: Direction; view: View } | null>(null)
  useEffect(() => {
    const f = refocus.current
    if (!f) return
    refocus.current = null
    document.querySelector<HTMLButtonElement>(`[data-move="${f.view}:${f.id}:${f.direction}"]`)?.focus()
  }, [items])
  // The running order moves on screen at every tap; the saves queue behind it, one at a time
  // (scope), so quick taps land in the order they were made. The list is refetched once the
  // last queued save is done — or at once if one fails, which puts the true order back.
  const move = useMutation({
    mutationKey: ['cultural-move'],
    scope: { id: 'cultural-move' },
    mutationFn: ({ id, direction }: { id: string; direction: Direction }) =>
      api(`/api/members/cultural/${id}/move`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ direction }),
      }),
    onError: (err, { id }) => {
      const name = items.find((i) => i.id === id)?.itemName ?? 'the item'
      setError(`Couldn't move “${name}”: ${err instanceof Error ? err.message : 'failed'}`)
      queryClient.invalidateQueries({ queryKey: key })
    },
    onSuccess: () => {
      // this save still counts as running; refetch only when it is the last in the queue
      if (queryClient.isMutating({ mutationKey: ['cultural-move'] }) <= 1) queryClient.invalidateQueries({ queryKey: key })
    },
  })
  const onMove = (id: string, direction: Direction, view: View) => {
    setError(null)
    void queryClient.cancelQueries({ queryKey: key })
    queryClient.setQueryData<CulturalItem[]>(key, (cur) => {
      if (!cur) return cur
      const next = [...cur]
      const from = next.findIndex((i) => i.id === id)
      const to = direction === 'up' ? from - 1 : from + 1
      if (from < 0 || to < 0 || to >= next.length) return cur
      ;[next[from], next[to]] = [next[to]!, next[from]!]
      return next
    })
    refocus.current = { id, direction, view }
    move.mutate({ id, direction })
  }
  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/members/cultural/${id}/delete`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
    onError: (err) => setError(err instanceof Error ? err.message : 'failed'),
  })
  const onDelete = (item: CulturalItem) => {
    if (confirm(`Delete “${item.itemName}” from the programme?`)) {
      setError(null)
      remove.mutate(item.id)
    }
  }
  const canReorder = items.length > 1
  // duration is optional: total what is known, and say when it is not everything
  const timed = items.filter((i) => i.durationMin != null)
  const total = timed.reduce((sum, i) => sum + (i.durationMin ?? 0), 0)
  const arrows = (item: CulturalItem, n: number, view: View) => (
    // a tap moves the item one place; once an arrow has focus the keyboard's ↑ / ↓ keys do too
    <div role="group" aria-label={`Move ${item.itemName}`} className="inline-flex rounded-lg border bg-card/60">
      {(['up', 'down'] as const).map((d) => (
        <MoveArrow
          key={d}
          item={item}
          view={view}
          direction={d}
          first={n === 0}
          last={n === items.length - 1}
          onMove={(dir) => onMove(item.id, dir, view)}
        />
      ))}
    </div>
  )

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-lg font-semibold">
          {evening.labelBn && <span className="text-shiuli">{evening.labelBn} · </span>}
          {eveningName(evening, 'Evening')}
        </h2>
        <p className="text-sm text-matir">{longDate(evening.date)}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items for this evening yet.</p>
        ) : (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-4" aria-hidden="true" />
            {items.length} {items.length === 1 ? 'item' : 'items'}
            {timed.length === items.length
              ? ` · ${total} min in all`
              : timed.length > 0
                ? ` · ${total} min for the ${timed.length} with a duration`
                : ''}
          </p>
        )}
        <div className="flex gap-2">
          {canReorder && (
            // phones only: the table always shows its arrows
            <Button variant="outline" className="md:hidden" aria-pressed={arranging} onClick={() => setArranging((a) => !a)}>
              {arranging ? <Check /> : <ArrowUpDown />} {arranging ? 'Done' : 'Arrange'}
            </Button>
          )}
          {/* the page's one action: adds to the evening on screen */}
          <Button asChild>
            <Link to={`/cultural/new/${evening.pujaDayId}/`} aria-label={`Add entry for ${sondhya(evening)}`}>
              <Plus /> Add entry
            </Link>
          </Button>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {items.length > 0 && (
        <Card {...tint(PAGE_TINT.cultural, '0%')} className={cn(tint(PAGE_TINT.cultural).className, 'overflow-hidden py-0')}>
          {/* tablet and up: the running order as a table, one line per item */}
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="w-10 py-2 pl-4 pr-2 text-right font-medium">#</th>
                <th scope="col" className="px-2 py-2 font-medium">Item</th>
                <th scope="col" className="px-2 py-2 font-medium">Type</th>
                <th scope="col" className="px-2 py-2 font-medium">Performers</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Min</th>
                <th scope="col" className="px-2 py-2 font-medium">Participants</th>
                <th scope="col" className="py-2 pl-2 pr-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((i, n) => (
                <tr key={i.id} className="border-b last:border-b-0 hover:bg-accent/50">
                  <td className="py-1 pl-4 pr-2 text-right font-semibold tabular-nums text-muted-foreground">{n + 1}</td>
                  <td className="px-2 py-1 font-medium">{i.itemName}</td>
                  <td className="whitespace-nowrap px-2 py-1">{typeLabel(i)}</td>
                  <td className="whitespace-nowrap px-2 py-1">{PERFORMERS_SHORT[i.performers]}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{i.durationMin ?? <span className="text-muted-foreground">—</span>}</td>
                  <td className="max-w-56 px-2 py-1 text-muted-foreground">
                    <span className="line-clamp-2" title={i.participants ?? undefined}>
                      {i.participants ?? '—'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-1 pl-2 pr-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      {canReorder && arrows(i, n, 'table')}
                      <Button size="icon" variant="ghost" asChild>
                        <Link to={`/cultural/${i.id}/edit/`} aria-label={`Edit ${i.itemName}`}>
                          <Pencil />
                        </Link>
                      </Button>
                      <Button size="icon" variant="ghost" aria-label={`Delete ${i.itemName}`} disabled={remove.isPending} onClick={() => onDelete(i)}>
                        <Trash2 className="text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* a phone: the running order as rows, two lines each; tap a row to edit it */}
          <ol className="divide-y md:hidden">
            {items.map((i, n) => {
              const editable = !arranging
              const body = (
                <>
                  <span className="flex items-baseline gap-2">
                    <span className="line-clamp-2 font-medium">{i.itemName}</span>
                    {!arranging && i.durationMin != null && (
                      <span className="ml-auto shrink-0 text-sm tabular-nums text-muted-foreground">{i.durationMin} min</span>
                    )}
                  </span>
                  <span className="line-clamp-1 text-xs text-muted-foreground">
                    {typeLabel(i)} · {PERFORMERS_SHORT[i.performers]}
                    {arranging && i.durationMin != null && ` · ${i.durationMin} min`}
                    {i.participants && ` · ${i.participants}`}
                  </span>
                </>
              )
              return (
                <li key={i.id} className="flex min-h-14 items-center gap-3 px-3 py-2">
                  <span className="w-5 shrink-0 text-right text-sm font-semibold tabular-nums text-muted-foreground">{n + 1}</span>
                  {editable ? (
                    <Link to={`/cultural/${i.id}/edit/`} className="flex min-w-0 flex-1 items-center gap-2" aria-label={`Edit ${i.itemName}`}>
                      <span className="flex min-w-0 flex-1 flex-col">{body}</span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </Link>
                  ) : (
                    <span className="flex min-w-0 flex-1 flex-col">{body}</span>
                  )}
                  {arranging && canReorder && arrows(i, n, 'rows')}
                </li>
              )
            })}
          </ol>
        </Card>
      )}
    </section>
  )
}

function MoveArrow({
  item,
  view,
  direction,
  first,
  last,
  onMove,
}: {
  item: CulturalItem
  view: View
  direction: Direction
  first: boolean
  last: boolean
  onMove: (direction: Direction) => void
}) {
  const Icon = direction === 'up' ? ArrowUp : ArrowDown
  const can = (dir: Direction) => (dir === 'up' ? !first : !last)
  return (
    <Button
      size="icon"
      variant="ghost"
      data-move={`${view}:${item.id}:${direction}`}
      aria-label={`Move ${item.itemName} ${direction}`}
      // at an end the arrow greys out but stays focusable (aria-disabled, not disabled),
      // so keyboard focus is never dropped
      aria-disabled={!can(direction)}
      className="aria-disabled:cursor-default aria-disabled:opacity-35 aria-disabled:hover:bg-transparent"
      onClick={() => can(direction) && onMove(direction)}
      onKeyDown={(e) => {
        // the keyboard's own arrows, once an arrow button has focus
        const dir: Direction | null = e.key === 'ArrowUp' ? 'up' : e.key === 'ArrowDown' ? 'down' : null
        if (!dir) return
        e.preventDefault() // not the page's scroll
        if (can(dir)) onMove(dir)
      }}
    >
      <Icon />
    </Button>
  )
}

type FormState = Omit<CulturalItemInput, 'durationMin' | 'itemType' | 'performers'> & {
  durationMin: string
  itemType: CulturalItemType | null
  performers: CulturalPerformers | null
}

const blank = (pujaDayId: string): FormState => ({
  pujaDayId,
  itemName: '',
  itemType: null,
  itemTypeOther: null,
  performers: null,
  durationMin: '',
  participants: null,
})

const fromItem = (i: CulturalItem): FormState => ({
  pujaDayId: i.pujaDayId,
  itemName: i.itemName,
  itemType: i.itemType,
  itemTypeOther: i.itemTypeOther,
  performers: i.performers,
  durationMin: i.durationMin == null ? '' : String(i.durationMin),
  participants: i.participants,
})

/** /cultural/new/:day adds an item to that evening; /cultural/:id/edit changes one. Save returns to the evening's schedule. */
export function CulturalForm() {
  const { me, pending } = useMe()
  useTopOnOpen()
  const { day, id } = useParams()
  const core = !!me && canRunCulture(me)
  const evenings = useEvenings(core)
  const { data: item, error } = useQuery({
    queryKey: ['cultural-item', id],
    queryFn: () => api<CulturalItem>(`/api/members/cultural/${id}`),
    enabled: !!id && core,
  })

  if (pending) return <Spinner />
  if (!core) return <CulturalAdminsOnlyCard />
  if (evenings.error) return <p className="text-sm text-destructive">Failed to load: {evenings.error.message}</p>
  if (!evenings.data) return <Spinner />
  // only the active pujo's evenings take entries; past programmes are the record
  const findEvening = (pujaDayId: string) => evenings.data.find((e) => e.pujaDayId === pujaDayId)
  if (id) {
    if (error) return <p className="text-sm text-destructive">Failed to load: {error.message}</p>
    if (!item) return <Spinner />
    const evening = findEvening(item.pujaDayId)
    if (!evening) return <p className="text-sm text-destructive">This item is on a past programme, which no longer changes.</p>
    return <ItemForm initial={fromItem(item)} evening={evening} itemId={item.id} createdByName={item.createdByName} />
  }
  const evening = day ? findEvening(day) : undefined
  if (!evening) return <p className="text-sm text-destructive">That evening has no cultural programme this year.</p>
  return <ItemForm initial={blank(evening.pujaDayId)} evening={evening} createdByName={me.name} />
}

function ItemForm({
  initial,
  evening,
  itemId,
  createdByName,
}: {
  initial: FormState
  evening: CulturalEvening
  itemId?: string
  createdByName: string
}) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(initial)
  const [error, setError] = useState<string | null>(null)
  const [tried, setTried] = useState(false)
  const set = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }))
  const back = eveningHref(evening.pujaDayId)

  // optional: blank is fine, but a number given must be whole minutes
  const duration = form.durationMin.trim() === '' ? null : Number(form.durationMin)
  const durationBad = duration !== null && (!Number.isInteger(duration) || duration < 1)
  const missing =
    !form.itemName.trim() ||
    form.itemType === null ||
    (form.itemType === 'others' && !form.itemTypeOther?.trim()) ||
    form.performers === null

  const save = useMutation({
    mutationFn: () => {
      const body: CulturalItemInput = {
        ...form,
        itemType: form.itemType!,
        itemTypeOther: form.itemType === 'others' ? form.itemTypeOther : null,
        performers: form.performers!,
        durationMin: duration,
      }
      return api(itemId ? `/api/members/cultural/${itemId}` : '/api/members/cultural', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cultural'] })
      await queryClient.invalidateQueries({ queryKey: ['cultural-item'] })
      navigate(back)
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'failed'),
  })
  // Delete lives here too: on a phone the list's rows open this form and carry no bin of their own
  const remove = useMutation({
    mutationFn: () => api(`/api/members/cultural/${itemId}/delete`, { method: 'POST' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cultural'] })
      navigate(back)
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'failed'),
  })
  const busy = save.isPending || remove.isPending

  const opt = (v: string | null) => v ?? ''
  const textOrNull = (v: string) => v || null

  return (
    <div className="flex flex-col gap-4">
      <Seo title="Cultural Function" description="Add an item to an evening's programme." path="/cultural" noindex />
      <Link to={back} className="flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden="true" />
        Cultural Function
      </Link>
      <PageTitle tint={PAGE_TINT.cultural}>{itemId ? 'Edit entry' : `Add entry for ${sondhya(evening)}`}</PageTitle>

      <Card>
        <CardContent className="pt-4">
          <form
            className="flex flex-col gap-4"
            onSubmit={(ev) => {
              ev.preventDefault()
              setTried(true)
              if (missing) return setError('Fill in the fields marked *')
              if (durationBad) return setError('Duration must be a whole number of minutes')
              setError(null)
              save.mutate()
            }}
          >
            <div className="grid gap-3 rounded-md bg-muted px-3 py-2 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Date and day of function</p>
                <p className="font-medium">
                  {evening.labelBn ? `${evening.labelBn} (${evening.labelEn})` : evening.labelEn} · {longDate(evening.date)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Created by</p>
                <p className="font-medium">{createdByName}</p>
              </div>
            </div>

            <Field label="Item name *">
              <input className={inputCls} value={form.itemName} onChange={(ev) => set({ itemName: ev.target.value })} />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Item type *">
                <SearchSelect
                  ariaLabel="Item type"
                  align="left"
                  fullWidth
                  invalid={tried && form.itemType === null}
                  value={form.itemType}
                  options={Object.entries(CULTURAL_ITEM_TYPES).map(([value, label]) => ({ value, label }))}
                  onChange={(v) => set({ itemType: v as CulturalItemType })}
                />
              </Field>
              <Field label="Performers *">
                <SearchSelect
                  ariaLabel="Performers"
                  align="left"
                  fullWidth
                  invalid={tried && form.performers === null}
                  value={form.performers}
                  options={Object.entries(CULTURAL_PERFORMERS).map(([value, label]) => ({ value, label }))}
                  onChange={(v) => set({ performers: v as CulturalPerformers })}
                />
              </Field>
            </div>

            {form.itemType === 'others' && (
              <Field label="Describe the item *">
                <input
                  className={inputCls}
                  value={opt(form.itemTypeOther)}
                  onChange={(ev) => set({ itemTypeOther: textOrNull(ev.target.value) })}
                />
              </Field>
            )}

            <Field label="Duration in minutes">
              <input
                type="number"
                min={1}
                inputMode="numeric"
                className={cn(inputCls, 'sm:max-w-40')}
                value={form.durationMin}
                onChange={(ev) => set({ durationMin: ev.target.value })}
              />
            </Field>

            <Field label="Participants">
              <textarea rows={3} className={inputCls} value={opt(form.participants)} onChange={(ev) => set({ participants: textOrNull(ev.target.value) })} />
            </Field>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy}>
                {save.isPending && <Loader2 className="animate-spin" />} Save
              </Button>
              <Button type="button" variant="outline" disabled={busy} onClick={() => navigate(back)}>
                Cancel
              </Button>
              {itemId && (
                <Button
                  type="button"
                  variant="ghost"
                  className="ml-auto text-destructive hover:text-destructive"
                  disabled={busy}
                  onClick={() => {
                    if (confirm(`Delete “${form.itemName || 'this item'}” from the programme?`)) {
                      setError(null)
                      remove.mutate()
                    }
                  }}
                >
                  {remove.isPending ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
