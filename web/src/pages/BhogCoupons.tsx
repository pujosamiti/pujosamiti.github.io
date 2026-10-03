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
 * every day in one PDF. 400 a day unless set otherwise, numbered from 1 (a
 * later top-up starts where the last run ended). See lib/bhogCoupons.ts.
 */
const LOGO = '/brand/pujo-samiti-logo-bw-transparent.png'
const DEFAULT_COUNT = 400

const dayName = (d: CouponDay) => `${d.title}${d.badge ? ` ${d.badge}` : ''}`
const fileName = (days: CouponDay[], start: number, count: number) => {
  const part = days.length === 1 ? dayName(days[0]).toLowerCase().replace(/\s+/g, '-') : 'all-days'
  const order = days.length === 1 ? `${String(COUPON_DAYS.indexOf(days[0]) + 1).padStart(2, '0')}-` : ''
  const range = start === 1 ? '' : `-from-${start}`
  return `${order}bhog-coupons-${COUPON_YEAR}-${part}-${count}${range}.pdf`
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

  const [countText, setCountText] = useState(String(DEFAULT_COUNT))
  const [startText, setStartText] = useState('1')
  const count = Math.max(1, Math.min(5000, Math.floor(Number(countText)) || DEFAULT_COUNT))
  const start = Math.max(1, Math.floor(Number(startText)) || 1)
  const pages = useMemo(() => pagesFor(start, count), [start, count])
  const width = serialWidth(start, count)

  // a preview of each day's first page
  const previews = useMemo(() => {
    if (!images) return null
    const pxPerMm = 3.2
    return COUPON_DAYS.map((day) => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(PAGE.w * pxPerMm)
      canvas.height = Math.round(PAGE.h * pxPerMm)
      drawOnCanvas(canvas.getContext('2d')!, pageOps(day, pages[0], 1, pages.length, width), pxPerMm, images)
      return canvas.toDataURL('image/png')
    })
  }, [images, pages, width])

  const [showShare, setShowShare] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const make = async (key: string, days: CouponDay[], then: 'download' | 'print') => {
    if (!images) return
    setBusy(key + then)
    setError(null)
    try {
      const blob = await couponsPdf(days, start, count, images)
      if (then === 'download') download(blob, fileName(days, start, count))
      else {
        // the browser's own PDF viewer prints the pages at their true A4 size
        const url = URL.createObjectURL(blob)
        const win = window.open(url, '_blank')
        if (!win) download(blob, fileName(days, start, count))
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
            {count} coupons a day = {pages.length} pages; each day's numbers start with its letter (
            {COUPON_DAYS.map((d, i) => (
              <span key={d.prefix} className="whitespace-nowrap">
                {i > 0 && ', '}
                {serialOf(d, 1, width)}
              </span>
            ))}
            ).
          </li>
        </ul>
      </section>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Coupons per day
          <input
            type="number"
            min={1}
            max={5000}
            inputMode="numeric"
            className="h-9 w-28 rounded-md border bg-background px-2"
            value={countText}
            onChange={(e) => setCountText(e.target.value)}
          />
        </label>
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
          {busy === 'alldownload' ? 'Making the PDF…' : `Download all days (${pages.length * COUPON_DAYS.length} pages)`}
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
              <p className="text-xs text-muted-foreground">
                {pages.length} pages · {serialOf(day, start, width)} – {serialOf(day, start + count - 1, width)}
              </p>
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
