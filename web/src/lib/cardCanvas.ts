/**
 * Drawing a printed card on a canvas: the art arrives as an SVG page (alpona,
 * Warli, the frame — vector, so it rasterises sharp at any export scale), the
 * photographs and the words are painted over it. Words go on the canvas
 * rather than into the SVG because an SVG painted as an image can't reach the
 * page's web fonts; the canvas can, Bengali conjuncts and all.
 */

/** The card's two typefaces, as the site sets them (index.css). */
export const SERIF = '"Noto Serif Bengali", Georgia, serif'
export const SANS = '"Hind Siliguri", "Noto Sans Bengali", sans-serif'

/**
 * Wait for every face and weight the card draws with. Google Fonts serves
 * Bengali and Latin as separate subsets, so ask for both scripts — a canvas
 * never triggers a font download by itself.
 */
export async function loadCardFonts() {
  const sample = 'দুর্গাপূজা নির্ঘণ্ট ২০২৬ Durga Puja 2026'
  const faces = [
    `500 32px ${SERIF}`,
    `600 32px ${SERIF}`,
    `700 32px ${SERIF}`,
    `400 32px ${SANS}`,
    `500 32px ${SANS}`,
    `600 32px ${SANS}`,
    `700 32px ${SANS}`,
  ]
  await Promise.all(faces.map((f) => document.fonts.load(f, sample)))
  await document.fonts.ready
}

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Could not load ${src}`))
    img.src = src
  })
}

/**
 * An SVG element, as an image `scale` times its viewBox — sized up front, so
 * the browser rasterises the vector at the export resolution rather than
 * stretching a small bitmap.
 */
export async function svgToImage(svg: SVGSVGElement, width: number, height: number, scale: number) {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(width * scale))
  clone.setAttribute('height', String(height * scale))
  clone.removeAttribute('class')
  clone.removeAttribute('style')
  const markup = new XMLSerializer().serializeToString(clone)
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }))
  try {
    return await loadImage(url)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export type TextStyle = {
  size: number
  weight?: number
  family?: 'serif' | 'sans'
  color: string
  align?: CanvasTextAlign
  /** shrink (to `minScale` of `size`) until the line fits this width */
  maxWidth?: number
  minScale?: number
  letterSpacing?: number
}

export const fontOf = (s: Pick<TextStyle, 'size' | 'weight' | 'family'>, size = s.size) =>
  `${s.weight ?? 400} ${size}px ${s.family === 'serif' ? SERIF : SANS}`

/** The size a line is drawn at: its own, or smaller until it fits `maxWidth`. */
export function fittedSize(ctx: CanvasRenderingContext2D, text: string, s: TextStyle) {
  if (!s.maxWidth) return s.size
  const floor = s.size * (s.minScale ?? 0.8)
  let size = s.size
  ctx.font = fontOf(s, size)
  while (size > floor && ctx.measureText(text).width > s.maxWidth) {
    size -= 0.5
    ctx.font = fontOf(s, size)
  }
  return size
}

export function measure(ctx: CanvasRenderingContext2D, text: string, s: TextStyle) {
  ctx.font = fontOf(s, fittedSize(ctx, text, s))
  return ctx.measureText(text).width
}

/** One line, its baseline at y. */
export function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, s: TextStyle) {
  const size = fittedSize(ctx, text, s)
  ctx.font = fontOf(s, size)
  ctx.fillStyle = s.color
  ctx.textAlign = s.align ?? 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.letterSpacing = `${s.letterSpacing ?? 0}px`
  ctx.fillText(text, x, y)
  ctx.letterSpacing = '0px'
}

/**
 * Break a line to fit `width`, at spaces, preferring a break after a comma or
 * a slash; words are never split. At least one word per line.
 */
export function wrapText(ctx: CanvasRenderingContext2D, text: string, s: TextStyle, width: number): string[] {
  ctx.font = fontOf(s)
  if (ctx.measureText(text).width <= width) return [text]
  const words = text.split(' ')
  // a natural break first: after the last comma or slash, or before a bracket, that leaves both halves fitting
  for (let i = words.length - 1; i > 0; i--) {
    if (!/[,/]$/.test(words[i - 1]) && !words[i].startsWith('(')) continue
    const a = words.slice(0, i).join(' ')
    const b = words.slice(i).join(' ')
    if (ctx.measureText(a).width <= width && ctx.measureText(b).width <= width) return [a, b]
  }
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (line && ctx.measureText(next).width > width) {
      lines.push(line)
      line = w
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

/**
 * Like wrapText, but when the words take two lines, break them where the two
 * come out most nearly even — not a long line over a stub.
 */
export function balancedLines(ctx: CanvasRenderingContext2D, text: string, s: TextStyle, width: number): string[] {
  const lines = wrapText(ctx, text, s, width)
  if (lines.length !== 2) return lines
  ctx.font = fontOf(s)
  const words = text.split(' ')
  let best = lines
  let bestLong = Math.max(...lines.map((l) => ctx.measureText(l).width))
  for (let i = 1; i < words.length; i++) {
    const pair = [words.slice(0, i).join(' '), words.slice(i).join(' ')]
    const long = Math.max(...pair.map((l) => ctx.measureText(l).width))
    if (long <= width && long < bestLong) {
      best = pair
      bestLong = long
    }
  }
  return best
}

// ── PNG with its print size ─────────────────────────────────────────────────

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(bytes: Uint8Array) {
  let c = 0xffffffff
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/**
 * A canvas as a PNG that knows its print size: a pHYs chunk (pixels per
 * metre) after the header, which a canvas never writes — without it a print
 * shop's software assumes 72 dpi and prints the card at poster size.
 */
export async function canvasToPng(canvas: HTMLCanvasElement, dpi: number) {
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('The card could not be encoded'))), 'image/png'),
  )
  const png = new Uint8Array(await blob.arrayBuffer())
  const ppm = Math.round(dpi / 0.0254)
  const chunk = new Uint8Array(21)
  const view = new DataView(chunk.buffer)
  view.setUint32(0, 9)
  chunk.set([0x70, 0x48, 0x59, 0x73], 4) // "pHYs"
  view.setUint32(8, ppm)
  view.setUint32(12, ppm)
  chunk[16] = 1 // the unit is the metre
  view.setUint32(17, crc32(chunk.subarray(4, 17)))
  // the signature (8 bytes) and the IHDR chunk (25) come first
  const at = 33
  return new Blob([png.subarray(0, at), chunk, png.subarray(at)], { type: 'image/png' })
}

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
