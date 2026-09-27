import { readLocal, writeLocal } from '@/lib/umaDaily'

/**
 * The little music of a win in উমা: a temple bell (ghanta) — three soft
 * strikes rising, then a high shimmer, about two seconds. It is made in the
 * browser with the Web Audio API, so there is no recording to license or
 * download. Browsers only allow sound after a tap, which a win always is, so
 * `playWinChime` must be called from the tap itself (the last tile, the
 * answer). A switch on the badge card turns it off; the phone remembers.
 */

const KEY = 'uma-sound'
export const soundOn = (): boolean => readLocal<boolean>(KEY) ?? true
export const setSoundOn = (on: boolean): void => writeLocal(KEY, on)

let ctx: AudioContext | null = null
function audio(): AudioContext | null {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx ??= new Ctor()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** A bell: a fundamental and the inharmonic partials that make brass sound like a bell. */
function bell(ac: AudioContext, out: AudioNode, at: number, freq: number, level: number) {
  const partials: [ratio: number, gain: number, decay: number][] = [
    [1, 1, 1.6],
    [2.0, 0.55, 1.1],
    [2.76, 0.4, 0.8],
    [5.4, 0.22, 0.5],
    [8.93, 0.1, 0.3],
  ]
  for (const [ratio, gain, decay] of partials) {
    const osc = ac.createOscillator()
    const env = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq * ratio
    env.gain.setValueAtTime(0.0001, at)
    env.gain.exponentialRampToValueAtTime(level * gain, at + 0.006)
    env.gain.exponentialRampToValueAtTime(0.0001, at + decay)
    osc.connect(env).connect(out)
    osc.start(at)
    osc.stop(at + decay + 0.05)
  }
}

export function playWinChime(): void {
  if (!soundOn()) return
  const ac = audio()
  if (!ac) return
  try {
    const t = ac.currentTime + 0.03
    const master = ac.createGain()
    master.gain.value = 0.18
    master.connect(ac.destination)
    // three strikes rising — G5, B5, D6 — then a high E6 to finish
    bell(ac, master, t, 783.99, 0.9)
    bell(ac, master, t + 0.17, 987.77, 0.8)
    bell(ac, master, t + 0.34, 1174.66, 0.8)
    bell(ac, master, t + 0.62, 1318.51, 0.6)
  } catch {
    /* no sound is never an error */
  }
}
