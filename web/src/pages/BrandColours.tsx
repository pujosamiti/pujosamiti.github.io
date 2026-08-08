import { BackLink } from '@/components/BackLink'
import { Seo } from '@/components/Seo'

/**
 * The "Pujosamiti — Bengali Visual Identity" artifact, VERBATIM. The page is
 * shipped as a self-contained static file (public/brand-identity.html) and
 * framed here so its own styling renders untouched by the app's CSS —
 * palette, alpona motifs, phone mock and all.
 */
export function BrandColours() {
  return (
    <div className="flex h-full flex-col gap-3">
      <Seo
        title="Brand Colours"
        description="The laal-paar shada visual identity of the Magarpatta pujo samiti — palette, logo variants, alpona rules and usage."
        path="/brandcolours"
      />
      <BackLink />
      <iframe
        src="/brand-identity.html"
        title="Pujosamiti — Bengali Visual Identity"
        className="min-h-[calc(100dvh-11rem)] w-full rounded-xl border bg-white"
      />
    </div>
  )
}
