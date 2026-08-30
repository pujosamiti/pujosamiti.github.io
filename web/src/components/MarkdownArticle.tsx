import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link } from 'react-router'

/**
 * The shared markdown renderer for content sections — the Durga Puja book
 * today, Pujo Sankhya articles later. GFM (tables!) enabled; internal
 * relative links are mapped to routes via `resolveLink`; wide tables scroll
 * inside their own container so phones never scroll the whole page sideways.
 */
export function MarkdownArticle({
  markdown,
  resolveLink,
  resolveImage,
}: {
  markdown: string
  /** Map a markdown href (e.g. "04-mahalaya.md") to a route; return null to keep as-is */
  resolveLink?: (href: string) => string | null
  /** Map an image src (e.g. an API-relative Uma media path) to a full URL; return null to keep as-is */
  resolveImage?: (src: string) => string | null
}) {
  return (
    <article className="prose prose-stone max-w-none dark:prose-invert prose-headings:font-serif prose-h1:text-primary prose-a:text-primary prose-blockquote:border-l-shiuli prose-blockquote:not-italic prose-th:whitespace-nowrap">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children }) {
            const mapped = href ? (resolveLink?.(href) ?? null) : null
            if (mapped) return <Link to={mapped}>{children}</Link>
            const external = href?.startsWith('http')
            return (
              <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
                {children}
              </a>
            )
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto">
                <table>{children}</table>
              </div>
            )
          },
          img({ src, alt }) {
            const mapped = (typeof src === 'string' && resolveImage?.(src)) || src
            return <img src={mapped as string} alt={alt ?? ''} loading="lazy" className="rounded-lg" />
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  )
}
