import { useCallback, useEffect, useRef, useState } from 'react'

import { svgToImage } from '@/lib/cardCanvas'

/**
 * A printed piece's pages, drawn on canvases: each page's art is an SVG the
 * page renders off-screen (handed over through `refFor`), painted at any
 * scale and finished by `draw` — the words, the photographs. `draw` is null
 * until everything it needs is in (fonts, images, data); then every page is
 * drawn once at 1× for its preview, and `render` draws one again at the
 * export scale. Shared by the invitation card and the cultural flyer.
 */
export function useCardPages<K extends string>(
  keys: readonly K[],
  size: { w: number; h: number },
  draw: ((key: K, ctx: CanvasRenderingContext2D) => void) | null,
) {
  const svgs = useRef<Partial<Record<K, SVGSVGElement | null>>>({})
  const refFor = (key: K) => (el: SVGSVGElement | null) => {
    svgs.current[key] = el
  }
  const { w, h } = size

  const render = useCallback(
    async (key: K, scale: number) => {
      const svg = svgs.current[key]
      if (!svg || !draw) throw new Error('The card is not ready yet')
      const art = await svgToImage(svg, w, h, scale)
      const canvas = document.createElement('canvas')
      canvas.width = w * scale
      canvas.height = h * scale
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(art, 0, 0)
      ctx.scale(scale, scale)
      draw(key, ctx)
      return canvas
    },
    [draw, w, h],
  )

  const [previews, setPreviews] = useState<Partial<Record<K, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const keyList = keys.join('|')
  useEffect(() => {
    if (!draw) return
    let live = true
    const urls: string[] = []
    ;(async () => {
      for (const key of keyList.split('|') as K[]) {
        const canvas = await render(key, 1)
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
        if (!blob || !live) return
        const url = URL.createObjectURL(blob)
        urls.push(url)
        setPreviews((prev) => ({ ...prev, [key]: url }))
      }
    })().catch((e: Error) => live && setError(e.message))
    return () => {
      live = false
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [draw, render, keyList])

  const ready = !!draw && keys.every((k) => previews[k])
  return { refFor, render, previews, ready, error, setError }
}
