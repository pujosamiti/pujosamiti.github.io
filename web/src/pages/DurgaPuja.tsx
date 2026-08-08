import { useQuery } from '@tanstack/react-query'
import { BookOpen, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { MarkdownArticle } from '@/components/MarkdownArticle'
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

/** A bare image filename in frontmatter lives under /book/ (see docs/seotags.md). */
const imageUrl = (image?: string) =>
  image ? (image.startsWith('http') ? image : `https://pujosamiti.github.io/book/${image}`) : undefined

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
        description="Bengali Durga Puja, explained properly — every day, every ritual, every story and every mantra, from Khunti Puja to Kojagari Lakshmi Puja. An encyclopedia by the Magarpatta pujo samiti."
        path="/durga-puja"
        type="article"
      />
      {isPending || !data ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
      ) : (
        <>
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
        <Button variant="outline" size="sm" asChild>
          <Link to={`/durga-puja/${prev.slug}`}>
            <ChevronLeft /> {titleFromSlug(prev.slug)}
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" asChild>
          <Link to="/durga-puja">
            <ChevronLeft /> The book
          </Link>
        </Button>
      )}
      {next ? (
        <Button variant="outline" size="sm" asChild>
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
      {data && (
        <Seo
          title={data.meta.title}
          description={data.meta.oneLiner ?? data.meta.title}
          path={`/durga-puja/${chapter.slug}`}
          type="article"
          image={imageUrl(data.meta.image)}
        />
      )}
      <div className="flex items-center justify-between gap-2">
        <Link to="/durga-puja" className="flex items-center gap-1 text-sm font-medium text-primary">
          <BookOpen className="size-4" /> Durga Puja · the book
        </Link>
        <span className="text-xs text-muted-foreground">
          Chapter {chapter.order} of {chapters.length}
        </span>
      </div>
      {data?.meta.author && <p className="-mt-2 text-sm text-muted-foreground">লিখেছেন · {data.meta.author}</p>}
      {isPending || !data ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
      ) : (
        <>
          <MarkdownArticle markdown={data.body} resolveLink={resolveLink} />
          {nav}
        </>
      )}
    </div>
  )
}
