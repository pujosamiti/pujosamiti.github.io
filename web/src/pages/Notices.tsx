import { useQuery } from '@tanstack/react-query'
import type { Notice } from '@pujosamiti/shared'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'

export function Notices() {
  const notices = useQuery({
    queryKey: ['notices'],
    queryFn: () => api<Notice[]>('/api/public/notices'),
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Notice board</h1>
      {notices.isLoading && <p className="text-sm text-muted-foreground">Loading notices…</p>}
      {notices.data?.map((n) => (
        <Card key={n.id} className={n.pinned ? 'border-l-4 border-l-genda' : undefined}>
          <CardHeader>
            <div className="flex items-center gap-2">
              {n.pinned && <Badge variant="genda">Pinned</Badge>}
              <span className="text-xs text-matir">
                {new Date(n.publishedAt).toLocaleDateString()}
              </span>
            </div>
            <CardTitle>{n.title}</CardTitle>
          </CardHeader>
          <CardContent className="prose-sm max-w-none text-sm">
            <Markdown remarkPlugins={[remarkGfm]}>{n.body}</Markdown>
          </CardContent>
        </Card>
      ))}
      {notices.data?.length === 0 && (
        <p className="text-sm text-muted-foreground">No notices yet — check back soon.</p>
      )}
    </div>
  )
}
