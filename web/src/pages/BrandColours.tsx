import { BackLink } from '@/components/BackLink'

/**
 * The "Pujosamiti — Bengali Visual Identity" artifact, VERBATIM. The page is
 * shipped as a self-contained static file (public/brandcolours.html) and
 * framed here so its own styling renders untouched by the app's CSS —
 * palette, alpona motifs, phone mock and all.
 */
export function BrandColours() {
  return (
    <div className="flex h-full flex-col gap-3">
      <BackLink />
      <iframe
        src="/brandcolours.html"
        title="Pujosamiti — Bengali Visual Identity"
        className="min-h-[calc(100dvh-11rem)] w-full rounded-xl border bg-white"
      />
    </div>
  )
}
