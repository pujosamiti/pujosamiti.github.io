import { Download, Link2, Printer } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Seo } from '@/components/Seo'
import { SharePanel } from '@/components/SharePanel'
import { Button } from '@/components/ui/button'
import {
  BHOG_COUPONS,
  COUPON_DAYS,
  COUPON_YEAR,
  type CouponDay,
  type Images,
  LOGO_KEY,
  PAGE,
  PER_PAGE,
  bengaliLine,
  bhogCouponsUrl,
  bnKey,
  couponsPdf,
  drawOnCanvas,
  pageOps,
  pagesFor,
  serialOf,
  serialWidth,
} from '@/lib/bhogCoupons'
import { download, loadCardFonts, loadImage } from '@/lib/cardCanvas'

/**
 * The year's bhog coupons, /bhog/coupons — open to everyone, so the samiti
 * can send the link to the print shop. One card per bhog day: a preview of
 * its first page, and its coupons as an A4 PDF to download or print; or
 * every day in one PDF. Each day prints its own count (400, Dashami 240 —
 * see lib/bhogCoupons.ts), changeable on its card, numbered from 1 (a later
 * top-up starts where the last run ended).
 */
const LOGO = '/brand/pujo-samiti-logo-bw-transparent.png'
const MAX_COUNT = 5000

const dayName = (d: CouponDay) => `${d.title}${d.badge ? ` ${d.badge}` : ''}`
const fileName = (runs: { day: CouponDay; count: number }[], start: number) => {
  const one = runs.length === 1 ? runs[0] : null
  const part = one ? `${dayName(one.day).toLowerCase().replace(/\s+/g, '-')}-${one.count}` : 'all-days'
  const order = one ? `${String(COUPON_DAYS.indexOf(one.day) + 1).padStart(2, '0')}-` : ''
  const range = start === 1 ? '' : `-from-${start}`
  return `${order}bhog-coupons-${COUPON_YEAR}-${part}${range}.pdf`
}

export default function BhogCoupons() {
  const [images, setImages] = useState<Images | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    Promise.all([loadCardFonts(), loadImage(LOGO)])
      .then(([, logo]) => {
        if (!live) return
        const map: Images = new Map([[LOGO_KEY, logo]])
        for (const d of COUPON_DAYS) map.set(bnKey(d), bengaliLine(d))
        setImages(map)
      })
      .catch((e: Error) => live && setError(e.message))
    return () => {
      live = false
    }
  }, [])

  // each day's own count, as typed; it falls back to the day's default when empty or nonsense
  const [countText, setCountText] = useState<Record<string, string>>(() =>
    Object.fromEntries(COUPON_DAYS.map((d) => [d.prefix, String(d.defaultCount)])),
  )
  const [startText, setStartText] = useState('1')
  const start = Math.max(1, Math.floor(Number(startText)) || 1)
  const countOf = (d: CouponDay) => Math.max(1, Math.min(MAX_COUNT, Math.floor(Number(countText[d.prefix])) || d.defaultCount))
  const counts = COUPON_DAYS.map(countOf)
  const countKey = counts.join('|')
  const plans = useMemo(
    () =>
      countKey.split('|').map((c) => {
        const count = Number(c)
        return { count, pages: pagesFor(start, count), width: serialWidth(start, count) }
      }),
    [countKey, start],
  )
  const totalPages = plans.reduce((s, p) => s + p.pages.length, 0)

  // a preview of each day's first page
  const previews = useMemo(() => {
    if (!images) return null
    const pxPerMm = 3.2
    return COUPON_DAYS.map((day, i) => {
      const { pages, width } = plans[i]
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(PAGE.w * pxPerMm)
      canvas.height = Math.round(PAGE.h * pxPerMm)
      drawOnCanvas(canvas.getContext('2d')!, pageOps(day, pages[0], 1, pages.length, width), pxPerMm, images)
      return canvas.toDataURL('image/png')
    })
  }, [images, plans])

  const [showShare, setShowShare] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const make = async (key: string, days: CouponDay[], then: 'download' | 'print') => {
    if (!images) return
    setBusy(key + then)
    setError(null)
    const runs = days.map((day) => ({ day, count: countOf(day) }))
    try {
      const blob = await couponsPdf(runs, start, images)
      if (then === 'download') download(blob, fileName(runs, start))
      else {
        // the browser's own PDF viewer prints the pages at their true A4 size
        const url = URL.createObjectURL(blob)
        const win = window.open(url, '_blank')
        if (!win) download(blob, fileName(runs, start))
        setTimeout(() => URL.revokeObjectURL(url), 120_000)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      {/* the share card: keep in step with the /bhog/coupons entry in scripts/prerender.mjs */}
      <Seo title={BHOG_COUPONS.title} bareTitle description={BHOG_COUPONS.description} path={BHOG_COUPONS.path} image={BHOG_COUPONS.shareImage} noindex />
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bhog coupons · {COUPON_YEAR}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Durga Puja {COUPON_YEAR}, Saptami to Dashami — a colour for each day, {PER_PAGE} coupons to an A4 page.
          </p>
        </div>
        <Button size="sm" variant="outline" className="self-start" onClick={() => setShowShare(!showShare)}>
          <Link2 /> {showShare ? 'Hide link' : 'Share link'}
        </Button>
        {showShare && (
          <SharePanel
            title="Bhog coupons link"
            description="This page, open to everyone — no sign-in. Send it to the print shop on WhatsApp, or share it on Facebook; it previews with the coupons."
            url={bhogCouponsUrl()}
            message={`${BHOG_COUPONS.title} — A4 sheets of ${PER_PAGE} coupons, a colour for each day, Saptami to Dashami. Download the PDFs and print at 100% (actual size).`}
            onClose={() => setShowShare(false)}
          />
        )}
      </div>

      <section className="rounded-lg border bg-card p-4 text-sm leading-relaxed">
        <h2 className="mb-1 font-semibold">For the printer</h2>
        <ul className="list-disc space-y-0.5 pl-5">
          <li>A4, single-sided, in colour.</li>
          <li>
            Print at <strong>actual size / 100%</strong> — not “fit to page”.
          </li>
          <li>Cut along the dashed white lines; the marks in the margin show every cut. Each coupon keeps a coloured frame.</li>
          <li>
            Each day's numbers start with its letter:{' '}
            {COUPON_DAYS.map((d, i) => (
              <span key={d.prefix} className="whitespace-nowrap">
                {i > 0 && ' · '}
                {dayName(d)} {counts[i]} ({plans[i].pages.length} pages, {serialOf(d, start, plans[i].width)}–{serialOf(d, start + counts[i] - 1, plans[i].width)})
              </span>
            ))}
            .
          </li>
        </ul>
      </section>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          First number
          <input
            type="number"
            min={1}
            inputMode="numeric"
            className="h-9 w-28 rounded-md border bg-background px-2"
            value={startText}
            onChange={(e) => setStartText(e.target.value)}
          />
        </label>
        <Button disabled={!images || !!busy} onClick={() => void make('all', COUPON_DAYS, 'download')}>
          <Download aria-hidden="true" />
          {busy === 'alldownload' ? 'Making the PDF…' : `Download all days (${totalPages} pages)`}
        </Button>
      </div>

      {error && <p className="text-sm font-medium text-jaba">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COUPON_DAYS.map((day, i) => (
          <figure key={day.prefix} className="flex flex-col gap-2 rounded-lg border bg-card p-3">
            {previews ? (
              <img
                src={previews[i]}
                alt={`${dayName(day)} Bhog coupons, page 1`}
                width={PAGE.w * 3.2}
                height={PAGE.h * 3.2}
                className="h-auto w-full rounded border"
              />
            ) : (
              <div className="aspect-[210/297] w-full animate-pulse rounded" style={{ background: day.colour, opacity: 0.25 }} />
            )}
            <figcaption className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="size-3 rounded-full" style={{ background: day.colour }} />
                <span className="font-semibold">{dayName(day)} Bhog</span>
                <span className="text-sm text-muted-foreground">· {day.dateLabel}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <label className="flex items-center gap-1.5 font-medium text-foreground">
                  Coupons
                  <input
                    type="number"
                    min={1}
                    max={MAX_COUNT}
                    inputMode="numeric"
                    aria-label={`${dayName(day)} coupons`}
                    className="h-8 w-20 rounded-md border bg-background px-2 text-sm"
                    value={countText[day.prefix]}
                    onChange={(e) => setCountText((t) => ({ ...t, [day.prefix]: e.target.value }))}
                  />
                </label>
                <span>
                  {plans[i].pages.length} pages · {serialOf(day, start, plans[i].width)} – {serialOf(day, start + counts[i] - 1, plans[i].width)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={!images || !!busy} onClick={() => void make(day.prefix, [day], 'download')}>
                  <Download aria-hidden="true" />
                  {busy === `${day.prefix}download` ? 'Making…' : 'Download PDF'}
                </Button>
                <Button size="sm" variant="outline" disabled={!images || !!busy} onClick={() => void make(day.prefix, [day], 'print')}>
                  <Printer aria-hidden="true" />
                  {busy === `${day.prefix}print` ? 'Making…' : 'Print'}
                </Button>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
