import { Download, ExternalLink, Link2 } from 'lucide-react'
import { useState } from 'react'

import { Seo } from '@/components/Seo'
import { SharePanel } from '@/components/SharePanel'
import { Button } from '@/components/ui/button'
import { STAGE_FLEX, driveDownload, driveView, megabytes, stageFlexUrl } from '@/lib/stageFlex'

/**
 * The year's stage flex, /flex/01 — for everyone, no sign-in, so the samiti
 * can send the link to the print shop: the backdrop of the cultural evenings,
 * 16 × 16 ft, shown here as a 1600-px preview; the 8000 × 8000 print file
 * downloads from Google Drive, the PNG by default, the JPG beside it. Every
 * word comes from lib/stageFlex.ts; the share card from the prerendered HTML
 * (scripts/prerender.mjs).
 */
export function StageFlex() {
  const f = STAGE_FLEX
  const [png, jpg] = f.files
  const [showShare, setShowShare] = useState(false)
  const dpi = Math.round(f.px / (f.feet * 12))

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      {/* the share card: keep in step with the /flex/01 entry in scripts/prerender.mjs */}
      <Seo title={f.title} bareTitle description={f.description} path={f.path} image={f.shareImage} noindex />
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {f.heading} · {f.year}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The backdrop of the Durga Puja {f.year} cultural evenings, {f.place} — {f.feet} × {f.feet} ft.
          </p>
        </div>
        <Button size="sm" variant="outline" className="self-start" onClick={() => setShowShare(!showShare)}>
          <Link2 /> {showShare ? 'Hide link' : 'Share link'}
        </Button>
        {showShare && (
          <SharePanel
            title="Stage flex link"
            description="This page, open to everyone — no sign-in. Send it to the print shop on WhatsApp, or share it on Facebook; it previews with the flex."
            url={stageFlexUrl()}
            message={`${f.title} — the ${f.feet} × ${f.feet} ft stage backdrop, ${f.px} × ${f.px} px. Download the print file (PNG, or JPG) from this page.`}
            onClose={() => setShowShare(false)}
          />
        )}
      </div>

      <figure>
        <img src={f.preview} alt={f.alt} width={1600} height={1600} className="h-auto w-full rounded-md shadow-lg max-sm:rounded-none" />
      </figure>

      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <a href={driveDownload(png)} download={png.name}>
              <Download aria-hidden="true" /> Download PNG · {megabytes(png.bytes)}
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={driveDownload(jpg)} download={jpg.name}>
              <Download aria-hidden="true" /> JPG · {megabytes(jpg.bytes)}
            </a>
          </Button>
        </div>
        <p className="max-w-md text-center text-xs text-muted-foreground">
          Both are {f.px} × {f.px} px, from Google Drive. The PNG is the master, lossless; the JPG is the same picture, a quarter
          the size.
        </p>
        <p className="text-center text-xs text-muted-foreground">
          Download not starting? Open it on Drive:{' '}
          {[png, jpg].map((file, i) => (
            <span key={file.id} className="whitespace-nowrap">
              {i > 0 && ' · '}
              <a href={driveView(file)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-primary underline-offset-4 hover:underline">
                {file.label} <ExternalLink aria-hidden="true" className="size-3" />
              </a>
            </span>
          ))}
        </p>
      </div>

      <section className="rounded-lg border bg-card p-4 text-sm leading-relaxed">
        <h2 className="mb-1 font-semibold">For the printer</h2>
        <ul className="list-disc space-y-0.5 pl-5">
          <li>
            {f.feet} × {f.feet} ft, square — print the whole picture, edge to edge, no cropping.
          </li>
          <li>
            {f.px} × {f.px} px: {Math.round(f.px / f.feet)} px a foot, about {dpi} dpi — plenty for a backdrop seen from the audience.
          </li>
          <li>Matte frontlit flex, not glossy: stage lights and phone flashes flare off a glossy sheet.</li>
          <li>Eyelets go in the margin all round; nothing that matters lies within about 6 inches of the edge.</li>
          <li>The colours are RGB — check the reds on a small test strip before the full print.</li>
        </ul>
      </section>
    </div>
  )
}
