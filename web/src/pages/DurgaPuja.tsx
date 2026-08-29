import { useQuery } from '@tanstack/react-query'
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { MarkdownArticle } from '@/components/MarkdownArticle'
import { LogoSpinner } from '@/components/LogoSpinner'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/button'
import { parseFrontmatter, slugFromPath, titleFromSlug } from '@/lib/markdown'

// The book's source of truth: markdown files in src/content/durga-puja.
// Each file becomes its own lazy chunk — a chapter downloads only when read.
const files = import.meta.glob('/src/content/durga-puja/*.md', { query: '?raw', import: 'default' }) as Record<
  string,
  () => Promise<string>
>

// Chapter list (order + slug) comes from filenames alone — no content loaded.
const chapters = Object.keys(files)
  .map((path) => ({ path, ...slugFromPath(path) }))
  .filter((c) => c.order > 0)
  .sort((a, b) => a.order - b.order)
const indexPath = Object.keys(files).find((p) => p.endsWith('00-index.md'))!

/** A bare image filename in frontmatter lives under /bookdurgapuja/ (see docs/seotags.md). */
const imageUrl = (image?: string) =>
  image ? (image.startsWith('http') ? image : `https://pujosamiti.github.io/bookdurgapuja/${image}`) : undefined

const resolveLink = (href: string) => {
  const m = href.match(/^(?:\.\/)?(\d+)-(.+)\.md$/)
  if (!m) return null
  return Number(m[1]) === 0 ? '/durga-puja' : `/durga-puja/${m[2]}`
}

function useMarkdown(path: string | null) {
  return useQuery({
    queryKey: ['md', path],
    queryFn: async () => parseFrontmatter(await files[path!]()),
    enabled: !!path,
    staleTime: Infinity,
  })
}

export function DurgaPujaIndex() {
  const { data, isPending } = useMarkdown(indexPath)
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Seo
        title="Durga Puja"
        description={
          data?.meta.oneLiner ??
          'Bengali Durga Puja, explained properly — every day, every ritual, every story and every mantra, from Khunti Puja to Kojagari Lakshmi Puja. An encyclopedia by the Magarpatta pujo samiti.'
        }
        path="/durga-puja"
        type="article"
        image={imageUrl(data?.meta.image)}
      />
      {isPending || !data ? (
        <LogoSpinner small />
      ) : (
        <>
          {data.meta.image && (
            <img
              src={data.meta.image.startsWith('http') ? data.meta.image : `/bookdurgapuja/${data.meta.image}`}
              alt={data.meta.title}
              className="w-full rounded-xl border object-cover shadow-sm"
            />
          )}
          <MarkdownArticle markdown={data.body} resolveLink={resolveLink} />
          <div className="flex justify-end">
            <Button size="sm" asChild>
              <Link to={`/durga-puja/${chapters[0].slug}`}>
                {titleFromSlug(chapters[0].slug)} <ChevronRight />
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export function DurgaPujaChapter() {
  const { slug } = useParams()
  const idx = chapters.findIndex((c) => c.slug === slug)
  const chapter = idx >= 0 ? chapters[idx] : null
  const prev = idx > 0 ? chapters[idx - 1] : null
  const next = idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : null
  const { data, isPending } = useMarkdown(chapter?.path ?? null)

  if (!chapter) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <p className="text-sm text-muted-foreground">This chapter does not exist.</p>
        <Link to="/durga-puja" className="text-sm font-medium text-primary">
          ← Back to Durga Puja
        </Link>
      </div>
    )
  }

  const nav = (
    <div className="flex items-center justify-between gap-2">
      {prev ? (
        <Button size="sm" asChild>
          <Link to={`/durga-puja/${prev.slug}`}>
            <ChevronLeft /> {titleFromSlug(prev.slug)}
          </Link>
        </Button>
      ) : (
        <Button size="sm" asChild>
          <Link to="/durga-puja">
            <ChevronLeft /> The book
          </Link>
        </Button>
      )}
      {next ? (
        <Button size="sm" asChild>
          <Link to={`/durga-puja/${next.slug}`}>
            {titleFromSlug(next.slug)} <ChevronRight />
          </Link>
        </Button>
      ) : (
        <span />
      )}
    </div>
  )

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      {/* Always mounted, so the document <title> is never left empty —
          fallback values until the chapter's frontmatter arrives. */}
      <Seo
        title={data?.meta.title || titleFromSlug(chapter.slug)}
        description={data?.meta.oneLiner ?? data?.meta.title ?? titleFromSlug(chapter.slug)}
        path={`/durga-puja/${chapter.slug}`}
        type="article"
        image={imageUrl(data?.meta.image)}
      />
      <div className="flex items-center justify-between gap-2">
        <Link to="/durga-puja" className="flex items-center gap-1 text-sm font-medium text-primary">
          <ChevronLeft className="size-4" />
          <BookOpen className="size-4" /> Durga Puja · the book
        </Link>
        <span className="text-xs text-muted-foreground">
          Chapter {chapter.order} of {chapters.length}
        </span>
      </div>
      {isPending || !data ? (
        <LogoSpinner small />
      ) : (
        <>
          <header className="flex flex-col gap-1 border-b pb-4">
            <h1 className="font-serif text-3xl font-bold text-primary md:text-4xl">{data.meta.title}</h1>
            {data.meta.bengali && <p className="font-serif text-xl text-shiuli">{data.meta.bengali}</p>}
            {data.meta.when && <p className="text-sm text-muted-foreground">{data.meta.when}</p>}
            {data.meta.author && <p className="text-sm text-muted-foreground">লিখেছেন · {data.meta.author}</p>}
            {data.meta.image && (
              <img
                src={data.meta.image.startsWith('http') ? data.meta.image : `/bookdurgapuja/${data.meta.image}`}
                alt={data.meta.title}
                className="mt-3 w-full rounded-xl border object-cover shadow-sm"
              />
            )}
          </header>
          <MarkdownArticle markdown={data.body} resolveLink={resolveLink} />
          {nav}
        </>
      )}
    </div>
  )
}
