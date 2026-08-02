import type { MemberLite, TaskCheck, TaskInput, TaskPhase, TaskView } from '@pujosamiti/shared'
import { TASK_MAX_OWNERS } from '@pujosamiti/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarCheck, HandHelping, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Field, inputCls } from '@/components/form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useMemberState } from '@/lib/member'
import { createTask, deleteTask, setTaskPhase, setVolunteering, updateTask, useEvents, useMembersLite, useTasks } from '@/lib/tasks'

const PHASES: TaskPhase[] = ['initiated', 'in_progress', 'completed']
const PHASE_LABEL: Record<TaskPhase, string> = {
  initiated: 'Initiated',
  in_progress: 'In progress',
  completed: 'Completed',
}

export function Tasks() {
  const { memberState, memberPending, sessionPending } = useMemberState()
  const me = memberState?.status === 'member' ? memberState.me : null
  const { data: events } = useEvents()
  const [eventId, setEventId] = useState<string | null>(null)

  // Default to the active event once events arrive
  useEffect(() => {
    if (!eventId && events?.length) setEventId((events.find((e) => e.isActive) ?? events[0]).id)
  }, [events, eventId])

  const { data: tasks, isPending: tasksPending, error } = useTasks(me ? eventId : null)
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

  const canEdit = me.role !== 'member'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Task Distribution</h1>
        <select
          className={`${inputCls} w-auto`}
          value={eventId ?? ''}
          onChange={(e) => setEventId(e.target.value)}
          aria-label="Event"
        >
          {events?.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nameEn} {e.year}
            </option>
          ))}
        </select>
      </div>

      {canEdit &&
        eventId &&
        (adding ? (
          <TaskForm eventId={eventId} people={people ?? []} onClose={() => setAdding(false)} />
        ) : (
          <Button size="sm" className="self-start" onClick={() => setAdding(true)}>
            <Plus /> Add task
          </Button>
        ))}

      {error && <p className="text-sm text-destructive">Failed to load: {error.message}</p>}
      {tasksPending ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
      ) : (
        <>
          {tasks?.map((t) => (
            <TaskCard key={t.id} task={t} canEdit={canEdit} myPersonId={me.personId} people={people ?? []} />
          ))}
          {!tasks?.length && (
            <p className="text-sm text-muted-foreground">No tasks yet for this event.</p>
          )}
        </>
      )}
    </div>
  )
}

function TaskCard({
  task: t,
  canEdit,
  myPersonId,
  people,
}: {
  task: TaskView
  canEdit: boolean
  myPersonId: string
  people: MemberLite[]
}) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tasks'] })

  const phaseMut = useMutation({ mutationFn: (phase: TaskPhase) => setTaskPhase(t.id, phase), onSuccess: invalidate })
  const volMut = useMutation({ mutationFn: (join: boolean) => setVolunteering(t.id, join), onSuccess: invalidate })
  const delMut = useMutation({ mutationFn: () => deleteTask(t.id), onSuccess: invalidate })

  const isOwner = t.owners.some((o) => o.id === myPersonId)
  const isVolunteer = t.volunteers.some((v) => v.id === myPersonId)
  const canPhase = canEdit || isOwner

  if (editing) return <TaskForm task={t} eventId={t.eventId} people={people} onClose={() => setEditing(false)} />

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-serif text-base font-bold">{t.title}</p>
            <p className="text-sm text-muted-foreground">
              Owners:{' '}
              {t.owners.length ? t.owners.map((o) => o.name).join(', ') : '—'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {PHASES.map((ph) => (
              <Button
                key={ph}
                size="sm"
                variant={t.phase === ph ? (ph === 'completed' ? 'default' : 'secondary') : 'outline'}
                onClick={() => canPhase && t.phase !== ph && phaseMut.mutate(ph)}
                disabled={!canPhase || phaseMut.isPending}
              >
                {PHASE_LABEL[ph]}
              </Button>
            ))}
            {canEdit && (
              <>
                <Button size="sm" variant="ghost" onClick={() => setEditing(true)} aria-label={`Edit ${t.title}`}>
                  <Pencil />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Delete task "${t.title}"?`)) delMut.mutate()
                  }}
                  disabled={delMut.isPending}
                  aria-label={`Delete ${t.title}`}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </>
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

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Volunteers ({t.volunteers.length}):{' '}
            {t.volunteers.length ? t.volunteers.map((v) => v.name).join(', ') : 'none yet'}
          </span>
          {!isOwner && (
            <Button size="sm" variant={isVolunteer ? 'outline' : 'secondary'} onClick={() => volMut.mutate(!isVolunteer)} disabled={volMut.isPending}>
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
              <label className="flex items-center gap-2 py--0.5 text-sm">
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

function TaskForm({
  task,
  eventId,
  people,
  onClose,
}: {
  task?: TaskView
  eventId: string
  people: MemberLite[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(task?.title ?? '')
  const [details, setDetails] = useState(task?.details ?? '')
  const [phase, setPhase] = useState<TaskPhase>(task?.phase ?? 'initiated')
  const [checks, setChecks] = useState<[TaskCheck, TaskCheck, TaskCheck]>(
    task?.checks ?? [
      { date: null, notes: null },
      { date: null, notes: null },
      { date: null, notes: null },
    ],
  )
  const [ownerIds, setOwnerIds] = useState<string[]>(task?.owners.map((o) => o.id) ?? [])
  const [volunteerIds, setVolunteerIds] = useState<string[]>(task?.volunteers.map((v) => v.id) ?? [])
  const [error, setError] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: () => {
      const input: TaskInput = {
        eventId: eventId as TaskInput['eventId'],
        title,
        details: details || null,
        phase,
        checks,
        ownerIds,
        volunteerIds,
      }
      return task ? updateTask(task.id, input) : createTask(input)
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
        <CardTitle className="text-base">{task ? 'Edit task' : 'New task'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            save.mutate()
          }}
        >
          <Field label="Task title *">
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Details — scope, subtasks, dates">
            <textarea
              className={inputCls}
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={'e.g. Finalize truck + 6 labour for baran and bisarjan.\nBook by 20 Sep. Consult Ashok Da for the vendor.'}
            />
          </Field>
          <Field label="Phase">
            <select className={inputCls} value={phase} onChange={(e) => setPhase(e.target.value as TaskPhase)}>
              {PHASES.map((ph) => (
                <option key={ph} value={ph}>
                  {PHASE_LABEL[ph]}
                </option>
              ))}
            </select>
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
