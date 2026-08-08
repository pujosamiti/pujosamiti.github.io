const SITE = 'পুজো সমিতি · Magarpatta'
const TITLE_SUFFIX = 'Magarpatta City Pune'
const ORIGIN = 'https://pujosamiti.github.io'
const DEFAULT_IMAGE = `${ORIGIN}/og.webp`

/**
 * Per-route SEO tags. React 19 hoists <title>/<meta>/<link> rendered anywhere
 * in the tree into <head>, replacing the defaults from index.html — so each
 * page simply renders <Seo …/> with its own copy.
 *
 * This covers browsers and JS-executing crawlers (Google). Bots that read raw
 * HTML only (WhatsApp/Facebook/Twitter previews) still see index.html's
 * defaults until the route is prerendered — see docs/seotags.md.
 */
export function Seo({
  title,
  description,
  path,
  image,
  type = 'website',
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
}) {
  const full = `${title} ${TITLE_SUFFIX}`
  const url = `${ORIGIN}${path}`
  return (
    <>
      <title>{full}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:site_name" content={SITE} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={full} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image ?? DEFAULT_IMAGE} />
      <meta name="twitter:card" content="summary_large_image" />
    </>
  )
}
