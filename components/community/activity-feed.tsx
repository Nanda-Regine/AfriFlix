'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn, timeAgo } from '@/lib/utils'
import { CATEGORY_META } from '@/types'

interface ActivityItem {
  id: string
  actor_creator_id: string
  actor_display_name: string
  actor_avatar_url: string | null
  verb: 'published_work' | 'published_note' | 'started_collab' | 'milestone'
  object_type: 'work' | 'note' | 'collab' | null
  object_id: string | null
  object_title: string | null
  object_thumbnail: string | null
  object_category: string | null
  is_read: boolean
  created_at: string
}

const VERB_LABEL: Record<ActivityItem['verb'], string> = {
  published_work: 'dropped new work',
  published_note: 'posted an update',
  started_collab: 'opened a collab',
  milestone: 'reached a milestone',
}

export function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const load = useCallback(async (cursor?: string) => {
    const params = new URLSearchParams({ limit: '20' })
    if (cursor) params.set('cursor', cursor)
    const res = await fetch(`/api/activity?${params}`)
    if (!res.ok) return
    const data = await res.json()
    return data
  }, [])

  useEffect(() => {
    load().then(data => {
      if (data) {
        setItems(data.items)
        setNextCursor(data.nextCursor)
      }
      setLoading(false)
    })
  }, [load])

  async function loadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    const data = await load(nextCursor)
    if (data) {
      setItems(prev => [...prev, ...data.items])
      setNextCursor(data.nextCursor)
    }
    setLoadingMore(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-white/5 flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 bg-white/5 rounded w-48" />
              <div className="h-12 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">🌍</p>
        <p className="font-syne text-ivory mb-2">Your feed is empty</p>
        <p className="text-ivory-dim text-sm">Follow creators to see their latest drops here</p>
        <Link href="/explore" className="mt-4 inline-block px-5 py-2 bg-gold text-black text-sm font-syne font-semibold rounded-pill hover:bg-gold-light transition-colors">
          Discover Creators
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-4">
        {items.map(item => (
          <ActivityCard key={item.id} item={item} />
        ))}
      </div>

      {nextCursor && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 border border-white/10 rounded-pill text-sm text-ivory-mid hover:border-gold/30 hover:text-ivory transition-colors font-syne"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}

function ActivityCard({ item }: { item: ActivityItem }) {
  const meta = item.object_category ? CATEGORY_META[item.object_category as keyof typeof CATEGORY_META] ?? null : null
  const href = item.object_type === 'work' && item.object_id
    ? `/work/${item.object_id}`
    : item.object_type === 'collab' && item.object_id
    ? `/collabs/${item.object_id}`
    : null

  return (
    <div className={cn(
      'bg-black-card border rounded-xl p-4 transition-colors',
      !item.is_read ? 'border-gold/20' : 'border-white/5'
    )}>
      <div className="flex gap-3">
        {/* Creator avatar */}
        <Link href={`/creator/${item.actor_creator_id}`} className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gold/20 overflow-hidden">
            {item.actor_avatar_url ? (
              <Image src={item.actor_avatar_url} alt={item.actor_display_name} width={40} height={40} className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-syne font-bold text-gold">
                {item.actor_display_name[0]}
              </div>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          {/* Action line */}
          <p className="text-sm mb-2">
            <Link href={`/creator/${item.actor_creator_id}`} className="font-syne font-semibold text-ivory hover:text-gold transition-colors">
              {item.actor_display_name}
            </Link>
            <span className="text-ivory-dim"> {VERB_LABEL[item.verb]}</span>
            <span className="text-[11px] font-mono text-ivory-dim ml-2">{timeAgo(item.created_at)}</span>
          </p>

          {/* Object card */}
          {href && item.object_title && (
            <Link
              href={href}
              className="flex items-center gap-3 bg-black-mid border border-white/5 rounded-lg p-3 hover:border-gold/20 transition-colors group"
            >
              {item.object_thumbnail && (
                <div className="relative w-16 aspect-video rounded overflow-hidden flex-shrink-0 bg-black">
                  <Image src={item.object_thumbnail} alt={item.object_title} fill className="object-cover" sizes="64px" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-syne font-semibold text-ivory group-hover:text-gold transition-colors truncate">
                  {item.object_title}
                </p>
                {meta && (
                  <p className="text-xs font-mono text-ivory-dim mt-0.5">{meta.label}</p>
                )}
              </div>
            </Link>
          )}

          {/* Note preview */}
          {item.verb === 'published_note' && item.object_title && !href && (
            <div className="bg-black-mid border border-white/5 rounded-lg p-3">
              <p className="text-sm text-ivory-mid leading-relaxed line-clamp-2">{item.object_title}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
