import { Alpona, LataBorder } from '@/components/Alpona'

/**
 * The foot of every page: a laal-paar band, the lata creeper running along
 * its top edge — the header's alpona scallops answered at the bottom — and
 * the samiti's name under a shatadal.
 */
export function SiteFooter() {
  return (
    <footer className="bg-band text-band-foreground print:hidden">
      <LataBorder className="text-band-foreground/85" />
      {/* phones: clear the fixed bottom tab bar */}
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-1.5 px-4 pb-24 pt-2 text-center md:pb-7">
        <Alpona name="shatadal" className="size-9 text-band-foreground/90" />
        <p className="font-serif text-lg font-bold leading-tight">পুজো সমিতি</p>
        <p className="text-xs opacity-85">Magarpatta City · Pune</p>
        <p className="max-w-[46ch] text-xs opacity-75">
          Durga Pujo, Kojagari Lakshmi Puja, Bijoya Sammelani, Saraswati Puja and Poila Baishakh — the
          probasi bengali year, together.
        </p>
      </div>
    </footer>
  )
}
