import { Check, Copy, Link2, Share2, X } from 'lucide-react'
import { useState } from 'react'
import type * as React from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * A public page's link, ready to pass on: the address, Copy, and WhatsApp and
 * Facebook — where the page previews with its own share card (from the
 * prerendered HTML). The WhatsApp message carries a line of its own before
 * the link; Facebook takes the link alone.
 */
export function SharePanel({
  title,
  description,
  url,
  message,
  onClose,
}: {
  title: string
  description: React.ReactNode
  url: string
  message: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      window.prompt('Copy the link', url)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Link2 className="size-5" /> {title}
          </CardTitle>
          <Button size="icon" variant="ghost" className="-mr-2 -mt-2 shrink-0" onClick={onClose} aria-label={`Close ${title.toLowerCase()}`} title="Close">
            <X />
          </Button>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="rounded-md bg-accent px-3 py-2">
          <a href={url} target="_blank" rel="noreferrer" className="break-all text-sm text-primary underline-offset-4 hover:underline">
            {url}
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void copy()}>
            {copied ? <Check /> : <Copy />} {copied ? 'Copied' : 'Copy link'}
          </Button>
          <Button size="sm" variant="durba" asChild>
            <a href={`https://wa.me/?text=${encodeURIComponent(`${message}\n${url}`)}`} target="_blank" rel="noreferrer">
              <Share2 /> Share on WhatsApp
            </a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer">
              <Share2 /> Share on Facebook
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
