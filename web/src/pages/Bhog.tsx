import type { BhogMenuView, BhogSettingInfo, GuestBhogReceiveInput, GuestBhogRow, Me, PujoEvent } from '@pujosamiti/shared'
import { BHOG_GUEST_CAP, isCoreRole, isProxyRole, menuKindLabel, seasonOf, todayIST } from '@pujosamiti/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CalendarCog,
  Check,
  Copy,
  Link2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Share2,
  Trash2,
  UserPlus,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import { BackLink } from '@/components/BackLink'
import { LogoSpinner } from '@/components/LogoSpinner'
import { Field, inputCls } from '@/components/form'
import { SearchSelect } from '@/components/SearchSelect'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageTitle } from '@/components/PageTitle'
import { DownloadPill, FormatSwitch } from '@/components/ReportDownload'
import { Seo } from '@/components/Seo'
import { HeadcountEditor } from '@/components/HeadcountEditor'
import {
  bhogLinkUrl,
  createBhogDay,
  deleteBhogDay,
  issueBhogLink,
  publishBhogDay,
  receiveGuestBhog,
  saveBhogSetting,
  saveBhogItems,
  seedBhogDays,
  submitBhogCounts,
  updateBhogDay,
  useBhog,
  useBhogCounts,
  useBhogLink,
  useGuestBoard,
  useHeadcount,
} from '@/lib/bhog'
import { bhogReport } from '@/lib/bhog-report'
import { useMemberState } from '@/lib/member'
import { FORMAT_LABEL, type ReportFormat } from '@/lib/report-format'
import { headingTint, PAGE_TINT, pastelAt, TIER_PASTEL, tint, tintRow, type Pastel } from '@/lib/tint'
import { cn } from '@/lib/utils'
import { PersonPicker } from '@/components/PersonPicker'
import { usePujaDays } from '@/lib/pujaDays'
import { useEvents, useMembersLite } from '@/lib/tasks'

const fmtDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
const seasonLabel = (s: number) => `${s}–${String(s + 1).slice(2)}`
const todaySeason = seasonOf(new Date().toISOString().slice(0, 10))

export function Bhog() {
  const { memberState, memberPending, sessionPending } = useMemberState()
  const me = memberState?.status === 'member' ? memberState.me : null
  const { data: events } = useEvents()
  const [season, setSeason] = useState<number | null>(null)
  // Counter linkage: /bhog?count=<personId> (from a fresh ledger entry) opens
  // the headcount form with that person pre-picked.
  const [searchParams] = useSearchParams()
  const countFor = searchParams.get('count')

  const seasons = useMemo(() => {
    const ss = new Set<number>((events ?? []).map((e) => seasonOf(e.startsOn)))
    return [...ss].sort()
  }, [events])

  useEffect(() => {
    if (season != null || seasons.length === 0) return
    setSeason(seasons.includes(todaySeason) ? todaySeason : seasons[seasons.length - 1])
  }, [season, seasons])

  const archival = season != null && season !== todaySeason
  const { data: days, isPending, error } = useBhog(me ? season : null)

  if (sessionPending || memberPending) {
    return (
      <div className="flex justify-center py-16">
        <LogoSpinner />
      </div>
    )
  }
  if (!me) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Members only</CardTitle>
          <CardDescription>Bhog and food menus are visible to samiti members after sign in.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const canEdit = me.role === 'admin' && !archival
  // The season's occasions in calendar order; members see only those with
  // something published, editors see every occasion as a workspace.
  const seasonEvents = (events ?? [])
    .filter((e) => seasonOf(e.startsOn) === season)
    .sort((a, b) => a.startsOn.localeCompare(b.startsOn))
  const byEvent = new Map<string, BhogMenuView[]>()
  for (const d of days ?? []) {
    const list = byEvent.get(d.eventId) ?? []
    list.push(d)
    byEvent.set(d.eventId, list)
  }
  const sections = seasonEvents.filter((e) => canEdit || (byEvent.get(e.id)?.length ?? 0) > 0)

  return (
    <div className="flex flex-col gap-4">
      <Seo title="Bhog & Food Menu" description="Menus and per-plate cost for the samiti's occasions." path="/bhog" noindex />
      <BackLink />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PageTitle tint={PAGE_TINT.bhog}>
          Bhog &amp; Food Menu{season != null && <span className="text-muted-foreground"> · {seasonLabel(season)}</span>}
        </PageTitle>
        <SearchSelect
          options={seasons.map((s) => ({
            value: String(s),
            label: `Season ${seasonLabel(s)}`,
            hint: s === todaySeason ? 'Current' : undefined,
          }))}
          value={season != null ? String(season) : null}
          onChange={(v) => setSeason(Number(v))}
          ariaLabel="Season (1 July – 30 June)"
        />
      </div>

      {archival && (
        <p className="rounded-md bg-accent px-3 py-2 text-sm text-muted-foreground">
          Season {season != null && seasonLabel(season)} is closed — these menus are the record of what
          was served, kept read-only.
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {isPending && season != null && (
        <div className="flex justify-center py-8">
          <LogoSpinner small />
        </div>
      )}

      {days && sections.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No menus published for this season yet — check back closer to the events.
        </p>
      )}
      {days &&
        sections.map((e, i) => (
          <EventSection
            key={e.id}
            event={e}
            pastel={pastelAt(i)}
            season={season!}
            days={byEvent.get(e.id) ?? []}
            me={me}
            canEdit={canEdit}
            canRsvp={!archival}
            isCore={isCoreRole(me.role)}
            showMoney={isProxyRole(me.role)}
            initialCountFor={
              countFor && !archival && i === sections.findIndex((x) => (byEvent.get(x.id) ?? []).some((d) => d.isPublished))
                ? countFor
                : null
            }
          />
        ))}
    </div>
  )
}

function EventSection({
  event,
  pastel,
  season,
  days,
  me,
  canEdit,
  canRsvp,
  isCore,
  showMoney,
  initialCountFor = null,
}: {
  event: PujoEvent
  /** The occasion's pastel, in turn: its heading's bar and its day cards. */
  pastel: Pastel
  season: number
  days: BhogMenuView[]
  me: Me
  /** admin, current season: the only writer of days, menus and prices. */
  canEdit: boolean
  canRsvp: boolean
  isCore: boolean
  /** admin/fin_admin only: per-plate cost and the totals derived from it. */
  showMoney: boolean
  initialCountFor?: string | null
}) {
  const queryClient = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [counting, setCounting] = useState(!!initialCountFor)
  const [showResponses, setShowResponses] = useState(false)
  const [showLink, setShowLink] = useState(false)
  const [showGuests, setShowGuests] = useState(false)
  const kindLabel = menuKindLabel(event.kind)
  const isDurga = event.kind === 'durga-pujo'
  const publishedDays = days.filter((d) => d.isPublished)
  const { data: pujaDays } = usePujaDays(isDurga && canEdit ? event.year : null)
  const seed = useMutation({
    mutationFn: () => seedBhogDays(event.id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bhog', season] }),
  })

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-2 border-b pb-1">
        <h2 className="tint-heading text-lg font-semibold" style={headingTint(pastel)}>
          {event.nameEn}
        </h2>
        <span className="text-sm text-muted-foreground">{event.nameBn}</span>
        <Badge variant="outline">{kindLabel}</Badge>
        <span className="ml-auto flex flex-wrap gap-2">
          {canRsvp && publishedDays.length > 0 && (
            <Button size="sm" onClick={() => setCounting(!counting)}>
              <Users />{' '}
              {counting ? 'Hide headcount' : publishedDays.some((d) => d.myCount != null) ? 'Update headcount' : 'Give headcount'}
            </Button>
          )}
          {isCore && days.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setShowResponses(!showResponses)}>
              {showResponses ? 'Hide responses' : 'Responses'}
            </Button>
          )}
          {isDurga && showMoney && canRsvp && publishedDays.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setShowLink(!showLink)}>
              <Link2 /> {showLink ? 'Hide link' : 'Headcount link'}
            </Button>
          )}
          {isDurga && showMoney && canRsvp && publishedDays.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setShowGuests(!showGuests)}>
              <UserPlus /> {showGuests ? 'Hide guest bhog' : 'Guest bhog'}
            </Button>
          )}
          {canEdit && days.length === 0 && !isDurga && (
            <Button size="sm" variant="outline" onClick={() => setAdding(!adding)}>
              <Plus /> Add the {kindLabel.toLowerCase()}
            </Button>
          )}
          {canEdit && (days.length > 0 || isDurga) && (
            <>
              {isDurga && days.length === 0 && (pujaDays?.days.length ?? 0) > 0 && (
                <Button size="sm" onClick={() => seed.mutate()} disabled={seed.isPending}>
                  {seed.isPending ? <Loader2 className="animate-spin" /> : <CalendarCog />} Seed bhog days (Saptami → Dashami)
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setAdding(!adding)}>
                <Plus /> Add a day
              </Button>
            </>
          )}
        </span>
      </div>
      {counting && canRsvp && publishedDays.length > 0 && (
        <HeadcountForm
          event={event}
          season={season}
          me={me}
          initialPersonId={initialCountFor}
          onClose={() => setCounting(false)}
        />
      )}
      {showLink && isDurga && showMoney && canRsvp && <LinkPanel event={event} onClose={() => setShowLink(false)} />}
      {showGuests && isDurga && showMoney && canRsvp && <GuestPanel event={event} onClose={() => setShowGuests(false)} />}
      {showResponses && isCore && days.length > 0 && (
        <ResponsesTable event={event} days={days} showMoney={showMoney} onClose={() => setShowResponses(false)} />
      )}
      {isDurga && canEdit && days.length === 0 && (pujaDays?.days.length ?? 0) === 0 && (
        <p className="text-sm text-muted-foreground">
          No Puja Days for {event.year} yet — finalise the nirghanto and seed them first (Nirghanto page).
        </p>
      )}
      {seed.error && <p className="text-sm text-destructive">{seed.error.message}</p>}
      {adding && canEdit && (
        <DayForm
          season={season}
          eventId={event.id}
          defaults={{ label: kindLabel, date: event.startsOn }}
          showMoney={showMoney}
          onClose={() => setAdding(false)}
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {days.map((d) => (
          <DayCard key={d.id} season={season} day={d} pastel={pastel} canEdit={canEdit} showMoney={showMoney} />
        ))}
      </div>
    </section>
  )
}

function DayCard({
  season,
  day,
  pastel,
  canEdit,
  showMoney,
}: {
  season: number
  day: BhogMenuView
  pastel: Pastel
  canEdit: boolean
  showMoney: boolean
}) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['bhog', season] })
  const [editing, setEditing] = useState(false)
  const publish = useMutation({
    mutationFn: () => publishBhogDay(day.id, !day.isPublished),
    onSettled: invalidate,
  })
  const remove = useMutation({ mutationFn: () => deleteBhogDay(day.id), onSettled: invalidate })

  if (editing)
    return (
      <DayForm
        season={season}
        eventId={day.eventId}
        initial={day}
        showMoney={showMoney}
        onClose={() => setEditing(false)}
      />
    )

  return (
    <Card {...tint(pastel, '12%')}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <span aria-hidden="true" className="tint-disc grid size-8 shrink-0 place-items-center rounded-full">
              <UtensilsCrossed className="size-4" />
            </span>
            {day.label}
            {day.labelBn && <span className="font-normal text-muted-foreground">{day.labelBn}</span>}
          </CardTitle>
          {!day.isPublished && <Badge variant="genda">Draft</Badge>}
        </div>
        <CardDescription>{fmtDate(day.date)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {showMoney && (
          <p className="text-lg font-semibold">
            {day.perPlateCost != null ? (
              <>₹{day.perPlateCost} <span className="text-sm font-normal text-muted-foreground">per plate</span></>
            ) : (
              <span className="text-sm font-normal text-muted-foreground">Per-plate cost to be announced</span>
            )}
          </p>
        )}
        {day.items.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm">
            {day.items.map((i) => (
              <li key={i.id} className="flex items-baseline gap-2">
                <span>{i.title}</span>
                {i.titleBn && <span className="text-muted-foreground">{i.titleBn}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Menu to be announced.</p>
        )}
        {day.notes && <p className="text-sm text-shiuli">{day.notes}</p>}
        {(day.myCount != null || day.responses > 0) && (
          <p className="text-sm text-muted-foreground">
            {day.myCount != null && (
              <span className="font-medium text-foreground">Your count: {day.myCount}</span>
            )}
            {day.myCount != null && day.responses > 0 && ' · '}
            {day.responses > 0 &&
              `${day.totalCount} plate${day.totalCount === 1 ? '' : 's'} from ${day.responses} household${day.responses === 1 ? '' : 's'} so far`}
          </p>
        )}
        {canEdit && (
          <div className="flex flex-wrap gap-2 border-t pt-3">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil /> Edit
            </Button>
            <Button size="sm" variant={day.isPublished ? 'outline' : 'default'} onClick={() => publish.mutate()} disabled={publish.isPending}>
              {publish.isPending ? <Loader2 className="animate-spin" /> : null}
              {day.isPublished ? 'Unpublish' : 'Publish to members'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => remove.mutate()} disabled={remove.isPending} aria-label={`Remove ${day.label}`}>
              <Trash2 />
            </Button>
            {(publish.error || remove.error) && (
              <p className="text-sm text-destructive">{(publish.error ?? remove.error)!.message}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * The household's headcount, submitted in one go — the digital "Bhog Count"
 * columns of the food-coupon-details sheet, on the same form as the ?c= link
 * (HeadcountEditor), at the same width. A member answers for their own
 * household. Admin and fin_admin pick a household the way the link does —
 * the Responses list, core first — or, for a walk-in not on it, any person on
 * the roll (created on the spot if need be); closed days stay editable, and a
 * note can go with the count.
 */
function HeadcountForm({
  event,
  season,
  me,
  initialPersonId = null,
  onClose,
}: {
  event: PujoEvent
  season: number
  me: Me
  initialPersonId?: string | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const proxy = isProxyRole(me.role)
  // the counter's jump from a fresh ledger entry (?count=<personId>) opens on that person
  const [byPerson, setByPerson] = useState(!!initialPersonId)
  const [personId, setPersonId] = useState<string | null>(initialPersonId)
  const [householdKey, setHouseholdKey] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const { data: sheet } = useBhogCounts(proxy ? event.id : null)
  const target = !proxy ? null : byPerson ? (personId ? { personId } : null) : householdKey ? { householdKey } : null
  // a member's own household loads at once; an admin's form waits for a pick
  const { data: view, isFetching, error } = useHeadcount(event.id, target, !proxy || !!target)

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>Headcount — {view?.household.name ?? event.nameEn}</CardTitle>
          <PanelClose onClose={onClose} what="headcount" />
        </div>
        <CardDescription>
          {proxy
            ? 'Recording for a household? Find it the way the link does. Days that have closed stay editable here.'
            : 'For your whole household — one count per family, whoever gives it.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {proxy && (
          <div className="flex flex-col gap-1.5">
            {byPerson ? (
              <Field label="Person (walk-in)">
                <PersonPicker value={personId} onChange={setPersonId} ariaLabel="Person" allowCreate />
              </Field>
            ) : (
              <Field label="Household">
                <SearchSelect
                  options={(sheet?.households ?? []).map((h) => ({
                    value: h.key,
                    label: h.name,
                    group: h.tier === 'core' ? 'Core members' : 'Members',
                  }))}
                  value={householdKey}
                  onChange={setHouseholdKey}
                  ariaLabel="Household"
                  placeholder={sheet ? 'Find the household…' : 'Loading…'}
                  align="left"
                  fullWidth
                />
              </Field>
            )}
            <button
              type="button"
              className="self-start text-xs text-primary underline-offset-4 hover:underline"
              onClick={() => setByPerson(!byPerson)}
            >
              {byPerson ? 'Back to the household list' : 'Not on the list? Record for a person instead'}
            </button>
          </div>
        )}
        {isFetching && !view && <LogoSpinner small />}
        {error && <p className="text-sm text-destructive">{error.message}</p>}
        {view && (!proxy || target) && (
          <HeadcountEditor
            key={view.household.key}
            view={view}
            atCounter={proxy}
            save={(counts) =>
              submitBhogCounts({
                eventId: event.id,
                counts,
                householdKey: proxy && !byPerson ? householdKey : undefined,
                personId: proxy && byPerson ? personId : undefined,
                note: proxy ? note.trim() || null : undefined,
              })
            }
            onSaved={() => {
              void queryClient.invalidateQueries({ queryKey: ['bhog', season] })
              void queryClient.invalidateQueries({ queryKey: ['bhog-counts', event.id] })
              void queryClient.invalidateQueries({ queryKey: ['bhog-headcount', event.id] })
            }}
            onCancel={onClose}
          >
            {proxy && (
              <Field label="Note">
                <input
                  className={inputCls}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. via WhatsApp, will pay at the pandal"
                />
              </Field>
            )}
          </HeadcountEditor>
        )}
        {proxy && !target && (
          <Button variant="ghost" className="self-start" onClick={onClose}>
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

/** The ✕ at a panel's top right — the same as tapping its header button again. */
function PanelClose({ onClose, what, className = '-mr-2 -mt-2' }: { onClose: () => void; what: string; className?: string }) {
  return (
    <Button size="icon" variant="ghost" className={cn('shrink-0', className)} onClick={onClose} aria-label={`Close ${what}`} title="Close">
      <X />
    </Button>
  )
}

/**
 * ↻ — fetch a panel's numbers again, now: only the data, never the page, so
 * an open form keeps what is typed. Spins while the fetch is in flight. (The
 * panels also refresh on their own when opened and when the tab comes back.)
 * In উমা's neon — panna, the emerald off the pujo palette — so it is the same
 * refresh wherever it appears, found at a glance.
 */
function RefreshButton({ onRefresh, fetching, what }: { onRefresh: () => void; fetching: boolean; what: string }) {
  return (
    <Button
      size="icon"
      variant="ghost"
      className="neon-glow mx-1.5 size-8 shrink-0 self-center rounded-full bg-neon text-neon-foreground hover:bg-neon/85 hover:text-neon-foreground"
      onClick={onRefresh}
      disabled={fetching}
      aria-label={`Refresh ${what}`}
      title="Refresh"
    >
      <RefreshCw className={fetching ? 'animate-spin' : undefined} />
    </Button>
  )
}

/**
 * The event's headcount link (admin / fin_admin): one code for everyone,
 * shared on WhatsApp. Whoever opens it picks their household from the
 * Responses list, so the code opens every household's counts — replace it
 * if it travels further than the samiti.
 */
function LinkPanel({ event, onClose }: { event: PujoEvent; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { data: link, isPending, error } = useBhogLink(event.id)
  const [confirming, setConfirming] = useState(false)
  const [copied, setCopied] = useState(false)
  const issue = useMutation({
    mutationFn: (replace: boolean) => issueBhogLink(event.id, replace),
    onSuccess: (l) => {
      queryClient.setQueryData(['bhog-link', event.id], l)
      setConfirming(false)
      setCopied(false)
    },
  })
  const url = link ? bhogLinkUrl(link.code) : null
  const message = url
    ? `${event.nameEn} ${event.year} — bhog headcount. Open the link, find your household, and give the count for each day (everyone aged 5 and above). Each day closes four days before it.\n${url}`
    : ''
  const copy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      window.prompt('Copy the link', url)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Link2 className="size-5" /> Headcount link
          </CardTitle>
          <PanelClose onClose={onClose} what="headcount link" />
        </div>
        <CardDescription>
          One link for everyone, no sign-in: whoever opens it picks their household from the Responses list and gives its
          counts. It opens every household’s counts, so share it with the samiti only.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isPending && <LogoSpinner small />}
        {error && <p className="text-sm text-destructive">{error.message}</p>}
        {!isPending && !link && (
          <Button className="self-start" onClick={() => issue.mutate(false)} disabled={issue.isPending}>
            {issue.isPending ? <Loader2 className="animate-spin" /> : <Link2 />} Create the link
          </Button>
        )}
        {link && url && (
          <>
            <div className="flex flex-col gap-1 rounded-md bg-accent px-3 py-2">
              <span className="font-mono text-lg font-semibold tracking-wider">{link.code}</span>
              <a href={url} target="_blank" rel="noreferrer" className="break-all text-sm text-primary underline-offset-4 hover:underline">
                {url}
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => void copy()}>
                {copied ? <Check /> : <Copy />} {copied ? 'Copied' : 'Copy link'}
              </Button>
              <Button size="sm" variant="durba" asChild>
                <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
                  <Share2 /> Share on WhatsApp
                </a>
              </Button>
              {!confirming ? (
                <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>
                  <RefreshCw /> Replace code
                </Button>
              ) : (
                <span className="inline-flex flex-wrap items-center gap-2 text-sm">
                  The old link stops working.
                  <Button size="sm" variant="destructive" onClick={() => issue.mutate(true)} disabled={issue.isPending}>
                    {issue.isPending ? <Loader2 className="animate-spin" /> : null} Replace
                  </Button>
                  {/* the safe choice, in durba green, so it reads as a button beside the red */}
                  <Button size="sm" variant="durba" onClick={() => setConfirming(false)}>
                    Keep it
                  </Button>
                </span>
              )}
            </div>
          </>
        )}
        {issue.error && <p className="text-sm text-destructive">{issue.error.message}</p>}
      </CardContent>
    </Card>
  )
}

/**
 * Guest bhog (admin / fin_admin): the event's two settings — the Food & Bhog
 * in-charge and the rate per head — and every household with guests or guest
 * money: guests by day, due, received (read from the ledger), balance. "Mark
 * received" writes the ledger entry (misc_income · Guest Bhog) into the
 * wallet of whoever took the money — the in-charge unless another is picked.
 * No refunds: an overpaid household shows a negative balance.
 */
function GuestPanel({ event, onClose }: { event: PujoEvent; onClose: () => void }) {
  const { data: board, isPending, error, isFetching, refetch } = useGuestBoard(event.id)
  const { data: people } = useMembersLite()
  const [receiving, setReceiving] = useState<string | null>(null)
  const coreOptions = (people ?? []).filter((p) => p.tier === 'core').map((p) => ({ value: p.id, label: p.name }))
  const heading = (label: string) => label.replace(/\s+Bhog$/i, '')
  const total = (f: (r: GuestBhogRow) => number) => (board?.rows ?? []).reduce((s, r) => s + f(r), 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-5" /> Guest bhog
          </CardTitle>
          <span className="-mr-2 -mt-2 flex shrink-0">
            <RefreshButton onRefresh={() => void refetch()} fetching={isFetching} what="guest bhog" />
            <PanelClose onClose={onClose} what="guest bhog" className="" />
          </span>
        </div>
        <CardDescription>
          Office colleagues and friends that core households bring — up to {BHOG_GUEST_CAP} a day, paid per head to the
          Food &amp; Bhog in-charge. Received money is read from the ledger (Misc income · Guest Bhog).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isPending && <LogoSpinner small />}
        {error && <p className="text-sm text-destructive">{error.message}</p>}
        {board && (
          <>
            <GuestSettings
              key={`${board.setting.inchargePersonId}-${board.setting.guestRate}`}
              eventId={event.id}
              setting={board.setting}
              coreOptions={coreOptions}
            />
            {board.setting.guestRate == null ? (
              <p className="text-sm text-muted-foreground">Guest bhog is off — set a rate per head to open it on the forms.</p>
            ) : board.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No household has added guests yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-accent/40 text-left">
                      <th className="px-3 py-2 font-medium">Household</th>
                      {board.days.map((d) => (
                        <th key={d.menuId} className="px-2 py-2 text-right font-medium">{heading(d.label)}</th>
                      ))}
                      <th className="px-2 py-2 text-right font-medium">Guests</th>
                      <th className="px-2 py-2 text-right font-medium">Due</th>
                      <th className="px-2 py-2 text-right font-medium">Received</th>
                      <th className="px-2 py-2 text-right font-medium">Balance</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {board.rows.map((r) => (
                      <Fragment key={r.householdKey}>
                        <tr className="border-b">
                          <td className="px-3 py-1.5">{r.name}</td>
                          {r.guestsByDay.map((g, i) => (
                            <td key={board.days[i].menuId} className="px-2 py-1.5 text-right tabular-nums">{g || '—'}</td>
                          ))}
                          <td className="px-2 py-1.5 text-right font-medium tabular-nums">{r.heads}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums">{inr(r.due)}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums">{r.received ? inr(r.received) : '—'}</td>
                          <td
                            className={cn(
                              'px-2 py-1.5 text-right font-medium tabular-nums',
                              r.balance > 0 ? 'text-destructive' : 'text-durba',
                            )}
                            title={r.balance < 0 ? 'Paid more than the guests now come to — no refunds' : undefined}
                          >
                            {r.balance > 0 ? inr(r.balance) : r.balance < 0 ? `−${inr(-r.balance)}` : 'paid'}
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            {r.balance > 0 && receiving !== r.householdKey && (
                              <Button size="sm" variant="soft" onClick={() => setReceiving(r.householdKey)}>
                                Mark received
                              </Button>
                            )}
                          </td>
                        </tr>
                        {receiving === r.householdKey && (
                          <tr className="border-b bg-accent/20">
                            <td colSpan={board.days.length + 6} className="px-3 py-3">
                              <ReceiveGuestForm
                                eventId={event.id}
                                row={r}
                                inchargeId={board.setting.inchargePersonId}
                                coreOptions={coreOptions}
                                onClose={() => setReceiving(null)}
                              />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                    <tr className="bg-accent/40 font-medium">
                      <td className="px-3 py-1.5">Total</td>
                      {board.days.map((d, i) => (
                        <td key={d.menuId} className="px-2 py-1.5 text-right tabular-nums">
                          {board.rows.reduce((s, r) => s + r.guestsByDay[i], 0)}
                        </td>
                      ))}
                      <td className="px-2 py-1.5 text-right tabular-nums">{total((r) => r.heads)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{inr(total((r) => r.due))}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{inr(total((r) => r.received))}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{inr(total((r) => Math.max(0, r.balance)))}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

/** The event's Food & Bhog in-charge and guest rate; a blank rate turns guest bhog off. */
function GuestSettings({
  eventId,
  setting,
  coreOptions,
}: {
  eventId: string
  setting: BhogSettingInfo
  coreOptions: { value: string; label: string }[]
}) {
  const queryClient = useQueryClient()
  const [incharge, setIncharge] = useState<string | null>(setting.inchargePersonId)
  const [rate, setRate] = useState(setting.guestRate != null ? String(setting.guestRate) : '')
  const save = useMutation({
    mutationFn: () => saveBhogSetting({ eventId, inchargePersonId: incharge, guestRate: rate.trim() ? Number(rate) : null }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bhog-guests', eventId] })
      void queryClient.invalidateQueries({ queryKey: ['bhog-headcount', eventId] })
    },
  })
  const dirty = incharge !== setting.inchargePersonId || rate !== (setting.guestRate != null ? String(setting.guestRate) : '')
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-56 flex-1">
        <Field label="Food & Bhog in-charge">
          <SearchSelect
            align="left"
            fullWidth
            options={coreOptions}
            value={incharge}
            onChange={setIncharge}
            ariaLabel="Food & Bhog in-charge"
            placeholder="Pick the in-charge…"
          />
        </Field>
      </div>
      <div className="w-32">
        <Field label="₹ per guest">
          <input
            className={inputCls}
            inputMode="numeric"
            value={rate}
            onChange={(e) => setRate(e.target.value.replace(/\D/g, ''))}
            placeholder="off"
          />
        </Field>
      </div>
      <Button size="sm" className="h-10" onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
        {save.isPending ? <Loader2 className="animate-spin" /> : null} Save
      </Button>
      {save.error && <p className="basis-full text-sm text-destructive">{save.error.message}</p>}
    </div>
  )
}

/** Record one guest bhog payment: amount (the balance by default), date, and who took the money. */
function ReceiveGuestForm({
  eventId,
  row,
  inchargeId,
  coreOptions,
  onClose,
}: {
  eventId: string
  row: GuestBhogRow
  inchargeId: string | null
  coreOptions: { value: string; label: string }[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState(String(Math.max(0, row.balance)))
  const [date, setDate] = useState(todayIST())
  const [wallet, setWallet] = useState<string | null>(inchargeId)
  const receive = useMutation({
    mutationFn: () =>
      receiveGuestBhog({ eventId: eventId as GuestBhogReceiveInput['eventId'], householdKey: row.householdKey, amount: Number(amount), entryDate: date, walletPersonId: wallet! }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bhog-guests', eventId] })
      void queryClient.invalidateQueries({ queryKey: ['ledger-entries'] })
      void queryClient.invalidateQueries({ queryKey: ['ledger-summary'] })
      onClose()
    },
  })
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-32">
        <Field label="Amount ₹">
          <input className={inputCls} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} />
        </Field>
      </div>
      <div className="w-40">
        <Field label="Date">
          <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <div className="min-w-56 flex-1">
        <Field label="Received by">
          <SearchSelect align="left" fullWidth options={coreOptions} value={wallet} onChange={setWallet} ariaLabel="Received by" />
        </Field>
      </div>
      <Button size="sm" variant="durba" className="h-10" onClick={() => receive.mutate()} disabled={receive.isPending || !wallet || !Number(amount)}>
        {receive.isPending ? <Loader2 className="animate-spin" /> : <Check />} Received
      </Button>
      <Button size="sm" variant="ghost" className="h-10" onClick={onClose}>
        Cancel
      </Button>
      {receive.error && <p className="basis-full text-sm text-destructive">{receive.error.message}</p>}
    </div>
  )
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

/**
 * The household-by-household count sheet (core) — every household that paid
 * or pledged this season, answered or not, days across, with the money rows
 * for those who price a plate. Downloads as Excel or PDF; before anyone
 * answers it is the blank sheet for the counter. What it holds is defined
 * once in lib/bhog-report. A household whose counts are over its allowance
 * (a pledge cancelled after it answered) is flagged for an admin.
 */
function ResponsesTable({
  event,
  days,
  showMoney,
  onClose,
}: {
  event: PujoEvent
  days: BhogMenuView[]
  /** Plate counts are everyone's business on this table; the ₹ rows are not. */
  showMoney: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { data: sheet, isPending, error: loadError, isFetching, refetch } = useBhogCounts(event.id)
  // the sheet, and the day cards' "N plates so far" that come from the same answers
  const refresh = () => {
    void refetch()
    void queryClient.invalidateQueries({ queryKey: ['bhog'] })
  }
  // A spreadsheet unless asked otherwise, as on the ledger.
  const [format, setFormat] = useState<ReportFormat>('xlsx')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (isPending)
    return (
      <div className="flex justify-center py-4">
        <LogoSpinner small />
      </div>
    )
  if (loadError || !sheet) return <p className="text-sm text-destructive">{loadError?.message ?? 'could not load the sheet'}</p>
  const input = { event, days, sheet, showMoney }
  const r = bhogReport(input)
  const noted = r.households.filter((h) => h.remarks)
  const over = r.households.filter((h) => h.overAllowance).length

  const download = async () => {
    setBusy(true)
    setError(null)
    try {
      if (format === 'xlsx') {
        const { downloadBhogXlsx } = await import('@/lib/reports-xlsx')
        await downloadBhogXlsx(input)
      } else {
        const { downloadBhogPdf } = await import('@/lib/reports-pdf')
        await downloadBhogPdf(input)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `could not build the ${FORMAT_LABEL[format]}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <FormatSwitch value={format} onChange={setFormat} disabled={busy} />
        <DownloadPill label="Headcount" format={FORMAT_LABEL[format]} busy={busy} disabled={busy} onClick={() => void download()} />
        {error && <span className="text-xs text-destructive">{error}</span>}
        <span className="text-xs text-muted-foreground">
          {r.answered} of {r.households.length} households answered
        </span>
        {over > 0 && (
          <span className="text-xs font-medium text-destructive">
            {over} over {over === 1 ? 'its' : 'their'} allowance
          </span>
        )}
        <span className="ml-auto flex shrink-0">
          <RefreshButton onRefresh={refresh} fetching={isFetching} what="responses" />
          <PanelClose onClose={onClose} what="responses" className="" />
        </span>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-accent/40 text-left">
              <th className="px-3 py-2 font-medium">Household</th>
              {r.days.map((d) => (
                <th key={d.id} className="px-3 py-2 text-right font-medium">{d.label}</th>
              ))}
              {r.grandGuests > 0 && <th className="px-3 py-2 text-right font-medium">Guests</th>}
              <th className="px-3 py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {r.households.map((h, i) => (
              <Fragment key={h.key}>
                {/* Core rose, members blue lotus (TIER_PASTEL): a deeper wash on the
                    group's heading row, a faint one down each household row */}
                {(i === 0 || r.households[i - 1].tier !== h.tier) && (
                  <tr style={tintRow(TIER_PASTEL[h.tier], '16%').style} className={cn(tintRow(TIER_PASTEL[h.tier]).className, 'border-b')}>
                    <td colSpan={r.days.length + (r.grandGuests > 0 ? 3 : 2)} className="px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {h.tier === 'core' ? 'Core members' : 'Members'}
                    </td>
                  </tr>
                )}
                <tr style={tintRow(TIER_PASTEL[h.tier]).style} className={cn(tintRow(TIER_PASTEL[h.tier]).className, 'border-b last:border-0')}>
                  <td className="px-3 py-1.5">
                    {h.name}
                    {h.overAllowance && (
                      <span className="ml-2 text-xs font-medium text-destructive" title="Counts are above what this household's money now allows — a pledge was cancelled after they answered">
                        over allowance
                      </span>
                    )}
                  </td>
                  {h.counts.map((c, j) => (
                    <td key={r.days[j].id} className="px-3 py-1.5 text-right tabular-nums">
                      {c ?? (h.guests[j] ? 0 : '—')}
                      {h.guests[j] > 0 && <span className="ml-1 text-xs font-medium text-durba">+{h.guests[j]}</span>}
                    </td>
                  ))}
                  {r.grandGuests > 0 && (
                    <td className="px-3 py-1.5 text-right tabular-nums text-durba">{h.guestTotal || '—'}</td>
                  )}
                  <td className="px-3 py-1.5 text-right font-medium">{h.counts.some((c) => c != null) || h.guestTotal ? h.total : '—'}</td>
                </tr>
              </Fragment>
            ))}
            <tr className="bg-accent/40 font-medium">
              <td className="px-3 py-1.5">Total plates</td>
              {r.plates.map((n, i) => (
                <td key={r.days[i].id} className="px-3 py-1.5 text-right">{n}</td>
              ))}
              {r.grandGuests > 0 && <td className="px-3 py-1.5 text-right text-durba">{r.grandGuests}</td>}
              <td className="px-3 py-1.5 text-right">{r.grandPlates}</td>
            </tr>
            {r.money && (
              <tr className="bg-accent/40 font-medium">
                <td className="px-3 py-1.5">Total ₹</td>
                {r.money.map((m, i) => (
                  <td key={r.days[i].id} className="px-3 py-1.5 text-right">{m != null ? inr(m) : '—'}</td>
                ))}
                {r.grandGuests > 0 && <td />}
                <td className="px-3 py-1.5 text-right">{r.grandMoney != null ? inr(r.grandMoney) : '—'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {noted.length > 0 && (
        <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          {noted.map((h) => (
            <li key={h.key}>
              <span className="font-medium text-foreground">{h.name}</span> — {h.remarks}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Create/edit one menu day: labels, date, cost, notes, dishes (one per line). */
function DayForm({
  season,
  eventId,
  initial,
  defaults,
  showMoney,
  onClose,
}: {
  season: number
  eventId: BhogMenuView['eventId']
  initial?: BhogMenuView
  defaults?: { label: string; date: string }
  /** admin/fin_admin only: the per-plate field. The server keeps the stored
      value on everyone else's edits, so hiding it never wipes a price. */
  showMoney: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [label, setLabel] = useState(initial?.label ?? defaults?.label ?? '')
  const [labelBn, setLabelBn] = useState(initial?.labelBn ?? '')
  const [date, setDate] = useState(initial?.date ?? defaults?.date ?? '')
  const [cost, setCost] = useState(initial?.perPlateCost != null ? String(initial.perPlateCost) : '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [dishes, setDishes] = useState(
    (initial?.items ?? []).map((i) => (i.titleBn ? `${i.title} | ${i.titleBn}` : i.title)).join('\n'),
  )

  const save = useMutation({
    mutationFn: async () => {
      const input = {
        eventId,
        label: label.trim(),
        labelBn: labelBn.trim() || null,
        date,
        perPlateCost: cost.trim() ? Number(cost) : null,
        notes: notes.trim() || null,
        sortOrder: initial?.sortOrder ?? 1000,
      }
      const id = initial ? (await updateBhogDay(initial.id, input), initial.id) : (await createBhogDay(input)).id
      const items = dishes
        .split('\n')
        .map((line) => {
          const [en, bn] = line.split('|').map((s) => s.trim())
          return { title: en ?? '', titleBn: bn || null }
        })
        .filter((i) => i.title)
      await saveBhogItems(id, { items })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bhog', season] }),
    onSuccess: onClose,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initial ? `Edit ${initial.label}` : 'New menu day'}</CardTitle>
        <CardDescription>
          One dish per line — add the Bengali name after a "|" (e.g. "Khichuri | খিচুড়ি").
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Day">
            <input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Saptami Bhog" />
          </Field>
          <Field label="বাংলা">
            <input className={inputCls} value={labelBn} onChange={(e) => setLabelBn(e.target.value)} placeholder="সপ্তমীর ভোগ" />
          </Field>
          <Field label="Date">
            <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          {showMoney && (
            <Field label="Per plate ₹">
              <input className={inputCls} type="number" min="0" inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="180" />
            </Field>
          )}
        </div>
        <Field label="Menu (one dish per line)">
          <textarea
            className={inputCls}
            rows={6}
            value={dishes}
            onChange={(e) => setDishes(e.target.value)}
            placeholder={'Khichuri | খিচুড়ি\nLabra | লাবড়া\nBeguni | বেগুনি'}
          />
        </Field>
        <Field label="Notes">
          <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Mishti Doi +₹20" />
        </Field>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || !label.trim() || !date}>
            {save.isPending ? <Loader2 className="animate-spin" /> : null} Save
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
        {save.error && <p className="text-sm text-destructive">{save.error.message}</p>}
      </CardContent>
    </Card>
  )
}
