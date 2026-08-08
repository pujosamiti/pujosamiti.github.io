import { useEffect } from 'react'

const SITE = 'পুজো সমিতি · Magarpatta'
const TITLE_SUFFIX = 'Magarpatta City Pune'
const ORIGIN = 'https://pujosamiti.github.io'
const DEFAULT_IMAGE = `${ORIGIN}/og.webp`

/** Update — never duplicate — a tag in <head>. */
function setTag(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector<HTMLElement>(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

const named = (name: string) => () => {
  const el = document.createElement('meta')
  el.setAttribute('name', name)
  return el
}
const propertied = (property: string) => () => {
  const el = document.createElement('meta')
  el.setAttribute('property', property)
  return el
}
const linked = (rel: string) => () => {
  const el = document.createElement('link')
  el.setAttribute('rel', rel)
  return el
}

/**
 * Per-route SEO tags.
 *
 * Applied imperatively to the tags already in the document: index.html ships a
 * full set and the prerenderer stamps route-specific values into each public
 * route's HTML for no-JS crawlers (see docs/seotags.md). Updating in place —
 * rather than rendering a second set — guarantees exactly one title,
 * description and canonical per page; two canonicals pointing at different
 * URLs is worse than none.
 *
 * Every route should render this: public pages with their own copy, private
 * ones with `noindex`, so the previous page's tags never linger after a
 * client-side navigation.
 */
export function Seo({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
}: {
  /** Page title; "Magarpatta City Pune" is appended automatically */
  title: string
  description: string
  /** Route path beginning with "/", used for the canonical URL */
  path: string
  /** Absolute URL of a share image; defaults to the site cover */
  image?: string
  /** OpenGraph type: "website" for pages, "article" for book chapters/posts */
  type?: 'website' | 'article'
  /** Keep this page out of search results (members-only areas) */
  noindex?: boolean
}) {
  const full = `${title} ${TITLE_SUFFIX}`
  const url = `${ORIGIN}${path}`
  const img = image ?? DEFAULT_IMAGE

  useEffect(() => {
    document.title = full
    setTag('meta[name="description"]', named('description'), 'content', description)
    setTag('link[rel="canonical"]', linked('canonical'), 'href', url)
    setTag('meta[property="og:site_name"]', propertied('og:site_name'), 'content', SITE)
    setTag('meta[property="og:type"]', propertied('og:type'), 'content', type)
    setTag('meta[property="og:title"]', propertied('og:title'), 'content', full)
    setTag('meta[property="og:description"]', propertied('og:description'), 'content', description)
    setTag('meta[property="og:url"]', propertied('og:url'), 'content', url)
    setTag('meta[property="og:image"]', propertied('og:image'), 'content', img)
    setTag('meta[name="twitter:card"]', named('twitter:card'), 'content', 'summary_large_image')
    setTag('meta[name="twitter:title"]', named('twitter:title'), 'content', full)
    setTag('meta[name="twitter:description"]', named('twitter:description'), 'content', description)
    setTag('meta[name="twitter:image"]', named('twitter:image'), 'content', img)
    setTag(
      'meta[name="robots"]',
      named('robots'),
      'content',
      noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    )
  }, [full, description, url, img, type, noindex])

  return null
}
