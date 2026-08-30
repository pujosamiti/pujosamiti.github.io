import type { UmaArticleCard, UmaArticleView, UmaIssueCard } from '@pujosamiti/shared'
import { UMA_SECTIONS, umaSection } from '@pujosamiti/shared'
import { Check, ChevronLeft, Copy, Share2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'

import seal from '@/assets/logo-bw-solid.png'

import { LogoSpinner } from '@/components/LogoSpinner'
import { MarkdownArticle } from '@/components/MarkdownArticle'
import { Seo } from '@/components/Seo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  DIGIT_TONES,
  mediaUrl,
  readMyReactions,
  sendReaction,
  useUmaArticle,
  useUmaHome,
  useUmaIssue,
  useUmaSection,
  writeMyReactions,
} from '@/lib/uma'
import { UMA_MAX_CLAPS } from '@pujosamiti/shared'
import { MiniSudoku } from '@/pages/UmaSudoku'

/**
 * Section → brand tone (tokens in index.css), in the sections' editorial
 * order so neighbouring chips alternate hue families: purple, pink, blue,
 * yellow, green, orange, indigo, earth, pink, red.
 */
const SECTION_TONE: Record<string, string> = {
  art: 'jarul',
  fashion: 'padma',
  stories: 'sharat',
  games: 'genda',
  travel: 'durba',
  recipes: 'shiuli',
  health: 'aparajita',
  mythology: 'matir',
  poetry: 'padma',
  commentary: 'jaba',
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null

const issueName = (i: { number: number; title: string | null }) => i.title ?? `সংখ্যা ${i.number}`

/** How many editions the front page shows before sending you to the archive. */
const ARCHIVE_PREVIEW = 6

/** Bengali pieces lead with their Bengali title; the other becomes the subtitle. */
const headlineOf = (a: { title: string; titleBn: string | null; lang: 'bn' | 'en' }) => ({
  main: a.lang === 'bn' ? (a.titleBn ?? a.title) : a.title,
  sub: a.lang === 'bn' ? (a.titleBn ? a.title : null) : a.titleBn,
})

function MagazineMast({ sub }: { sub?: string }) {
  return (
    <header className="flex flex-col items-center gap-1 border-b pb-4 text-center">
      <Link to="/uma" className="font-serif text-5xl font-bold text-primary">
        উমা
      </Link>
      <p className="text-sm text-muted-foreground">Uma · the samiti magazine · Magarpatta City, Pune</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </header>
  )
}

function SectionChips({ active }: { active?: string }) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {UMA_SECTIONS.map((s) => (
        <Link
          key={s.id}
          to={`/uma/bibhag/${s.id}`}
          style={{ '--tone': `var(--${SECTION_TONE[s.id]})` } as React.CSSProperties}
          className={cn(
            'rounded-full border px-2.5 py-1 text-xs',
            // a stronger tint + tone border marks the active chip — full-hue fills
            // can't carry readable text across yellow AND indigo
            active === s.id
              ? 'border-[var(--tone)] font-semibold [background:color-mix(in_srgb,var(--tone)_28%,var(--card))]'
              : 'border-[color-mix(in_srgb,var(--tone)_35%,var(--border))] [background:color-mix(in_srgb,var(--tone)_14%,var(--card))] hover:[background:color-mix(in_srgb,var(--tone)_26%,var(--card))]',
          )}
        >
          {s.bn} · {s.en}
        </Link>
      ))}
    </div>
  )
}

function ArticleCard({ a }: { a: UmaArticleCard }) {
  const s = umaSection(a.section)
  const { main, sub } = headlineOf(a)
  const hero = mediaUrl(a.heroImage)
  return (
    <Link to={`/uma/${a.slug}`}>
      <Card className="h-full overflow-hidden pt-0 transition-shadow hover:shadow-md">
        {hero && <img src={hero} alt="" loading="lazy" className="aspect-video w-full object-cover" />}
        <CardHeader className={cn(!hero && 'pt-6')}>
          <span
            className="text-xs font-medium"
            style={{ color: `var(--${SECTION_TONE[a.section] ?? 'jaba'})` }}
          >
            {s ? `${s.bn} · ${s.en}` : a.section}
          </span>
          <CardTitle className="font-serif text-lg leading-snug">{main}</CardTitle>
          {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
          {a.excerpt && <p className="line-clamp-3 text-sm text-muted-foreground">{a.excerpt}</p>}
          <p className="pt-1 text-xs text-muted-foreground">
            {a.authorName}
            {a.isGuest && (
              <Badge variant="palash" className="ml-1.5 align-middle">
                অতিথি
              </Badge>
            )}
            <span className="px-1.5">·</span>
            {a.readingMinutes} min read
            {(a.hearts > 0 || a.claps > 0) && (
              <>
                <span className="px-1.5">·</span>
                {a.hearts > 0 && <span className="mr-1.5">❤️ {a.hearts}</span>}
                {a.claps > 0 && <span>👏 {a.claps}</span>}
              </>
            )}
          </p>
        </CardHeader>
      </Card>
    </Link>
  )
}

/** One edition, for the archive and the strip under the current issue. */
function IssueCard({ issue, current = false }: { issue: UmaIssueCard; current?: boolean }) {
  const cover = mediaUrl(issue.coverImage)
  return (
    <Link to={`/uma/sankhya/${issue.number}`}>
      <Card className="h-full overflow-hidden pt-0 transition-shadow hover:shadow-md">
        {cover ? (
          <img src={cover} alt="" loading="lazy" className="aspect-[3/2] w-full object-cover" />
        ) : (
          // No cover yet — the masthead itself stands in, so the card is never bald
          <div className="flex aspect-[3/2] w-full flex-col items-center justify-center gap-1 [background:color-mix(in_srgb,var(--jaba)_7%,var(--card))]">
            <img src={seal} alt="" aria-hidden="true" width={56} height={56} className="size-14 opacity-70" />
            <span className="font-serif text-2xl font-bold text-primary">উমা</span>
          </div>
        )}
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="font-serif text-lg">{issueName(issue)}</CardTitle>
            {current && <Badge variant="genda">এই সংখ্যা</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">
            {[fmtDate(issue.publishedOn), `${issue.articleCount} pieces`].filter(Boolean).join(' · ')}
          </p>
        </CardHeader>
      </Card>
    </Link>
  )
}

/**
 * ধাঁধা has no articles — the section IS the game — so the issue's grid would
 * skip it entirely. This card stands in for it, and lands in the same slot the
 * section chips put it in.
 */
function GameCard() {
  return (
    <Link to="/uma/bibhag/games">
      <Card className="h-full overflow-hidden pt-0 transition-shadow hover:shadow-md">
        <div className="flex aspect-video w-full items-center justify-center gap-1.5 [background:color-mix(in_srgb,var(--genda)_12%,var(--card))]">
          {DIGIT_TONES.map((tone, v) => (
            <span
              key={tone}
              style={{ '--tone': `var(--${tone})` } as React.CSSProperties}
              className="flex size-8 items-center justify-center rounded-md border text-base font-bold [background:color-mix(in_srgb,var(--tone)_24%,var(--card))] sm:size-10 sm:text-lg"
            >
              {v + 1}
            </span>
          ))}
        </div>
        <CardHeader>
          <span className="text-xs font-medium" style={{ color: 'var(--genda)' }}>
            ধাঁধা · Games &amp; Puzzles
          </span>
          <CardTitle className="font-serif text-lg leading-snug">উমা Mini Sudoku</CardTitle>
          <p className="text-sm text-muted-foreground">
            ছয়ে ছয়ে ছোট্ট এক ধাঁধা — প্রতিটি সারি, কলাম আর ২×৩ ঘরে ১ থেকে ৬ বসাতে হবে।
          </p>
          <p className="line-clamp-3 text-sm text-muted-foreground">
            A little 6×6: every row, column and box needs the digits 1 to 6 exactly once. No guessing
            ever needed.
          </p>
          <p className="pt-1 text-xs font-medium text-primary">খেলুন · Play</p>
        </CardHeader>
      </Card>
    </Link>
  )
}

function IssueBlock({ issue, articles }: { issue: UmaIssueCard; articles: UmaArticleCard[] }) {
  // Slot the puzzle where ধাঁধা sits in the section order, not at the end
  const order = UMA_SECTIONS.map((s) => s.id) as string[]
  const gamesAt = order.indexOf('games')
  const beforeGames = articles.filter((a) => order.indexOf(a.section) < gamesAt)
  const afterGames = articles.filter((a) => order.indexOf(a.section) > gamesAt)
  const cover = mediaUrl(issue.coverImage)
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-serif text-2xl font-bold">{issueName(issue)}</h2>
        {issue.publishedOn && <span className="text-xs text-muted-foreground">{fmtDate(issue.publishedOn)}</span>}
      </div>
      {cover && <img src={cover} alt={issueName(issue)} className="w-full rounded-xl border object-cover shadow-sm" />}
      {issue.editorialNote && (
        <Card>
          <CardHeader className="items-center text-center">
            <img
              src={seal}
              alt=""
              aria-hidden="true"
              width={88}
              height={88}
              className="mx-auto size-20 opacity-85"
            />
            <CardTitle className="font-serif text-base text-shiuli">সম্পাদকীয় · From the editors' desk</CardTitle>
          </CardHeader>
          <CardContent>
            <MarkdownArticle markdown={issue.editorialNote} resolveImage={(src) => mediaUrl(src) ?? null} />
          </CardContent>
        </Card>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {beforeGames.map((a) => (
          <ArticleCard key={a.slug} a={a} />
        ))}
        <GameCard />
        {afterGames.map((a) => (
          <ArticleCard key={a.slug} a={a} />
        ))}
      </div>
    </section>
  )
}

export function UmaHome() {
  const { data, isPending } = useUmaHome()
  const masthead = data?.masthead
  const mastLine = masthead?.chief
    ? `সম্পাদনা · ${masthead.chief}${masthead.editors.length ? ` — with ${masthead.editors.join(' & ')}` : ''}`
    : undefined
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Seo
        title="Uma · উমা — the samiti magazine"
        description="Uma (উমা) — the Magarpatta pujo samiti magazine: stories, poetry, commentary, mythology, recipes, travel and art from the samiti families of Pune."
        path="/uma"
      />
      <MagazineMast sub={mastLine} />
      <SectionChips />
      {isPending ? (
        <LogoSpinner />
      ) : !data?.latest ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">প্রথম সংখ্যা আসছে…</CardTitle>
            <p className="text-sm text-muted-foreground">
              The first Sankhya is being put together. Samiti members — send your stories, poems, recipes and art to
              the editors on WhatsApp, and watch this page.
            </p>
          </CardHeader>
        </Card>
      ) : (
        <>
          <IssueBlock issue={data.latest} articles={data.latest.articles} />
          <section className="flex flex-col gap-3 border-t pt-5">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-serif text-xl font-bold">সব সংখ্যা · All issues</h3>
              {data.issues.length > ARCHIVE_PREVIEW && (
                <Link to="/uma/sankhya" className="text-sm font-medium text-primary">
                  সব দেখুন →
                </Link>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {data.issues.slice(0, ARCHIVE_PREVIEW).map((i) => (
                <IssueCard key={i.id} issue={i} current={i.number === data.latest!.number} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

/** /uma/sankhya — every edition, newest first. */
export function UmaArchive() {
  const { data, isPending } = useUmaHome()
  const issues = data?.issues ?? []
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Seo
        title="সব সংখ্যা · All issues · Uma magazine"
        description="Every issue of Uma (উমা), the Magarpatta pujo samiti magazine — stories, poetry, recipes, travel, mythology and commentary, in Bengali and English."
        path="/uma/sankhya"
      />
      <MagazineMast />
      <SectionChips />
      <h2 className="font-serif text-2xl font-bold">সব সংখ্যা · All issues</h2>
      {isPending ? (
        <LogoSpinner />
      ) : issues.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          কোনও সংখ্যা এখনও প্রকাশিত হয়নি — প্রথমটি আসছে।
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {issues.map((i, idx) => (
            <IssueCard key={i.id} issue={i} current={idx === 0} />
          ))}
        </div>
      )}
    </div>
  )
}

export function UmaIssue() {
  const { number } = useParams()
  const { data, isPending } = useUmaIssue(number ? Number(number) : null)
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Seo
        title={data ? `${issueName(data)} · Uma magazine` : 'Uma magazine'}
        description={`Uma সংখ্যা ${number} — the Magarpatta pujo samiti magazine.`}
        path={`/uma/sankhya/${number}`}
        image={mediaUrl(data?.coverImage)}
      />
      <MagazineMast />
      {isPending ? (
        <LogoSpinner />
      ) : !data ? (
        <p className="text-center text-sm text-muted-foreground">This Sankhya doesn't exist (yet).</p>
      ) : (
        <IssueBlock issue={data} articles={data.articles} />
      )}
    </div>
  )
}

export function UmaSectionPage() {
  const { section } = useParams()
  const s = section ? umaSection(section) : undefined
  const { data, isPending } = useUmaSection(s ? section : undefined)
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Seo
        title={s ? `${s.en} · ${s.bn} · Uma magazine` : 'Uma magazine'}
        description={s ? `${s.en} (${s.bn}) in Uma — the Magarpatta pujo samiti magazine.` : 'Uma magazine section.'}
        path={`/uma/bibhag/${section}`}
      />
      <MagazineMast />
      <SectionChips active={section} />
      {/* ধাঁধা leads with the interactive game; printed puzzles list below like any section */}
      {section === 'games' && <MiniSudoku />}
      {!s ? (
        <p className="text-center text-sm text-muted-foreground">No such section.</p>
      ) : isPending ? (
        <LogoSpinner />
      ) : !data?.length ? (
        section !== 'games' && (
          <p className="text-center text-sm text-muted-foreground">
            Nothing in {s.bn} yet — send the editors something for the next Sankhya!
          </p>
        )
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.map((a) => (
            <ArticleCard key={a.slug} a={a} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Hearts & claps — the only reactions Uma has. A heart says "awesome" (one per
 * reader, tap again to take it back); claps say "liked it", Medium-style: tap
 * away, up to 21. Anonymous; this browser remembers what you gave.
 */
function ReactionsBar({ article }: { article: UmaArticleView }) {
  const [mine, setMine] = useState(() => readMyReactions(article.slug))
  const [shown, setShown] = useState({ hearts: article.hearts, claps: article.claps })
  const pending = useRef({ hearts: 0, claps: 0 })
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const flush = () => {
    const delta = pending.current
    pending.current = { hearts: 0, claps: 0 }
    if (!delta.hearts && !delta.claps) return
    sendReaction({ slug: article.slug, ...delta })
      .then((counts) => setShown(counts))
      .catch(() => {})
  }
  // Claps arrive in bursts — batch them into one request per pause.
  const queue = (d: { hearts?: number; claps?: number }) => {
    pending.current.hearts += d.hearts ?? 0
    pending.current.claps += d.claps ?? 0
    clearTimeout(timer.current)
    timer.current = setTimeout(flush, 700)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  const toggleHeart = () => {
    const on = mine.hearts === 1
    const next = { ...mine, hearts: on ? 0 : 1 } as typeof mine
    setMine(next)
    writeMyReactions(article.slug, next)
    setShown((s) => ({ ...s, hearts: Math.max(0, s.hearts + (on ? -1 : 1)) }))
    queue({ hearts: on ? -1 : 1 })
  }
  const clap = () => {
    if (mine.claps >= UMA_MAX_CLAPS) return
    const next = { ...mine, claps: mine.claps + 1 }
    setMine(next)
    writeMyReactions(article.slug, next)
    setShown((s) => ({ ...s, claps: s.claps + 1 }))
    queue({ claps: 1 })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleHeart}
        aria-pressed={mine.hearts === 1}
        title="Heart — awesome!"
        className={cn(
          'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
          mine.hearts === 1 ? 'border-primary bg-primary/10 font-semibold' : 'hover:bg-accent',
        )}
      >
        ❤️ {shown.hearts}
      </button>
      <button
        type="button"
        onClick={clap}
        title={mine.claps >= UMA_MAX_CLAPS ? `You clapped ${UMA_MAX_CLAPS} times — thank you!` : 'Clap — liked it (tap away!)'}
        className={cn(
          'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors active:scale-110',
          mine.claps > 0 ? 'border-genda bg-genda/10 font-semibold' : 'hover:bg-accent',
        )}
      >
        👏 {shown.claps}
        {mine.claps > 0 && <span className="text-xs text-muted-foreground">+{mine.claps}</span>}
      </button>
    </div>
  )
}

function ShareBar({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false)
  const url = `https://pujosamiti.github.io${path}`
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard blocked — the WhatsApp button still carries the link
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="durba" size="sm" asChild>
        <a
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} — উমা, the samiti magazine\n${url}`)}`}
          target="_blank"
          rel="noreferrer"
        >
          <Share2 /> WhatsApp
        </a>
      </Button>
      <Button variant="outline" size="sm" onClick={copy}>
        {copied ? <Check /> : <Copy />} {copied ? 'Copied' : 'Copy link'}
      </Button>
      {typeof navigator.share === 'function' && (
        <Button variant="outline" size="sm" onClick={() => navigator.share({ title, url }).catch(() => {})}>
          <Share2 /> Share
        </Button>
      )}
    </div>
  )
}

export function UmaArticle() {
  const { slug } = useParams()
  const { data: a, isPending, isError } = useUmaArticle(slug)
  // null = the article's own primary language; a pill tap overrides per article
  const [viewLang, setViewLang] = useState<'bn' | 'en' | null>(null)
  useEffect(() => setViewLang(null), [slug])
  const s = a ? umaSection(a.section) : undefined
  const hasAlt = !!a?.bodyMdAlt
  const shownLang: 'bn' | 'en' = (hasAlt ? (viewLang ?? a!.lang) : a?.lang) ?? 'bn'
  const main = a ? (shownLang === 'bn' ? (a.titleBn ?? a.title) : a.title) : ''
  const sub = a ? (shownLang === 'bn' ? (a.titleBn ? a.title : null) : a.titleBn) : null
  const body = a ? (shownLang === a.lang ? a.bodyMd : (a.bodyMdAlt ?? a.bodyMd)) : ''
  const hero = mediaUrl(a?.heroImage)
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Seo
        title={a ? `${a.title} · Uma magazine` : 'Uma magazine'}
        description={a?.excerpt ?? (a ? `${a.title} — by ${a.authorName}, in Uma, the samiti magazine.` : 'Uma — the samiti magazine.')}
        path={`/uma/${slug}`}
        type="article"
        image={hero}
      />
      <div className="flex items-center justify-between gap-2">
        <Link to="/uma" className="flex items-center gap-1 text-sm font-medium text-primary">
          <ChevronLeft className="size-4" /> উমা · Uma
        </Link>
        {a?.issueNumber != null && (
          <Link to={`/uma/sankhya/${a.issueNumber}`} className="text-xs text-muted-foreground underline">
            {a.issueTitle ?? `সংখ্যা ${a.issueNumber}`}
          </Link>
        )}
      </div>
      {isPending ? (
        <LogoSpinner />
      ) : isError || !a ? (
        <p className="text-sm text-muted-foreground">This article isn't here — it may not be published yet.</p>
      ) : (
        <>
          {hasAlt && (
            <div className="flex gap-1.5" role="group" aria-label="Article language">
              {(a.lang === 'bn' ? (['bn', 'en'] as const) : (['en', 'bn'] as const)).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setViewLang(l)}
                  className={cn(
                    'rounded-full border px-3.5 py-1 text-sm',
                    shownLang === l
                      ? 'border-transparent bg-primary font-semibold text-primary-foreground'
                      : 'hover:bg-accent',
                  )}
                >
                  {l === 'bn' ? 'বাংলা' : 'English'}
                </button>
              ))}
            </div>
          )}
          <header className="flex flex-col gap-1.5 border-b pb-4" lang={shownLang}>
            {s && (
              <Link
                to={`/uma/bibhag/${a.section}`}
                className="text-xs font-medium"
                style={{ color: `var(--${SECTION_TONE[a.section] ?? 'jaba'})` }}
              >
                {s.bn} · {s.en}
              </Link>
            )}
            <h1 className="font-serif text-3xl font-bold text-primary md:text-4xl">{main}</h1>
            {sub && <p className="font-serif text-xl text-shiuli">{sub}</p>}
            <p className="text-sm text-muted-foreground">
              {shownLang === 'bn' ? 'লিখেছেন' : 'by'} ·{' '}
              <span className="font-medium text-foreground">
                {shownLang === 'bn' ? (a.authorNameBn ?? a.authorName) : a.authorName}
              </span>
              {a.isGuest && (
                <Badge variant="palash" className="ml-1.5 align-middle">
                  অতিথি লেখক · Guest
                </Badge>
              )}
            </p>
            {(shownLang === 'bn' ? (a.authorBioBn ?? a.authorBio) : a.authorBio) && (
              <p className="text-xs text-muted-foreground">
                {shownLang === 'bn' ? (a.authorBioBn ?? a.authorBio) : a.authorBio}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {fmtDate(a.publishedAt)} · {a.readingMinutes} min read
            </p>
            {hero && <img src={hero} alt={main} className="mt-3 w-full rounded-xl border object-cover shadow-sm" />}
          </header>
          <div lang={shownLang}>
            <MarkdownArticle markdown={body} resolveImage={(src) => mediaUrl(src) ?? null} />
          </div>
          <div className="flex flex-col gap-3 border-t pt-4">
            <ReactionsBar article={a} />
            <ShareBar title={main} path={`/uma/${a.slug}`} />
          </div>
        </>
      )}
    </div>
  )
}
