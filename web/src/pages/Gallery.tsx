import { useQuery } from '@tanstack/react-query'
import type { GalleryItem } from '@pujosamiti/shared'

import { api } from '@/lib/api'

function itemUrl(item: GalleryItem) {
  return item.kind === 'photo'
    ? `https://drive.google.com/thumbnail?id=${item.ref}&sz=w800`
    : `https://www.youtube.com/embed/${item.ref}`
}

export function Gallery() {
  const gallery = useQuery({
    queryKey: ['gallery'],
    queryFn: () => api<GalleryItem[]>('/api/public/gallery'),
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Gallery</h1>
      {gallery.isLoading && <p className="text-sm text-muted-foreground">Loading gallery…</p>}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {gallery.data?.map((item) =>
          item.kind === 'photo' ? (
            <img
              key={item.id}
              src={itemUrl(item)}
              alt={item.caption ?? 'Pujo moment'}
              loading="lazy"
              className="aspect-square w-full rounded-lg border object-cover"
            />
          ) : (
            <iframe
              key={item.id}
              src={itemUrl(item)}
              title={item.caption ?? 'Pujo video'}
              loading="lazy"
              className="aspect-square w-full rounded-lg border"
              allowFullScreen
            />
          ),
        )}
      </div>
      {gallery.data?.length === 0 && (
        <p className="text-sm text-muted-foreground">Photos from the pandal are on their way.</p>
      )}
    </div>
  )
}
