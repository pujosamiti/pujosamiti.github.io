import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router'

import { HeadcountEditor } from '@/components/HeadcountEditor'
import { LogoSpinner } from '@/components/LogoSpinner'
import { PageTitle } from '@/components/PageTitle'
import { SearchSelect } from '@/components/SearchSelect'
import { Seo } from '@/components/Seo'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { saveLinkCounts, useLinkHousehold, useLinkSheet } from '@/lib/bhog'
import { PAGE_TINT } from '@/lib/tint'

/** This phone's last pick, so a family reopening the link lands on its own household. */
const REMEMBER = 'pujosamiti.bhog-count-household'
const recall = (): string | null => {
  try {
    return localStorage.getItem(REMEMBER)
  } catch {
    return null
  }
}
const remember = (key: string) => {
  try {
    localStorage.setItem(REMEMBER, key)
  } catch {
    // private window or blocked storage: the pick simply isn't remembered
  }
}

/**
 * The bhog headcount link: /bhog/count/?c=X481216 — no sign-in. The samiti
 * shares one code per Durga Pujo; whoever opens it picks their household from
 * the Responses list (core members, then members) and gives its counts for
 * the five days, within the household's allowance. Each day closes four days
 * before it. Kept out of search.
 */
export function BhogCount() {
  const [params] = useSearchParams()
  const code = (params.get('c') ?? '').trim()
  const { data: sheet, isPending, error } = useLinkSheet(code)
  const [picked, setPicked] = useState<string | null>(recall)
  const householdKey = sheet && picked && sheet.households.some((h) => h.key === picked) ? picked : null
  const household = useLinkHousehold(code, householdKey)
  const queryClient = useQueryClient()

  const pick = (key: string) => {
    setPicked(key)
    remember(key)
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      {/* the WhatsApp card: keep in step with the /bhog/count entry in scripts/prerender.mjs */}
      <Seo
        title="Durga Pujo bhog · Give your household’s headcount"
        bareTitle
        description="Find your household and tell the samiti how many will eat bhog each day, Saptami to Dashami — everyone aged 5 and above. Each day’s count closes four days before it. Magarpatta Pujo Samiti."
        path="/bhog/count"
        image="https://pujosamiti.github.io/bhog-share.webp"
        noindex
      />
      <div className="flex flex-col gap-1">
        <PageTitle tint={PAGE_TINT.bhog}>Bhog headcount</PageTitle>
        {sheet && (
          <p className="text-muted-foreground">
            {sheet.eventName}
            {sheet.eventNameBn && <span className="ml-2">{sheet.eventNameBn}</span>}
          </p>
        )}
      </div>

      {!code ? (
        <Card>
          <CardHeader>
            <CardTitle>Open the samiti’s link</CardTitle>
            <CardDescription>
              The headcount page opens from the link the samiti shares on WhatsApp — it carries the code this page needs.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : isPending ? (
        <div className="flex justify-center py-12">
          <LogoSpinner />
        </div>
      ) : error || !sheet ? (
        <Card>
          <CardHeader>
            <CardTitle>This link won’t open</CardTitle>
            <CardDescription>{error?.message ?? 'Ask the samiti for the current link.'}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-col gap-2 pt-6">
              <span className="text-sm font-medium">Your household</span>
              <SearchSelect
                options={sheet.households.map((h) => ({
                  value: h.key,
                  label: h.name,
                  group: h.tier === 'core' ? 'Core members' : 'Members',
                }))}
                value={householdKey}
                onChange={pick}
                ariaLabel="Your household"
                placeholder="Find your household…"
                align="left"
                fullWidth
              />
              <p className="text-xs text-muted-foreground">
                Households that paid a subscription or sponsorship this year. Not listed? Speak to the samiti.
              </p>
            </CardContent>
          </Card>

          {householdKey && household.isPending && (
            <div className="flex justify-center py-8">
              <LogoSpinner small />
            </div>
          )}
          {household.error && <p className="text-sm text-destructive">{household.error.message}</p>}
          {household.data && (
            <Card>
              <CardHeader>
                <CardTitle>{household.data.household.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <HeadcountEditor
                  key={household.data.household.key}
                  view={household.data}
                  save={async (counts) => {
                    const view = await saveLinkCounts({ code, householdKey: household.data.household.key, counts })
                    queryClient.setQueryData(['bhog-link-household', code, view.household.key], view)
                  }}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
