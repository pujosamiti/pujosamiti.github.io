import { useLocation } from 'react-router'

import { Alpona, LataBorder } from '@/components/Alpona'
import samiti from '@/content/samiti.json'

/**
 * The foot of every page: a laal-paar band, the lata creeper running along
 * its top edge — the header's alpona scallops answered at the bottom — and
 * the samiti's name under a shatadal. On the public pages only, folded away
 * under it, the samiti's story (src/content/samiti.json) — the text those
 * pages' structured data also carries, so the two always match. Not on
 * Members Only, sign-in or anything behind them: search engines never index
 * those, and members don't need it.
 */
/**
 * The public, indexable pages — Home, Schedule, উমা and the Durga Puja book.
 * Keep in step with the indexable routes in scripts/prerender.mjs.
 */
export const isPublicPath = (path: string): boolean =>
  path === '/' || /^\/(schedule|uma|durga-puja)(\/|$)/.test(path)

export function SiteFooter() {
  const { pathname } = useLocation()
  const isPublic = isPublicPath(pathname)
  return (
    <footer className="bg-band text-band-foreground print:hidden">
      <LataBorder className="text-band-foreground/85" />
      {/* phones: clear the fixed bottom tab bar */}
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-1.5 px-4 pb-24 pt-2 text-center md:pb-7">
        <Alpona name="shatadal" className="size-9 text-band-foreground/90" />
        <p className="font-serif text-lg font-bold leading-tight">পুজো সমিতি</p>
        <p className="max-w-[46ch] text-xs opacity-75">
          Durga Pujo, Kojagari Lakshmi Puja, Bijoya Sammelani, Saraswati Puja and Poila Baishakh — the
          probasi bengali year, together.
        </p>
        {isPublic && (
          <details className="group mt-2 w-full max-w-2xl">
            <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-md px-2 py-1 text-xs opacity-85 hover:opacity-100 [&::-webkit-details-marker]:hidden">
              {/* a chevron either side, turning together — the fold's mark, in symmetry */}
              <Alpona name="chevron" className="h-3.5 w-auto transition-transform group-open:rotate-180" />
              Durga Puja, Magarpatta City, Pune
              <Alpona name="chevron" className="h-3.5 w-auto transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-sm leading-relaxed opacity-90">{samiti.about}</p>
          </details>
        )}
      </div>
    </footer>
  )
}
