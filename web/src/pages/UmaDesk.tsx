import type { UmaArticleInput, UmaDeskArticle, UmaDeskView, UmaIssueCard, UmaSectionId } from '@pujosamiti/shared'
import { canEditUmaSection, UMA_SECTIONS, umaSection } from '@pujosamiti/shared'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'

import { BackLink } from '@/components/BackLink'
import { Field, inputCls } from '@/components/form'
import { LogoSpinner } from '@/components/LogoSpinner'
import { MarkdownArticle } from '@/components/MarkdownArticle'
import { SearchSelect } from '@/components/SearchSelect'
import { Seo } from '@/components/Seo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useMemberState } from '@/lib/member'
import { usePickerPeople } from '@/lib/people'
import { useMembersLite } from '@/lib/tasks'
import {
  createUmaArticle,
  createUmaIssue,
  deleteUmaArticle,
  deleteUmaIssue,
  mediaUrl,
  orderUmaIssue,
  publishUmaIssue,
  setUmaChief,
  setUmaSectionEditor,
  setUmaStatus,
  updateUmaArticle,
  updateUmaIssue,
  uploadUmaMedia,
  useUmaDesk,
} from '@/lib/uma'

const STATUS_BADGE: Record<UmaDeskArticle['status'], { label: string; variant?: 'genda' | 'aparajita' | 'palash' | 'durba' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'outline' },
  in_review: { label: 'In review', variant: 'genda' },
  accepted: { label: 'Accepted', variant: 'aparajita' },
  held: { label: 'On hold', variant: 'palash' },
  rejected: { label: 'Rejected', variant: 'outline' },
  published: { label: 'Published', variant: 'durba' },
}

const issueName = (i: UmaIssueCard) => i.title ?? `সংখ্যা ${i.number}`

/**
 * The intake/copy-edit form. Devs create drafts here from the Word/PDF/text
 * files members send the editors on WhatsApp; editors polish in the same form.
 */
function ArticleForm({
  initial,
  onDone,
  onCancel,
}: {
  initial: UmaDeskArticle | null
  onDone: () => void
  onCancel: () => void
}) {
  const [f, setF] = useState<UmaArticleInput>({
    slug: initial?.slug ?? '',
    section: initial?.section ?? 'stories',
    title: initial?.title ?? '',
    titleBn: initial?.titleBn ?? null,
    authorName: initial?.authorName ?? '',
    authorNameBn: initial?.authorNameBn ?? null,
    authorBio: initial?.authorBio ?? null,
    authorBioBn: initial?.authorBioBn ?? null,
    authorPersonId: initial?.authorPersonId ?? null,
    isGuest: initial?.isGuest ?? false,
    excerpt: initial?.excerpt ?? null,
    heroImage: initial?.heroImage ?? null,
    bodyMd: initial?.bodyMd ?? '',
    bodyMdAlt: initial?.bodyMdAlt ?? null,
    lang: initial?.lang ?? 'bn',
    submittedVia: initial?.submittedVia ?? 'whatsapp',
    submittedOn: initial?.submittedOn ?? new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10),
  })
  const [preview, setPreview] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const heroInput = useRef<HTMLInputElement>(null)
  const bodyImgInput = useRef<HTMLInputElement>(null)
  // Members roll for the optional byline link (any member route can read it)
  const { data: people } = useMembersLite()
  const set = (patch: Partial<UmaArticleInput>) => setF((v) => ({ ...v, ...patch }))

  const upload = async (file: File, into: 'hero' | 'body') => {
    setBusy(true)
    setError(null)
    try {
      const { url } = await uploadUmaMedia(file)
      if (into === 'hero') set({ heroImage: url })
      else set({ bodyMd: `${f.bodyMd.trimEnd()}\n\n![](${url})\n` })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      if (initial) await updateUmaArticle(initial.id, f)
      else await createUmaArticle(f)
      onDone()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initial ? `Edit — ${initial.title}` : 'New draft'}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title (English / transliterated)">
            <input className={inputCls} value={f.title} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="Title (Bengali)">
            <input className={inputCls} value={f.titleBn ?? ''} onChange={(e) => set({ titleBn: e.target.value || null })} />
          </Field>
          <Field label="Section">
            <select
              className={inputCls}
              value={f.section}
              onChange={(e) => set({ section: e.target.value as UmaSectionId })}
            >
              {UMA_SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.en} · {s.bn}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Main language">
            <select className={inputCls} value={f.lang} onChange={(e) => set({ lang: e.target.value as 'bn' | 'en' })}>
              <option value="bn">Bengali</option>
              <option value="en">English</option>
            </select>
          </Field>
          <Field label="Author (byline, as printed)">
            <input className={inputCls} value={f.authorName} onChange={(e) => set({ authorName: e.target.value })} />
          </Field>
          <Field label="Author in Bengali (byline on the বাংলা version)">
            <input
              className={inputCls}
              value={f.authorNameBn ?? ''}
              onChange={(e) => set({ authorNameBn: e.target.value || null })}
            />
          </Field>
          <Field label="Author bio — one line, optional">
            <input className={inputCls} value={f.authorBio ?? ''} onChange={(e) => set({ authorBio: e.target.value || null })} />
          </Field>
          <Field label="Author bio in Bengali">
            <input
              className={inputCls}
              value={f.authorBioBn ?? ''}
              onChange={(e) => set({ authorBioBn: e.target.value || null })}
            />
          </Field>
          <Field label="On the rolls? Link their person (optional)">
            <SearchSelect
              fullWidth
              align="left"
              ariaLabel="author person"
              options={[
                { value: '', label: '— not linked —' },
                ...(people ?? []).map((p) => ({ value: p.id, label: p.name })),
              ]}
              value={f.authorPersonId ?? ''}
              onChange={(v) => set({ authorPersonId: v || null, isGuest: v ? false : f.isGuest })}
            />
          </Field>
          <Field label="Guest writer?">
            <label className="flex h-10 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={f.isGuest}
                onChange={(e) => set({ isGuest: e.target.checked })}
                className="size-4"
              />
              Show the “অতিথি লেখক · Guest” tag
            </label>
          </Field>
          <Field label="URL slug (auto from title if left empty)">
            <input
              className={inputCls}
              value={f.slug ?? ''}
              onChange={(e) => set({ slug: e.target.value })}
              disabled={initial?.status === 'published'}
              placeholder="amar-pujo-smriti"
            />
          </Field>
          <Field label="Received">
            <div className="flex gap-2">
              <select
                className={inputCls}
                value={f.submittedVia ?? ''}
                onChange={(e) => set({ submittedVia: (e.target.value || null) as UmaArticleInput['submittedVia'] })}
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="">—</option>
              </select>
              <input
                type="date"
                className={inputCls}
                value={f.submittedOn ?? ''}
                onChange={(e) => set({ submittedOn: e.target.value || null })}
              />
            </div>
          </Field>
        </div>
        <Field label="Excerpt — the card teaser and the Google/WhatsApp preview line">
          <textarea
            className={cn(inputCls, 'min-h-16')}
            value={f.excerpt ?? ''}
            onChange={(e) => set({ excerpt: e.target.value || null })}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => heroInput.current?.click()} disabled={busy}>
            <ImagePlus /> {f.heroImage ? 'Replace hero image' : 'Hero image'}
          </Button>
          {f.heroImage && (
            <>
              <img src={mediaUrl(f.heroImage)} alt="" className="h-10 rounded border object-cover" />
              <Button size="sm" variant="ghost" onClick={() => set({ heroImage: null })}>
                remove
              </Button>
            </>
          )}
          <input
            ref={heroInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], 'hero')}
          />
        </div>
        <Field label="Body — markdown">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPreview((p) => !p)}>
                {preview ? <EyeOff /> : <Eye />} {preview ? 'Edit' : 'Preview'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => bodyImgInput.current?.click()} disabled={busy}>
                <ImagePlus /> Insert image
              </Button>
              <input
                ref={bodyImgInput}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], 'body')}
              />
            </div>
            {preview ? (
              <div className="rounded-md border p-4">
                <MarkdownArticle markdown={f.bodyMd} resolveImage={(src) => mediaUrl(src) ?? null} />
                {f.bodyMdAlt && (
                  <>
                    <hr className="my-4" />
                    <MarkdownArticle markdown={f.bodyMdAlt} resolveImage={(src) => mediaUrl(src) ?? null} />
                  </>
                )}
              </div>
            ) : (
              <textarea
                className={cn(inputCls, 'min-h-72 font-mono text-xs')}
                value={f.bodyMd}
                onChange={(e) => set({ bodyMd: e.target.value })}
              />
            )}
          </div>
        </Field>
        {!preview && (
          <Field label={`Body — ${f.lang === 'bn' ? 'English' : 'Bengali'} translation (optional; adds বাংলা/English pills on the page)`}>
            <textarea
              className={cn(inputCls, 'min-h-48 font-mono text-xs')}
              value={f.bodyMdAlt ?? ''}
              onChange={(e) => set({ bodyMdAlt: e.target.value || null })}
            />
          </Field>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={save} disabled={busy}>
            {initial ? 'Save' : 'Create draft'}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/** Accept-into-sankhya / hold / reject — the verdict row on a queue card. */
function VerdictRow({
  article,
  issues,
  onDone,
  onError,
}: {
  article: UmaDeskArticle
  issues: UmaIssueCard[]
  onDone: () => void
  onError: (m: string) => void
}) {
  const drafts = issues.filter((i) => i.status === 'draft')
  const [issueId, setIssueId] = useState<string>(drafts[0]?.id ?? '')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const act = async (status: 'accepted' | 'held' | 'rejected' | 'in_review') => {
    setBusy(true)
    try {
      await setUmaStatus(article.id, { status, issueId: status === 'accepted' ? issueId : null, editorNote: note || null })
      onDone()
    } catch (e) {
      onError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {drafts.length > 0 ? (
          <>
            <select className={cn(inputCls, 'w-auto')} value={issueId} onChange={(e) => setIssueId(e.target.value)}>
              {drafts.map((i) => (
                <option key={i.id} value={i.id}>
                  {issueName(i)}
                </option>
              ))}
            </select>
            <Button size="sm" variant="durba" onClick={() => act('accepted')} disabled={busy || !issueId}>
              Accept
            </Button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">No open sankhya to accept into — create one first.</span>
        )}
        {article.status !== 'held' && (
          <Button size="sm" variant="outline" onClick={() => act('held')} disabled={busy}>
            Hold
          </Button>
        )}
        {article.status !== 'rejected' && (
          <Button size="sm" variant="outline" onClick={() => act('rejected')} disabled={busy}>
            Reject
          </Button>
        )}
        {(article.status === 'draft' || article.status === 'held' || article.status === 'rejected') && (
          <Button size="sm" variant="outline" onClick={() => act('in_review')} disabled={busy}>
            To review queue
          </Button>
        )}
      </div>
      <input
        className={inputCls}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Editor's note — reason for hold/reject, remarks (internal)"
      />
    </div>
  )
}

function DeskArticleCard({
  a,
  issues,
  isAdmin,
  mine,
  onEdit,
  onChanged,
  onError,
}: {
  a: UmaDeskArticle
  issues: UmaIssueCard[]
  isAdmin: boolean
  /** false when this article's section belongs to another editor */
  mine: boolean
  onEdit: () => void
  onChanged: () => void
  onError: (m: string) => void
}) {
  const [showBody, setShowBody] = useState(false)
  const s = umaSection(a.section)
  const badge = STATUS_BADGE[a.status]
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={badge.variant}>{badge.label}</Badge>
          <span className="text-xs text-muted-foreground">
            {s?.en}
            {a.issueNumber != null && ` · ${a.issueTitle ?? `সংখ্যা ${a.issueNumber}`}`}
          </span>
        </div>
        <CardTitle className="font-serif text-lg">{a.titleBn ?? a.title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {a.title !== (a.titleBn ?? a.title) && <span className="mr-2">{a.title}</span>}
          by {a.authorName}
          {a.isGuest && ' (guest)'}
          {a.submittedOn && ` · via ${a.submittedVia ?? '—'}, ${a.submittedOn}`} · {a.readingMinutes} min
        </p>
        {a.editorNote && <p className="text-xs text-shiuli">✎ {a.editorNote}</p>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowBody((v) => !v)}>
            {showBody ? <EyeOff /> : <Eye />} {showBody ? 'Close preview' : 'Preview'}
          </Button>
          {mine && a.status !== 'published' && (
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil /> Edit
            </Button>
          )}
          {!mine && (
            <span className="self-center text-xs text-muted-foreground">
              {umaSection(a.section)?.en}'s editor handles this one
            </span>
          )}
          {isAdmin && a.status !== 'published' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                try {
                  await deleteUmaArticle(a.id)
                  onChanged()
                } catch (e) {
                  onError((e as Error).message)
                }
              }}
            >
              <Trash2 /> Delete
            </Button>
          )}
        </div>
        {showBody && (
          <div className="rounded-md border p-4" lang={a.lang}>
            {a.heroImage && <img src={mediaUrl(a.heroImage)} alt="" className="mb-3 w-full rounded-lg border object-cover" />}
            <MarkdownArticle markdown={a.bodyMd} resolveImage={(src) => mediaUrl(src) ?? null} />
          </div>
        )}
        {mine && a.status !== 'published' && <VerdictRow article={a} issues={issues} onDone={onChanged} onError={onError} />}
      </CardContent>
    </Card>
  )
}

function IssuePanel({
  issue,
  articles,
  isChief,
  onChanged,
  onError,
}: {
  issue: UmaIssueCard
  articles: UmaDeskArticle[]
  isChief: boolean
  onChanged: () => void
  onError: (m: string) => void
}) {
  const inIssue = articles
    .filter((a) => a.issueId === issue.id)
    .sort((x, y) => x.sortOrder - y.sortOrder)
  const [title, setTitle] = useState(issue.title ?? '')
  const [editorial, setEditorial] = useState(issue.editorialNote ?? '')
  const [busy, setBusy] = useState(false)
  const coverInput = useRef<HTMLInputElement>(null)

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    try {
      await fn()
      onChanged()
    } catch (e) {
      onError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const saveMeta = (coverImage = issue.coverImage) =>
    run(() =>
      updateUmaIssue(issue.id, { number: issue.number, title: title || null, coverImage, editorialNote: editorial || null }),
    )
  const move = (idx: number, dir: -1 | 1) => {
    const ids = inIssue.map((a) => a.id)
    const j = idx + dir
    if (j < 0 || j >= ids.length) return
    ;[ids[idx], ids[j]] = [ids[j]!, ids[idx]!]
    void run(() => orderUmaIssue(issue.id, ids))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="font-serif">{issueName(issue)}</CardTitle>
          <Badge variant={issue.status === 'published' ? 'durba' : 'genda'}>
            {issue.status === 'published' ? `Published ${issue.publishedOn}` : 'Draft'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isChief && issue.status === 'draft' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Theme name (optional — e.g. শারদীয়া সংখ্যা)">
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Cover image">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => coverInput.current?.click()} disabled={busy}>
                  <ImagePlus /> {issue.coverImage ? 'Replace' : 'Upload'}
                </Button>
                {issue.coverImage && <img src={mediaUrl(issue.coverImage)} alt="" className="h-10 rounded border" />}
                <input
                  ref={coverInput}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setBusy(true)
                    try {
                      const { url } = await uploadUmaMedia(file)
                      await saveMeta(url)
                    } catch (err) {
                      onError((err as Error).message)
                      setBusy(false)
                    }
                  }}
                />
              </div>
            </Field>
            <Field label="সম্পাদকীয় — from the editor's desk (markdown)">
              <textarea className={cn(inputCls, 'min-h-24 sm:col-span-2')} value={editorial} onChange={(e) => setEditorial(e.target.value)} />
            </Field>
          </div>
        )}
        <div className="flex flex-col gap-1">
          {inIssue.length === 0 && <p className="text-sm text-muted-foreground">No articles slotted yet — accept some from the queue.</p>}
          {inIssue.map((a, i) => (
            <div key={a.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <span className="flex-1">
                {a.titleBn ?? a.title} <span className="text-muted-foreground">— {a.authorName}</span>
              </span>
              <Badge variant={STATUS_BADGE[a.status].variant}>{STATUS_BADGE[a.status].label}</Badge>
              {isChief && (
                <>
                  <Button size="icon" variant="ghost" className="size-8" onClick={() => move(i, -1)} disabled={busy || i === 0}>
                    <ArrowUp />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => move(i, 1)}
                    disabled={busy || i === inIssue.length - 1}
                  >
                    <ArrowDown />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
        {isChief && (
          <div className="flex flex-wrap gap-2">
            {issue.status === 'draft' ? (
              <>
                <Button size="sm" variant="outline" onClick={() => saveMeta()} disabled={busy}>
                  Save details
                </Button>
                <Button size="sm" onClick={() => run(() => publishUmaIssue(issue.id))} disabled={busy || inIssue.length === 0}>
                  Publish this sankhya
                </Button>
                <Button size="sm" variant="ghost" onClick={() => run(() => deleteUmaIssue(issue.id))} disabled={busy}>
                  <Trash2 /> Delete
                </Button>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Published on {issue.publishedOn} — a sankhya, once out, stays out. Order it as you
                like; corrections are made by editing the pieces themselves.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** Admin-only: seat the masthead — one chief editor, one editor per section. */
function MastheadPanel({ desk, onChanged, onError }: { desk: UmaDeskView; onChanged: () => void; onError: (m: string) => void }) {
  const { data: people } = usePickerPeople()
  const core = (people ?? []).filter((p) => p.tier === 'core' && p.isActive)
  const options = core.map((p) => ({ value: p.id, label: p.name }))
  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn()
      onChanged()
    } catch (e) {
      onError((e as Error).message)
    }
  }
  const held = desk.masthead.seats.filter((s) => s.personId).length
  return (
    <Card>
      <CardHeader>
        <CardTitle>The masthead</CardTitle>
        <p className="text-sm text-muted-foreground">
          One chief editor, and one editor per section — active core members only. A section's editor
          runs that section's queue and nothing outside it; one person may hold several. The chief
          editor composes and publishes sankhyas.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-40 text-sm font-medium">
            Chief editor <span className="font-normal text-muted-foreground">সম্পাদক</span>
          </span>
          <SearchSelect
            className="min-w-56 flex-1"
            fullWidth
            align="left"
            ariaLabel="chief editor"
            placeholder="unassigned"
            options={options}
            value={desk.masthead.chief?.id ?? null}
            onChange={(v) => void run(() => setUmaChief(v))}
          />
          {desk.masthead.chief && (
            <Button size="sm" variant="ghost" onClick={() => void run(() => setUmaChief(null))}>
              clear
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Section editors — {held} of {desk.masthead.seats.length} seated
        </p>
        <div className="flex flex-col gap-2">
          {desk.masthead.seats.map((seat) => {
            const sec = umaSection(seat.section)
            return (
              <div key={seat.section} className="flex flex-wrap items-center gap-2">
                <span className="min-w-40 text-sm">
                  {sec?.en ?? seat.section}{' '}
                  <span className="text-muted-foreground">{sec?.bn}</span>
                </span>
                <SearchSelect
                  className="min-w-56 flex-1"
                  fullWidth
                  align="left"
                  ariaLabel={`${sec?.en ?? seat.section} editor`}
                  placeholder="unassigned"
                  options={options}
                  value={seat.personId}
                  onChange={(v) => void run(() => setUmaSectionEditor(seat.section, v))}
                />
                {seat.personId && (
                  <Button size="sm" variant="ghost" onClick={() => void run(() => setUmaSectionEditor(seat.section, null))}>
                    clear
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

type Tab = 'queue' | 'articles' | 'issues' | 'masthead'

export function UmaDesk() {
  const queryClient = useQueryClient()
  const { memberState } = useMemberState()
  const me = memberState?.status === 'member' ? memberState.me : null
  const canSee = !!me && (me.role === 'admin' || !!me.umaRole || me.umaSections.length > 0)
  /** Articles in the sections this person holds — the chief and admins hold all. */
  const mineFor = (section: string) => !!me && canEditUmaSection(me, section)
  const isChief = !!me && (me.role === 'admin' || me.umaRole === 'chief_editor')
  const isAdmin = me?.role === 'admin'
  const { data: desk, isPending } = useUmaDesk(canSee)
  const [tab, setTab] = useState<Tab>('queue')
  const [editing, setEditing] = useState<UmaDeskArticle | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<UmaDeskArticle['status'] | 'all'>('all')
  const [newNumber, setNewNumber] = useState('')

  const refresh = () => {
    setError(null)
    setEditing(null)
    setCreating(false)
    void queryClient.invalidateQueries({ queryKey: ['uma'] })
  }

  if (!me || !canSee) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <Card>
          <CardHeader>
            <CardTitle>Uma · Editorial Desk</CardTitle>
            <p className="text-sm text-muted-foreground">
              The desk is for the Uma masthead — the chief editor and editors an admin has seated.
            </p>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const queue = desk?.articles.filter((a) => a.status === 'in_review') ?? []
  const filtered =
    statusFilter === 'all' ? (desk?.articles ?? []) : (desk?.articles ?? []).filter((a) => a.status === statusFilter)
  const nextNumber = desk?.issues.length ? Math.max(...desk.issues.map((i) => i.number)) + 1 : 1

  const tabs: { id: Tab; label: string }[] = [
    { id: 'queue', label: `Queue${queue.length ? ` (${queue.length})` : ''}` },
    { id: 'articles', label: 'All articles' },
    { id: 'issues', label: 'Sankhyas' },
    ...(isAdmin ? [{ id: 'masthead' as Tab, label: 'Masthead' }] : []),
  ]

  return (
    <div className="flex flex-col gap-4">
      <Seo title="Uma · Editorial Desk" description="The Uma magazine editorial workspace." path="/uma-desk" noindex />
      <BackLink />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">
          উমা · Editorial Desk
        </h1>
        <Button size="sm" onClick={() => (setCreating(true), setEditing(null))}>
          <Plus /> New draft
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm',
              tab === t.id ? 'border-transparent bg-primary font-semibold text-primary-foreground' : 'hover:bg-accent',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {(creating || editing) && <ArticleForm initial={editing} onDone={refresh} onCancel={() => (setCreating(false), setEditing(null))} />}
      {isPending || !desk ? (
        <LogoSpinner />
      ) : tab === 'queue' ? (
        <div className="flex flex-col gap-3">
          {queue.length === 0 && (
            <p className="text-sm text-muted-foreground">
              The review queue is empty. New submissions (WhatsApp/email → converted with “New draft”) land here once
              sent to review.
            </p>
          )}
          {queue.map((a) => (
            <DeskArticleCard
              key={a.id}
              a={a}
              issues={desk.issues}
              isAdmin={isAdmin}
              mine={mineFor(a.section)}
              onEdit={() => (setEditing(a), setCreating(false))}
              onChanged={refresh}
              onError={setError}
            />
          ))}
        </div>
      ) : tab === 'articles' ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'draft', 'in_review', 'accepted', 'held', 'rejected', 'published'] as const).map((sf) => (
              <button
                key={sf}
                type="button"
                onClick={() => setStatusFilter(sf)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs',
                  statusFilter === sf ? 'border-transparent bg-primary font-semibold text-primary-foreground' : 'hover:bg-accent',
                )}
              >
                {sf === 'all' ? 'All' : STATUS_BADGE[sf].label}
              </button>
            ))}
          </div>
          {filtered.map((a) => (
            <DeskArticleCard
              key={a.id}
              a={a}
              issues={desk.issues}
              isAdmin={isAdmin}
              mine={mineFor(a.section)}
              onEdit={() => (setEditing(a), setCreating(false))}
              onChanged={refresh}
              onError={setError}
            />
          ))}
        </div>
      ) : tab === 'issues' ? (
        <div className="flex flex-col gap-3">
          {isChief && (
            <div className="flex items-end gap-2">
              <Field label="New sankhya — number">
                <input
                  className={cn(inputCls, 'w-28')}
                  type="number"
                  min={1}
                  value={newNumber || String(nextNumber)}
                  onChange={(e) => setNewNumber(e.target.value)}
                />
              </Field>
              <Button
                size="sm"
                className="mb-0.5"
                onClick={async () => {
                  try {
                    await createUmaIssue({ number: Number(newNumber || nextNumber), title: null, coverImage: null, editorialNote: null })
                    setNewNumber('')
                    refresh()
                  } catch (e) {
                    setError((e as Error).message)
                  }
                }}
              >
                <Plus /> Open sankhya
              </Button>
            </div>
          )}
          {desk.issues.map((i) => (
            <IssuePanel key={i.id} issue={i} articles={desk.articles} isChief={isChief} onChanged={refresh} onError={setError} />
          ))}
        </div>
      ) : (
        <MastheadPanel desk={desk} onChanged={refresh} onError={setError} />
      )}
    </div>
  )
}
