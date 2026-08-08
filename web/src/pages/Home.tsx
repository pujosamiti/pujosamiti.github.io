import { Link } from 'react-router'

import heroImage from '@/assets/pujo-samiti.webp'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/button'

/**
 * The landing page is fully static: everything renders from the bundle with
 * zero API calls, so it works even when the backend is down.
 */
export function Home() {
  return (
    <div className="flex flex-col gap-6">
      <Seo
        title="দুর্গাপূজা"
        description="The probasi bengali community of Magarpatta City, Pune celebrates the pujo the para way — Durga Puja, Kojagari Lakshmi Puja, Saraswati Puja and Poila Baishakh, together."
        path="/"
      />
      <section className="pt-2 md:pt-6">
        <img
          src={heroImage}
          alt="Dhunuchi naach before the protima during Durga Pujo"
          width={1600}
          height={1067}
          fetchPriority="high"
          className="w-full rounded-xl border object-cover shadow-sm"
        />
        <div className="mt-5 text-center">
          <h1 className="text-3xl font-bold text-primary md:text-4xl">দুর্গাপূজা</h1>
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
    </div>
  )
}
