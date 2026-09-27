/**
 * The laal-paar edge for the top of a card: a red paar, a white line, a thin
 * red line — the sari's own border. Put it first inside an overflow-hidden
 * Card. Kept for the few cards that speak for the samiti (the year's nirghanto,
 * the members' welcome), so it stays special.
 */
export function PaarEdge() {
  return (
    <>
      <div aria-hidden="true" className="h-2 bg-band" />
      <div aria-hidden="true" className="mt-0.5 h-0.5 bg-band/70" />
    </>
  )
}
