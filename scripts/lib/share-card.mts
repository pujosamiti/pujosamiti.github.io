/**
 * A share card from an HTML page: photographed by headless Chrome at its own
 * size, then squeezed by cwebp under 100 KB (WhatsApp shows no image above
 * ~100 KB, though Facebook does). Used by the invitation's and the cultural
 * flyer's share-card scripts.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'

/** Chrome: CHROME_PATH, or Google Chrome / Playwright's Chromium where they usually live. */
function chrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const candidates = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium']
  const pw = join(homedir(), 'Library', 'Caches', 'ms-playwright')
  if (existsSync(pw))
    for (const d of readdirSync(pw).filter((d) => d.startsWith('chromium-')).sort().reverse())
      candidates.push(join(pw, d, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'))
  const found = candidates.find((c) => existsSync(c))
  if (!found) throw new Error('No Chrome found — set CHROME_PATH')
  return found
}

/** The page the card is drawn on: the site's two typefaces, the art behind, the words over it. */
export const cardPage = (w: number, h: number, background: string, body: string) => `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@500;600;700&family=Noto+Serif+Bengali:wght@600&display=block">
<style>html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:${background}}div{line-height:1}</style>
</head><body>${body}</body></html>`

export function photographCard(html: string, w: number, h: number, out: string) {
  const dir = mkdtempSync(join(tmpdir(), 'share-card-'))
  const page = join(dir, 'card.html')
  const png = join(dir, 'card.png')
  writeFileSync(page, html)
  execFileSync(
    chrome(),
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--allow-file-access-from-files',
      `--window-size=${w},${h}`,
      '--virtual-time-budget=15000',
      `--screenshot=${png}`,
      `file://${page}`,
    ],
    { stdio: 'ignore' },
  )
  execFileSync('cwebp', ['-quiet', '-m', '6', '-size', '95000', '-pass', '10', png, '-o', out])
  const kb = statSync(out).size / 1024
  console.log(`${out} — ${w} × ${h}, ${kb.toFixed(0)} KB${kb >= 100 ? '  ⚠ over 100 KB: WhatsApp will show no image' : ''}`)
  console.log(`(the page it was drawn from: ${page})`)
}
