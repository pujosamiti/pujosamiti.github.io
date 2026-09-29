import { PageTitle } from '@/components/PageTitle'
import { Seo } from '@/components/Seo'
import { CULTURAL_EVENING } from '@/lib/culturalEvening'
import { PAGE_TINT } from '@/lib/tint'

/**
 * The cultural evening's flyer, for everyone — no sign-in. A cultural admin
 * shares the link from /cultural (Share link), on WhatsApp or Facebook; the
 * share card comes from the prerendered HTML (scripts/prerender.mjs).
 */
export function CulturalEvening() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      {/* the share card: keep in step with the /cultural/cultural-01 entry in scripts/prerender.mjs */}
      <Seo
        title={CULTURAL_EVENING.title}
        bareTitle
        description={CULTURAL_EVENING.description}
        path={CULTURAL_EVENING.path}
        image={CULTURAL_EVENING.shareImage}
        noindex
      />
      {/* the dot stays with "Evening", so a narrow screen breaks before "Magarpatta City", not before "·" */}
      <PageTitle tint={PAGE_TINT.cultural}>{CULTURAL_EVENING.title.replace(' · ', ' · ')}</PageTitle>
      <img
        src={CULTURAL_EVENING.flyer}
        alt={CULTURAL_EVENING.flyerAlt}
        width={1283}
        height={1600}
        className="h-auto w-full rounded-xl border shadow-sm"
      />
    </div>
  )
}
