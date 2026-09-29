import { Alpona, DotBorder, HandDrawn, KuriBorder, LataBorder, LeafBorder, TaraBorder, TempleBorder } from '@/components/Alpona'
import { AlponaBand } from '@/components/AlponaBand'
import { Seo } from '@/components/Seo'
import { CULTURAL_EVENING } from '@/lib/culturalEvening'
import { cn } from '@/lib/utils'

/**
 * The cultural evening's flyer, for everyone — no sign-in. Not a picture:
 * the flyer drawn as a floor alpona is, white rice-paste line-work on the
 * jaba red — a double frame with a kona in each corner and the lata down its
 * sides, Maa's face (from the samiti's own mark) in a chakra between two
 * dhak, and each evening in a double-lined card under its day's motif. Every
 * word is real text, sharp and readable on any phone; sizes follow the
 * flyer's own width (container units), so it keeps its proportions from a
 * phone to a desktop. A cultural admin shares the link from /cultural (Share
 * link); the share card comes from the prerendered HTML (scripts/prerender.mjs).
 */
export function CulturalEvening() {
  const e = CULTURAL_EVENING
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      {/* the share card: keep in step with the /cultural/flyer/01 entry in scripts/prerender.mjs */}
      <Seo title={e.title} bareTitle description={e.description} path={e.path} image={e.shareImage} noindex />

      <article
        aria-labelledby="flyer-title"
        className="@container relative overflow-hidden bg-band text-band-foreground shadow-lg max-sm:-mx-4 sm:rounded-2xl"
      >
        <HandDrawn />
        <Frame />

        <div className="relative flex flex-col items-center gap-[3.2cqw] px-[calc(58px+1.5cqw)] pb-[calc(56px+21cqw)] pt-[calc(56px+22cqw)] text-center @md:px-[calc(60px+4cqw)] @md:pb-[calc(56px+16cqw)] @md:pt-[calc(56px+16cqw)]">
          <p className="max-w-[62cqw] text-[clamp(0.8rem,2.7cqw,1rem)] font-medium leading-snug text-band-foreground/90">
            {e.invite}
          </p>
          <KuriBorder hand className="w-[70%] text-band-foreground/80" />

          {/* Maa, in the chakra, between the two dhak */}
          <div className="flex w-full items-center justify-center gap-[1.5cqw]">
            <Alpona hand name="dhak" className="w-[21cqw] shrink h-auto text-band-foreground/90" strokeWidth={1.4} />
            <div className="relative aspect-square w-[42cqw] shrink-0">
              <Alpona hand name="chakra" className="absolute inset-0 size-full text-band-foreground/85" strokeWidth={1.1} />
              <img
                src="/brand/durga-face-white.webp"
                alt="Maa Durga"
                width={380}
                height={348}
                className="absolute left-1/2 top-1/2 w-[54%] -translate-x-1/2 -translate-y-1/2"
              />
            </div>
            <Alpona hand name="dhak" className="w-[21cqw] shrink h-auto -scale-x-100 text-band-foreground/90" strokeWidth={1.4} />
          </div>

          <p lang="bn" className="font-serif text-[clamp(2.1rem,11cqw,3.8rem)] font-semibold leading-none">
            {e.greetingBn}
          </p>
          <Divider />
          <h1 id="flyer-title" className="font-serif text-[clamp(1.35rem,6cqw,2.4rem)] font-semibold leading-tight @md:text-[clamp(1.35rem,5.2cqw,2.2rem)]">
            {e.heading[0]}
            <br />
            <span className="text-shankha">{e.heading[1]}</span>
          </h1>
          <div aria-hidden="true" className="flex items-center gap-[3cqw] text-band-foreground/75">
            <Alpona hand name="shiuli" className="h-[clamp(1.4rem,5cqw,2rem)] w-auto" />
            <Alpona hand name="podmo" className="h-[clamp(1.6rem,6cqw,2.4rem)] w-auto" />
            <Alpona hand name="shiuli" className="h-[clamp(1.4rem,5cqw,2rem)] w-auto" />
          </div>

          <div className="grid w-full gap-[5.5cqw] @md:grid-cols-2 @md:gap-[3.2cqw]">
            {e.evenings.map((ev) => (
              <section
                key={ev.day}
                aria-label={`${ev.day}, ${ev.date}`}
                className="relative flex flex-col items-center gap-1.5 px-[calc(16px+4cqw)] py-[calc(16px+3cqw)] @md:px-[calc(16px+1.5cqw)] @md:py-[calc(16px+2cqw)]"
              >
                <CardFrame />
                <Alpona hand
                  name={ev.motif}
                  className="h-[clamp(2rem,8cqw,2.6rem)] w-auto text-band-foreground/85 @md:h-[clamp(1.8rem,5cqw,2.4rem)]"
                />
                <h2 className="font-serif text-[clamp(1.15rem,5cqw,1.45rem)] font-semibold leading-tight @md:text-[clamp(1.05rem,3.2cqw,1.3rem)]">
                  {ev.day}
                </h2>
                <p className="-mt-1 text-[clamp(0.85rem,3.6cqw,1rem)] font-medium text-shankha/90 @md:text-[clamp(0.8rem,2.4cqw,0.95rem)]">
                  {ev.date}
                </p>
                <ul className="mt-1 flex flex-col items-center gap-1 text-[clamp(0.9rem,3.8cqw,1.05rem)] leading-snug @md:text-[clamp(0.85rem,2.5cqw,1rem)]">
                  {ev.items.map((item, i) => (
                    <li key={item} className="flex flex-col items-center gap-1">
                      {i > 0 && <span aria-hidden="true" className="size-1 rounded-full bg-band-foreground/60" />}
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* the evening's lamps, a shiuli between each */}
          <div aria-hidden="true" className="flex items-end justify-center gap-[2.5cqw] text-band-foreground/85">
            {['prodip', 'shiuli', 'prodip', 'shiuli', 'prodip'].map((m, i) => (
              <Alpona hand
                key={i}
                name={m as 'prodip' | 'shiuli'}
                className={cn(
                  'w-auto',
                  m === 'shiuli' ? 'h-[clamp(1.1rem,4cqw,1.6rem)] opacity-75' : i === 2 ? 'h-[clamp(2.2rem,9cqw,3.2rem)]' : 'h-[clamp(1.7rem,6.5cqw,2.4rem)]',
                )}
              />
            ))}
          </div>
          <LataBorder hand className="text-band-foreground/75" />
          {/* one line with room for it, venue over time on a phone */}
          {/* between the lower rosettes: venue over time */}
          <p className="flex max-w-[80cqw] flex-col items-center gap-y-0.5 text-[clamp(1rem,3.6cqw,1.25rem)] font-semibold leading-snug">
            {/* a place name never splits across lines: "Aditi / Garden" */}
            <span>Venue: {e.venue.replace(/ (?=\S+$)/, '\u00a0')}</span>
            <span>Time: {e.time}</span>
          </p>
        </div>
        <AlponaBand className="absolute inset-x-0 bottom-0 opacity-70" />
      </article>
    </div>
  )
}

/**
 * The frame, in layers as round a Bengali alpona's field: a solid outer rule;
 * the temple band — triangles holding filled leaves, bindus between — down
 * every side, meeting in square corner blocks that each hold a tara; a line of
 * rice-paste dots inside it; then a solid quarter mandala grown out of each
 * inner corner, and a row of tara along the top and bottom between them where
 * there is room. The bands repeat at a fixed size, so the frame is measured in
 * pixels; the mandalas grow with the flyer.
 */
function Frame() {
  const band = 30 // TempleBorder's thickness
  const edge = 12 // where the band starts
  const inner = edge + band // its inner edge
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 text-band-foreground">
      <div className="absolute inset-[6px] border-2 border-band-foreground/90 sm:rounded-xl" />
      {/* the temple band, top and bottom pointing in, the sides likewise */}
      <div className="absolute" style={{ left: inner, right: inner, top: edge }}>
        <TempleBorder hand />
      </div>
      <div className="absolute" style={{ left: inner, right: inner, bottom: edge }}>
        <TempleBorder hand className="-scale-y-100" />
      </div>
      <div className="absolute" style={{ top: inner, bottom: inner, left: edge }}>
        <TempleBorder hand vertical className="-scale-x-100" />
      </div>
      <div className="absolute" style={{ top: inner, bottom: inner, right: edge }}>
        <TempleBorder hand vertical />
      </div>
      {(
        [
          { left: edge, top: edge },
          { right: edge, top: edge },
          { left: edge, bottom: edge },
          { right: edge, bottom: edge },
        ] as const
      ).map((at, i) => (
        <Alpona hand key={i} name="taraKona" className="absolute" style={{ ...at, width: band, height: band }} strokeWidth={1.8} />
      ))}
      {/* the line of dots inside the band */}
      <div className="absolute opacity-90" style={{ left: inner + 4, right: inner + 4, top: inner + 4 }}>
        <DotBorder hand />
      </div>
      <div className="absolute opacity-90" style={{ left: inner + 4, right: inner + 4, bottom: inner + 4 }}>
        <DotBorder hand />
      </div>
      <div className="absolute opacity-90" style={{ top: inner + 4, bottom: inner + 4, left: inner + 4 }}>
        <DotBorder hand vertical />
      </div>
      <div className="absolute opacity-90" style={{ top: inner + 4, bottom: inner + 4, right: inner + 4 }}>
        <DotBorder hand vertical />
      </div>
      {/* a solid quarter mandala out of each inner corner */}
      {(
        [
          { cls: '', at: { left: inner + 12, top: inner + 12 } },
          { cls: '-scale-x-100', at: { right: inner + 12, top: inner + 12 } },
          { cls: '-scale-y-100', at: { left: inner + 12, bottom: inner + 12 } },
          { cls: '-scale-100', at: { right: inner + 12, bottom: inner + 12 } },
        ] as const
      ).map(({ cls, at }, i) => (
        <Alpona hand key={i} name="konaMandala" className={cn('absolute size-[24cqw]', cls)} style={at} strokeWidth={1.3} />
      ))}
      {/* a row of tara along the top and bottom, between the mandalas, where there is room */}
      <div className="absolute hidden opacity-90 @md:block" style={{ left: 'calc(58px + 25cqw)', right: 'calc(58px + 25cqw)', top: inner + 18 }}>
        <TaraBorder hand />
      </div>
      <div className="absolute hidden opacity-90 @md:block" style={{ left: 'calc(58px + 25cqw)', right: 'calc(58px + 25cqw)', bottom: inner + 18 }}>
        <TaraBorder hand />
      </div>
    </div>
  )
}

/**
 * An evening's card, bordered as a panel inside a floor alpona: a hand-drawn
 * rule hung with filled leaves pointing in, a bindu between each, down every
 * side, and a tara block in each corner.
 */
function CardFrame() {
  const corner = 18 // a little more than LeafBorder's 15 px, so the corner blocks close the band
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 text-band-foreground/90">
      <div className="absolute" style={{ left: corner, right: corner, top: 0 }}>
        <LeafBorder hand />
      </div>
      <div className="absolute" style={{ left: corner, right: corner, bottom: 0 }}>
        <LeafBorder hand className="-scale-y-100" />
      </div>
      <div className="absolute" style={{ top: corner, bottom: corner, left: 0 }}>
        <LeafBorder hand vertical className="-scale-x-100" />
      </div>
      <div className="absolute" style={{ top: corner, bottom: corner, right: 0 }}>
        <LeafBorder hand vertical />
      </div>
      {(
        [
          { left: 0, top: 0 },
          { right: 0, top: 0 },
          { left: 0, bottom: 0 },
          { right: 0, bottom: 0 },
        ] as const
      ).map((at, i) => (
        <Alpona hand key={i} name="taraKona" className="absolute" style={{ ...at, width: corner, height: corner }} strokeWidth={1.6} />
      ))}
    </div>
  )
}

/** A line, a bindu, the kalka, a bindu, a line — white, for the red. */
function Divider() {
  return (
    <div aria-hidden="true" className="flex w-full max-w-[64cqw] items-center gap-2 text-band-foreground/80">
      <span className="h-px flex-1 bg-current opacity-60" />
      <span className="size-1.5 rounded-full bg-current" />
      <Alpona hand name="shatadal" className="h-[clamp(1.8rem,6cqw,2.4rem)] w-auto" />
      <span className="size-1.5 rounded-full bg-current" />
      <span className="h-px flex-1 bg-current opacity-60" />
    </div>
  )
}
