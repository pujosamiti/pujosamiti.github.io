import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

/**
 * Minimal controlled modal on the native <dialog> element — free focus trap,
 * Escape handling and top-layer stacking, no portal library needed.
 * Closes on backdrop click; the parent owns the open state.
 */
export function Dialog({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const openRef = useRef(open)
  openRef.current = open

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      // the native close event also fires when WE close programmatically
      // (open prop already false) — only user-initiated closes (Escape)
      // should be reported upward, else closing step 1 kills step 2
      onClose={() => {
        if (openRef.current) onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose() // backdrop click
      }}
      className={cn(
        'm-auto w-[calc(100vw-2rem)] max-w-sm rounded-xl border bg-card p-0 text-card-foreground shadow-xl',
        'backdrop:bg-black/50 backdrop:backdrop-blur-[2px]',
        className,
      )}
    >
      <div className="flex flex-col gap-3 p-5">{children}</div>
    </dialog>
  )
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-bold">{children}</h2>
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}

export function DialogActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 flex justify-end gap-2">{children}</div>
}
