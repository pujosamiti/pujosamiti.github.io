import { useEffect, useRef } from 'react'

/** The pujo's own colours: jaba, genda, shiuli, aparajita, durba, padma, jarul. */
const COLOURS = ['#d70000', '#efa51e', '#d96410', '#3d5a9e', '#3a7d44', '#d34f8d', '#7d5bbe']
const PIECES = 170
const LIFE_MS = 2800

interface Piece {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  colour: string
  spin: number
  angle: number
  round: boolean
}

/**
 * A one-shot confetti burst over the whole screen, drawn on a canvas that
 * ignores the pointer and removes itself when the pieces have fallen. It
 * stays still for anyone who has asked their phone to reduce motion.
 * Re-fires whenever `burst` changes to a new truthy value.
 */
export function Confetti({ burst }: { burst: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!burst || !canvas) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    // two cannons at the lower corners, aimed up and inward
    const pieces: Piece[] = Array.from({ length: PIECES }, (_, i) => {
      const left = i % 2 === 0
      const angle = (left ? -60 : -120) * (Math.PI / 180) + (Math.random() - 0.5) * 0.9
      // tuned by simulation: the typical piece peaks mid-screen, the highest in the top quarter
      const speed = 16 + Math.random() * 10
      return {
        x: left ? w * 0.08 : w * 0.92,
        y: h * 0.95,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * (h / 700),
        size: 5 + Math.random() * 6,
        colour: COLOURS[i % COLOURS.length]!,
        spin: (Math.random() - 0.5) * 0.35,
        angle: Math.random() * Math.PI,
        round: Math.random() < 0.3,
      }
    })

    const start = performance.now()
    let frame = 0
    const draw = (now: number) => {
      const t = now - start
      ctx.clearRect(0, 0, w, h)
      ctx.globalAlpha = t > LIFE_MS - 700 ? Math.max(0, (LIFE_MS - t) / 700) : 1
      for (const p of pieces) {
        p.vy += 0.3 // gravity
        p.vx *= 0.985 // air
        p.vy *= 0.985
        p.x += p.vx
        p.y += p.vy
        p.angle += p.spin
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        ctx.fillStyle = p.colour
        if (p.round) {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx.restore()
      }
      if (t < LIFE_MS) frame = requestAnimationFrame(draw)
      else ctx.clearRect(0, 0, w, h)
    }
    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [burst])

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 size-full" />
}
