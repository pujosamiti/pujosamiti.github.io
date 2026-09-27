import { Link } from 'react-router'

import heroImage from '@/assets/pujo-samiti.webp'
import { Alpona, AlponaDivider, type AlponaName } from '@/components/Alpona'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/button'

/** The samiti's year, and the alpona each festival brings out. */
const YEAR: { motif: AlponaName; bn: string; en: string; note: string }[] = [
  { motif: 'shatadal', bn: 'দুর্গাপূজা', en: 'Durga Pujo', note: 'the hundred-petal lotus' },
  { motif: 'lakshmirPa', bn: 'কোজাগরী লক্ষ্মীপূজা', en: 'Kojagari Lakshmi Puja', note: "Lakshmi's footsteps" },
  { motif: 'joraMaach', bn: 'বিজয়া সম্মিলনী', en: 'Bijoya Sammelani', note: 'the fish pair' },
  { motif: 'rajhansh', bn: 'সরস্বতী পূজা', en: 'Saraswati Puja', note: "Saraswati's swan" },
  { motif: 'mangalGhot', bn: 'পয়লা বৈশাখ', en: 'Poila Baishakh', note: 'the auspicious pot' },
]

/**
 * The landing page is fully static: everything renders from the bundle with
 * zero API calls, so it works even when the backend is down.
 */
export function Home() {
  return (
    <div className="flex flex-col gap-6">
      <Seo
        title="Durga Puja"
        description="The probasi bengali community of Magarpatta City, Pune celebrates the pujo the para way — Durga Puja, Kojagari Lakshmi Puja, Saraswati Puja and Poila Baishakh, together."
        path="/"
      />
      <section className="pt-2 md:pt-6">
        <img
          src={heroImage}
          alt="Dhunuchi naach before the protima during Durga Pujo"
          width={1536}
          height={1024}
          fetchPriority="high"
          className="w-full rounded-xl border object-cover shadow-sm"
        />
        <div className="mt-5 text-center">
          <h1 className="text-3xl font-bold text-primary md:text-4xl">দুর্গাপূজা</h1>
          <AlponaDivider name="shatadal" className="mx-auto mt-2 max-w-xs" />
          <p className="mx-auto mt-2 max-w-[60ch] text-muted-foreground">
            The probasi bengali community of Magarpatta City celebrates the pujo the para way —
            from Mahalaya to Bijoya, and through the year with Lakshmi Puja, Saraswati Puja and
            Poila Baishakh.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/schedule">Schedule</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/membersonly">Members Only</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* the samiti's year, each festival by the alpona drawn for it */}
      <section aria-labelledby="year-heading" className="flex flex-col items-center gap-4 pb-2">
        <h2 id="year-heading" className="text-center font-serif text-xl font-bold">
          বারো মাসে তেরো পার্বণ
          <span className="block font-sans text-sm font-normal text-muted-foreground">
            Thirteen festivals in twelve months — ours, through the year
          </span>
        </h2>
        {/* wraps centred, so an odd last festival sits in the middle on a phone */}
        <ul className="flex w-full max-w-3xl flex-wrap justify-center gap-x-4 gap-y-6">
          {YEAR.map(({ motif, bn, en, note }) => (
            <li key={en} className="flex w-36 flex-col items-center gap-1.5 text-center">
              <span className="grid size-20 place-items-center rounded-full border border-primary/25 bg-card text-primary shadow-sm">
                <Alpona name={motif} className="h-12 w-auto max-w-14" />
              </span>
              <span className="font-serif text-base font-semibold leading-tight">{bn}</span>
              <span className="text-xs text-muted-foreground">
                {en}
                <span className="block text-[11px] text-matir">{note}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
