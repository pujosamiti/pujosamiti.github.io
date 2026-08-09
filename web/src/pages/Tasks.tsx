import type { MemberLite, TaskCheck, TaskPhase, TaskView } from '@pujosamiti/shared'
import { TASK_MAX_OWNERS } from '@pujosamiti/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, CalendarCheck, EyeOff, HandHelping, Loader2, Pencil, Plus, Search, Undo2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { BackLink } from '@/components/BackLink'
import { Field, inputCls } from '@/components/form'
import { SearchSelect } from '@/components/SearchSelect'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Seo } from '@/components/Seo'
import { useMemberState } from '@/lib/member'
import {
  createMasterTask,
  saveTaskYear,
  setTaskSkipped,
  setVolunteering,
  updateMasterTask,
  useEvents,
  useMembersLite,
  useTasks,
} from '@/lib/tasks'

const PHASES: TaskPhase[] = ['todo', 'in_progress', 'completed']
const PHASE_LABEL: Record<TaskPhase, string> = {
  todo: 'To Do',
  in_progress: 'In progress',
  completed: 'Completed',
}
const EMPTY_CHECKS: [TaskCheck, TaskCheck, TaskCheck] = [
  { date: null, notes: null },
  { date: null, notes: null },
  { date: null, notes: null },
]

export function Tasks() {
  const { memberState, memberPending, sessionPending } = useMemberState()
  const me = memberState?.status === 'member' ? memberState.me : null
  const { data: events } = useEvents()
  const [year, setYear] = useState<number | null>(null)

  const years = useMemo(() => {
    const ys = new Set<number>((events ?? []).filter((e) => e.kind === 'durga-pujo').map((e) => e.year))
    return [...ys].sort()
  }, [events])

  useEffect(() => {
    if (year || !events?.length) return
    const active = events.find((e) => e.isActive && e.kind === 'durga-pujo')
    setYear(active?.year ?? years[years.length - 1] ?? new Date().getFullYear())
  }, [events, year, years])

  // Only the active pujo year is editable — past plans are the record of what
  // that year's team did, and the API refuses writes against them either way.
  const activeYear = (events ?? []).find((e) => e.isActive && e.kind === 'durga-pujo')?.year ?? null
  const archival = year != null && activeYear != null && year !== activeYear

  const { data: tasks, isPending: tasksPending, error } = useTasks(me ? year : null)
  const { data: people } = useMembersLite()
  const [adding, setAdding] = useState(false)

  if (sessionPending || memberPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    )
  }
  if (!me) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Members only</CardTitle>
          <CardDescription>Task distribution is visible to samiti members after sign in.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const canEdit = me.role !== 'member' && !archival
  const active = (tasks ?? []).filter((t) => !t.skipped)
  const skipped = (tasks ?? []).filter((t) => t.skipped)
  const categories = [...new Set(active.map((t) => t.category))]

  return (
    <div className="flex flex-col gap-4">
      <Seo title="Puja Planning" description="Durga Pujo task distribution for samiti members." path="/tasks" noindex />
      <BackLink />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Task Distribution</h1>
        <SearchSelect
          options={years.map((y) => ({
            value: String(y),
            label: `Durga Pujo ${y}`,
            hint: (events ?? []).some((e) => e.kind === 'durga-pujo' && e.year === y && e.isActive)
              ? 'Active'
              : undefined,
          }))}
          value={year ? String(year) : null}
          onChange={(v) => setYear(Number(v))}
          ariaLabel="Durga Pujo year"
        />
      </div>

      {archival && (
        <p className="rounded-md bg-accent px-3 py-2 text-sm text-muted-foreground">
          Durga Pujo {year} is closed — this is the record of what that year's team planned, kept
          read-only. Planning happens on {activeYear}.
        </p>
      )}

      {canEdit &&
        year &&
        (adding ? (
          <TaskForm year={year} people={people ?? []} categories={categories} onClose={() => setAdding(false)} />
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus /> Add task
            </Button>
            {skipped.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => document.getElementById('skipped-tasks')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <ArrowDown /> Skipped tasks ({skipped.length})
              </Button>
            )}
          </div>
        ))}

      {error && <p className="text-sm text-destructive">Failed to load: {error.message}</p>}
      {tasksPending || !year ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
      ) : (
        <>
          {categories.map((cat) => (
            <section key={cat} className="flex flex-col gap-3">
              <h2 className="font-serif text-lg font-bold">{cat}</h2>
              {active
                .filter((t) => t.category === cat)
                .map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    year={year}
                    canEdit={canEdit}
                    myPersonId={me.personId}
                    people={people ?? []}
                    categories={categories}
                  />
                ))}
            </section>
          ))}
          {canEdit && skipped.length > 0 && <SkippedList tasks={skipped} year={year} />}
        </>
      )}
    </div>
  )
}

function TaskCard({
  task: t,
  year,
  canEdit,
  myPersonId,
  people,
  categories,
}: {
  task: TaskView
  year: number
  canEdit: boolean
  myPersonId: string
  people: MemberLite[]
  categories: string[]
}) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tasks'] })

  // Puja planning is core work — a plain member reads the plan and nothing more.
  const isOwner = t.owners.some((o) => o.id === myPersonId)
  const isVolunteer = t.volunteers.some((v) => v.id === myPersonId)
  const canPhase = canEdit

  const phaseMut = useMutation({
    mutationFn: (phase: TaskPhase) =>
      saveTaskYear(t.id, {
        year,
        phase,
        checks: t.checks,
        notes: t.notes,
        ownerIds: t.owners.map((o) => o.id),
        volunteerIds: t.volunteers.map((v) => v.id),
      }),
    onSuccess: invalidate,
  })
  const volMut = useMutation({
    mutationFn: (join: boolean) => setVolunteering(t.id, year, join),
    onSuccess: invalidate,
  })
  const skipMut = useMutation({
    mutationFn: () => setTaskSkipped(t.id, year, true),
    onSuccess: invalidate,
  })

  if (editing)
    return (
      <TaskForm task={t} year={year} people={people} categories={categories} onClose={() => setEditing(false)} />
    )

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-serif text-base font-bold">{t.title}</p>
            <p className="text-sm text-muted-foreground">
              Owners: {t.owners.length ? t.owners.map((o) => o.name).join(', ') : '—'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {PHASES.map((ph) => (
              <Button
                key={ph}
                size="sm"
                variant={
                  t.phase === ph
                    ? ph === 'completed'
                      ? 'durba'
                      : ph === 'in_progress'
                        ? 'secondary'
                        : 'default'
                    : 'outline'
                }
                onClick={() => canPhase && t.phase !== ph && phaseMut.mutate(ph)}
                disabled={!canPhase || phaseMut.isPending}
              >
                {PHASE_LABEL[ph]}
              </Button>
            ))}
            {canEdit && (
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)} aria-label={`Edit ${t.title}`}>
                <Pencil />
              </Button>
            )}
            {canEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (confirm(`Skip "${t.title}" for ${year}? It stays in the catalog for other years.`)) skipMut.mutate()
                }}
                disabled={skipMut.isPending}
                aria-label={`Skip ${t.title} this year`}
                title="Skip this year"
              >
                <EyeOff />
              </Button>
            )}
          </div>
        </div>

        {t.details && <p className="whitespace-pre-wrap text-sm">{t.details}</p>}

        {t.checks.some((ck) => ck.date || ck.notes) && (
          <div className="flex flex-col gap-1">
            {t.checks.map(
              (ck, i) =>
                (ck.date || ck.notes) && (
                  <p key={i} className="text-sm">
                    <CalendarCheck className="mr-1 inline size-4 text-matir" aria-hidden="true" />
                    <span className="font-medium">Check {i + 1}</span>
                    {ck.date && <span className="text-muted-foreground"> · {ck.date}</span>}
                    {ck.notes && <> — {ck.notes}</>}
                  </p>
                ),
            )}
          </div>
        )}

        {t.notes && (
          <p className="whitespace-pre-wrap rounded-md bg-accent px-3 py-2 text-sm">{t.notes}</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Volunteers ({t.volunteers.length}):{' '}
            {t.volunteers.length ? t.volunteers.map((v) => v.name).join(', ') : 'none yet'}
          </span>
          {canEdit && !isOwner && (
            <Button
              size="sm"
              variant={isVolunteer ? 'outline' : 'secondary'}
              onClick={() => volMut.mutate(!isVolunteer)}
              disabled={volMut.isPending}
            >
              <HandHelping /> {isVolunteer ? 'Withdraw' : 'Volunteer'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PeoplePicker({
  people,
  selected,
  onChange,
  max,
  label,
}: {
  people: MemberLite[]
  selected: string[]
  onChange: (ids: string[]) => void
  max?: number
  label: string
}) {
  const [q, setQ] = useState('')
  const shown = useMemo(
    () => people.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase())),
    [people, q],
  )
  const toggle = (id: string) => {
    if (selected.includes(id)) return onChange(selected.filter((x) => x !== id))
    if (max && selected.length >= max) return
    onChange([...selected, id])
  }
  return (
    <Field label={label}>
      <div className="rounded-md border">
        <div className="relative border-b">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
          <input
            className="w-full bg-transparent py-2 pl-8 pr-3 text-sm outline-none"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people…"
          />
        </div>
        <ul className="max-h-40 overflow-y-auto p-2">
          {shown.map((p) => (
            <li key={p.id}>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={() => toggle(p.id)}
                  disabled={!selected.includes(p.id) && !!max && selected.length >= max}
                />
                {p.name}
                {p.tier === 'core' && (
                  <Badge variant="outline" className="ml-1">
                    core
                  </Badge>
                )}
              </label>
            </li>
          ))}
          {!shown.length && <li className="py-1 text-sm text-muted-foreground">No matches.</li>}
        </ul>
      </div>
    </Field>
  )
}

/**
 * Create/edit. Core members edit everything (catalog + this year's plan);
 * owners who aren't core see only the year section (phase + checkdates).
 */
function TaskForm({
  task,
  year,
  people,
  categories,
  onClose,
}: {
  task?: TaskView
  year: number
  people: MemberLite[]
  categories: string[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { memberState } = useMemberState()
  const me = memberState?.status === 'member' ? memberState.me : null
  const masterEditable = me?.role !== 'member'

  const [category, setCategory] = useState(task?.category ?? '')
  const [title, setTitle] = useState(task?.title ?? '')
  const [details, setDetails] = useState(task?.details ?? '')
  const [isActive, setIsActive] = useState(task?.isActive ?? true)
  const [sortOrder, setSortOrder] = useState<number>(task?.sortOrder ?? 1000)
  const [phase, setPhase] = useState<TaskPhase>(task?.phase ?? 'todo')
  const [checks, setChecks] = useState<[TaskCheck, TaskCheck, TaskCheck]>(task?.checks ?? EMPTY_CHECKS)
  const [yearNotes, setYearNotes] = useState(task?.notes ?? '')
  const [ownerIds, setOwnerIds] = useState<string[]>(task?.owners.map((o) => o.id) ?? [])
  const [volunteerIds, setVolunteerIds] = useState<string[]>(task?.volunteers.map((v) => v.id) ?? [])
  const [error, setError] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: async () => {
      let id = task?.id
      if (masterEditable) {
        const master = { category, title, details: details || null, sortOrder, isActive }
        if (id) await updateMasterTask(id, master)
        else id = (await createMasterTask(master)).id
      }
      await saveTaskYear(id!, { year, phase, checks, notes: yearNotes || null, ownerIds, volunteerIds })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onClose()
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'failed'),
  })

  const setCheck = (i: number, patch: Partial<TaskCheck>) =>
    setChecks((prev) => prev.map((ck, j) => (j === i ? { ...ck, ...patch } : ck)) as typeof prev)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{task ? `Edit: ${task.title}` : 'New task'}</CardTitle>
        {task && !masterEditable && <CardDescription>Update this year's progress.</CardDescription>}
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            save.mutate()
          }}
        >
          {masterEditable && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Category *">
                  <input
                    className={inputCls}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    list="task-categories"
                    required
                  />
                  <datalist id="task-categories">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Task title *">
                  <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required />
                </Field>
              </div>
              <Field label="Details — scope, subtasks (kept year over year)">
                <textarea
                  className={inputCls}
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={'e.g. Finalize truck + 6 labour for baran and bisarjan.\nBook the vendor well before pujo.'}
                />
              </Field>
              <div className="flex flex-wrap items-end gap-4">
                <Field label="Sort order (lower = earlier)">
                  <input
                    type="number"
                    className={`${inputCls} w-32`}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                  />
                </Field>
                <label className="flex items-center gap-2 pb-2 text-sm">
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  Active (untick to retire this task from the catalog)
                </label>
              </div>
              <hr className="border-border" />
            </>
          )}

          <p className="text-sm font-medium">Durga Pujo {year}</p>
          <Field label="Phase">
            <select className={inputCls} value={phase} onChange={(e) => setPhase(e.target.value as TaskPhase)}>
              {PHASES.map((ph) => (
                <option key={ph} value={ph}>
                  {PHASE_LABEL[ph]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Notes for ${year} (free form)`}>
            <textarea
              className={inputCls}
              rows={3}
              value={yearNotes}
              onChange={(e) => setYearNotes(e.target.value)}
              placeholder="Vendor finalized, advance paid, pending items…"
            />
          </Field>
          {checks.map((ck, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-[10rem_1fr]">
              <Field label={`Check ${i + 1} date`}>
                <input
                  type="date"
                  className={inputCls}
                  value={ck.date ?? ''}
                  onChange={(e) => setCheck(i, { date: e.target.value || null })}
                />
              </Field>
              <Field label={`Check ${i + 1} progress notes`}>
                <input
                  className={inputCls}
                  value={ck.notes ?? ''}
                  onChange={(e) => setCheck(i, { notes: e.target.value || null })}
                />
              </Field>
            </div>
          ))}
          {masterEditable && (
            <>
              <PeoplePicker
                people={people}
                selected={ownerIds}
                onChange={setOwnerIds}
                max={TASK_MAX_OWNERS}
                label={`Primary owners (${ownerIds.length}/${TASK_MAX_OWNERS})`}
              />
              <PeoplePicker
                people={people}
                selected={volunteerIds}
                onChange={setVolunteerIds}
                label={`Volunteers (${volunteerIds.length})`}
              />
            </>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />} Save
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onClose} disabled={save.isPending}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}


function SkippedList({ tasks, year }: { tasks: TaskView[]; year: number }) {
  const queryClient = useQueryClient()
  const restore = useMutation({
    mutationFn: (id: string) => setTaskSkipped(id, year, false),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
  return (
    <section id="skipped-tasks" className="flex flex-col gap-2 scroll-mt-4">
      <h2 className="font-serif text-lg font-bold text-muted-foreground">Skipped this year ({tasks.length})</h2>
      {tasks.map((t) => (
        <div key={t.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 opacity-70">
          <span className="text-sm">
            <span className="font-medium">{t.title}</span>
            <span className="text-muted-foreground"> · {t.category}</span>
          </span>
          <Button size="sm" variant="outline" onClick={() => restore.mutate(t.id)} disabled={restore.isPending}>
            <Undo2 /> Restore
          </Button>
        </div>
      ))}
    </section>
  )
}
