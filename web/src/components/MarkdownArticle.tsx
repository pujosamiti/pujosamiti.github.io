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
}: {
  markdown: string
  /** Map a markdown href (e.g. "04-mahalaya.md") to a route; return null to keep as-is */
  resolveLink?: (href: string) => string | null
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
        }}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  )
}
