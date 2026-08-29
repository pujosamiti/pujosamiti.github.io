import type { ProcurementMasterItem, ProcurementSlot } from '@pujosamiti/shared'
import { isCoreRole, PROCUREMENT_SLOTS, PUJA_TITHIS } from '@pujosamiti/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { BackLink } from '@/components/BackLink'
import { LogoSpinner } from '@/components/LogoSpinner'
import { Field, inputCls } from '@/components/form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Seo } from '@/components/Seo'
import { cn } from '@/lib/utils'
import { useMemberState } from '@/lib/member'
import {
  createProcurementItem,
  saveSuggestions,
  updateProcurementItem,
  useProcurementMaster,
} from '@/lib/procurement'

const SLOT_LABEL: Record<ProcurementSlot, string> = { morning: 'Morning', evening: 'Evening' }

/**
 * The master list — year-independent: the item catalog with SUGGESTED
 * quantities (per tithi × slot, plus a suggested total), distilled from what
 * the samiti has actually bought since 2023. A new year starts by seeding
 * delivery columns from the Puja Days and prefilling from this list.
 */
export function ProcurementMaster() {
  const { memberState, memberPending, sessionPending } = useMemberState()
  const me = memberState?.status === 'member' ? memberState.me : null
  const { data: items, isPending, error } = useProcurementMaster()
  const [adding, setAdding] = useState(false)

  if (sessionPending || memberPending) {
    return (
      <div className="flex justify-center py-16">
        <LogoSpinner />
      </div>
    )
  }
  if (!me || !isCoreRole(me.role)) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Core members only</CardTitle>
          <CardDescription>The procurement master list is the committee's workspace.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const canEdit = isCoreRole(me.role)
  const all = items ?? []
  const categories = [...new Set(all.map((i) => i.category))]

  return (
    <div className="flex flex-col gap-4">
      <Seo title="Procurement master list" description="Year-independent item catalog with suggested quantities." path="/procurement/master" noindex />
      <BackLink />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Master list</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Year-independent: what the samiti buys and roughly how much, distilled from 2023–2025.
        Suggested quantities are per tithi (Panchami → Dashami) — a year's prefill maps them onto
        that year's actual days, including a two-day tithi.
      </p>

      {canEdit &&
        (adding ? (
          <MasterForm categories={categories} onClose={() => setAdding(false)} />
        ) : (
          <div>
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus /> Add item
            </Button>
          </div>
        ))}

      {error && <p className="text-sm text-destructive">Failed to load: {error.message}</p>}
      {isPending ? (
        <LogoSpinner small />
      ) : (
        categories.map((cat) => {
          const catItems = all.filter((i) => i.category === cat)
          return (
            <MasterCategory key={cat} title={cat} count={catItems.length}>
              {catItems.map((i) => (
                <MasterRow key={i.id} item={i} canEdit={canEdit} categories={categories} />
              ))}
            </MasterCategory>
          )
        })
      )}
    </div>
  )
}

function MasterCategory({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <section className="overflow-hidden rounded-md border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 bg-accent/40 px-3 py-2 text-left"
        aria-expanded={open}
      >
        <h2 className="font-serif text-lg font-bold">{title}</h2>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {count}
          <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </span>
      </button>
      {open && <div className="divide-y border-t">{children}</div>}
    </section>
  )
}

function MasterRow({
  item,
  canEdit,
  categories,
}: {
  item: ProcurementMasterItem
  canEdit: boolean
  categories: string[]
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const summary = [
    item.suggestedTotal && `Total ${item.suggestedTotal}`,
    item.suggestions.length > 0 && `${item.suggestions.length} suggested`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="px-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 py-2 text-left"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</span>
        {summary && <span className="max-w-[45%] truncate text-xs text-muted-foreground">{summary}</span>}
        <ChevronDown
          className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="flex flex-col gap-2 pb-3">
          {editing ? (
            <MasterForm categories={categories} initial={item} onClose={() => setEditing(false)} />
          ) : (
            <>
              {(item.nameHi || item.nameBn) && (
                <p className="text-sm text-muted-foreground">{[item.nameBn, item.nameHi].filter(Boolean).join(' · ')}</p>
              )}
              {item.details && <p className="text-sm text-muted-foreground">{item.details}</p>}
              {item.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.suggestions.map((sg, i) => (
                    <Badge key={i} variant="outline">
                      {sg.tithi} {SLOT_LABEL[sg.slot]}: {sg.quantity}
                    </Badge>
                  ))}
                </div>
              )}
              {canEdit && (
                <div>
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                    <Pencil /> Edit item & suggestions
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function MasterForm({
  categories,
  initial,
  onClose,
}: {
  categories: string[]
  initial?: ProcurementMasterItem
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [category, setCategory] = useState(initial?.category ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [nameHi, setNameHi] = useState(initial?.nameHi ?? '')
  const [nameBn, setNameBn] = useState(initial?.nameBn ?? '')
  const [details, setDetails] = useState(initial?.details ?? '')
  const [suggestedTotal, setSuggestedTotal] = useState(initial?.suggestedTotal ?? '')
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 1000))
  const gridKey = (tithi: string, slot: ProcurementSlot) => `${tithi}:${slot}`
  const initialGrid = useMemo(() => {
    const g: Record<string, string> = {}
    for (const sg of initial?.suggestions ?? []) g[gridKey(sg.tithi, sg.slot)] = sg.quantity
    return g
  }, [initial])
  const [grid, setGrid] = useState(initialGrid)

  const save = useMutation({
    mutationFn: async () => {
      const master = {
        category,
        title,
        nameHi: nameHi.trim() || null,
        nameBn: nameBn.trim() || null,
        details: details.trim() || null,
        suggestedTotal: suggestedTotal.trim() || null,
        sortOrder: Number(sortOrder) || 1000,
        isActive: true,
      }
      const id = initial
        ? (await updateProcurementItem(initial.id, master), initial.id)
        : (await createProcurementItem(master)).id
      const suggestions = PUJA_TITHIS.flatMap((tithi) =>
        PROCUREMENT_SLOTS.flatMap((slot) => {
          const quantity = (grid[gridKey(tithi, slot)] ?? '').trim()
          return quantity ? [{ tithi, slot, quantity }] : []
        }),
      )
      await saveSuggestions(id, suggestions)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['procurement-master'] })
      onClose()
    },
  })
  const remove = useMutation({
    mutationFn: () =>
      updateProcurementItem(initial!.id, {
        category: initial!.category,
        title: initial!.title,
        nameHi: initial!.nameHi,
        nameBn: initial!.nameBn,
        details: initial!.details,
        suggestedTotal: initial!.suggestedTotal,
        sortOrder: initial!.sortOrder,
        isActive: false,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['procurement-master'] })
      onClose()
    },
  })

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Category">
          <input className={inputCls} list="master-categories" value={category} onChange={(e) => setCategory(e.target.value)} />
          <datalist id="master-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Item">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Vendor name — Hindi (optional)">
          <input className={inputCls} value={nameHi} onChange={(e) => setNameHi(e.target.value)} />
        </Field>
        <Field label="Vendor name — Bengali (optional)">
          <input className={inputCls} value={nameBn} onChange={(e) => setNameBn(e.target.value)} />
        </Field>
      </div>
      <Field label="Details (optional)">
        <input className={inputCls} value={details} onChange={(e) => setDetails(e.target.value)} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Suggested total (optional)">
          <input className={inputCls} value={suggestedTotal} onChange={(e) => setSuggestedTotal(e.target.value)} placeholder="10 kg" />
        </Field>
        <Field label="Sort order">
          <input className={inputCls} inputMode="numeric" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </Field>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">Suggested quantities (per tithi)</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-1 pr-2 font-medium">Tithi</th>
                <th className="py-1 pr-2 font-medium">Morning</th>
                <th className="py-1 font-medium">Evening</th>
              </tr>
            </thead>
            <tbody>
              {PUJA_TITHIS.map((tithi) => (
                <tr key={tithi} className="border-t">
                  <td className="py-1.5 pr-2 font-medium">{tithi}</td>
                  {PROCUREMENT_SLOTS.map((slot) => (
                    <td key={slot} className="py-1.5 pr-2">
                      <input
                        className={inputCls}
                        value={grid[gridKey(tithi, slot)] ?? ''}
                        onChange={(e) => setGrid({ ...grid, [gridKey(tithi, slot)]: e.target.value })}
                        placeholder="—"
                        aria-label={`${tithi} ${slot} suggested quantity`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {save.error && <p className="text-sm text-destructive">{save.error.message}</p>}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || !category.trim() || !title.trim()}>
          {save.isPending ? <Loader2 className="animate-spin" /> : <Check />} Save
        </Button>
        <Button size="sm" variant="outline" onClick={onClose}>
          <X /> Cancel
        </Button>
        {initial && (
          <Button size="sm" variant="destructive" className="ml-auto" onClick={() => remove.mutate()} disabled={remove.isPending}>
            <Trash2 /> Remove from catalog
          </Button>
        )}
      </div>
    </div>
  )
}
