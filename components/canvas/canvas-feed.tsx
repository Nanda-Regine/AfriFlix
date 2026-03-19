'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { formatCount } from '@/lib/utils'
import type { Work } from '@/types'

interface CanvasWork extends Work {
  creator: {
    id: string
    display_name: string
    username: string
    avatar_url: string | null
  }
}

interface Props {
  initialWorks: CanvasWork[]
}

const CATEGORY_COLORS: Record<string, string> = {
  film: 'text-terra-light',
  music: 'text-gold',
  dance: 'text-amber-400',
  poetry: 'text-purple-400',
  writing: 'text-sky-400',
  comedy: 'text-green-400',
  theatre: 'text-rose-400',
  visual_art: 'text-pink-400',
}

export function CanvasFeed({ initialWorks }: Props) {
  const [works, setWorks] = useState<CanvasWork[]>(initialWorks)
  const [activeIndex, setActiveIndex] = useState(0)
  const [hearts, setHearts] = useState<Record<string, { count: number; liked: boolean }>>({})
  const [offset, setOffset] = useState(initialWorks.length)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map())
  const supabase = createClient()
  const { user } = useAuthStore()

  // Initialize heart state from works
  useEffect(() => {
    const h: Record<string, { count: number; liked: boolean }> = {}
    initialWorks.forEach(w => { h[w.id] = { count: w.heart_count, liked: false } })
    setHearts(h)
  }, [initialWorks])

  // Intersection Observer — pause/play videos + track active card
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          const index = Number(entry.target.getAttribute('data-index'))
          if (entry.isIntersecting) {
            setActiveIndex(index)
            const video = videoRefs.current.get(index)
            if (video) video.play().catch(() => {})
          } else {
            const video = videoRefs.current.get(index)
            if (video) { video.pause(); video.currentTime = 0 }
          }
        }
      },
      { threshold: 0.7 }
    )

    cardRefs.current.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [works])

  // Load more when near end
  useEffect(() => {
    if (activeIndex >= works.length - 3 && !loading && hasMore) {
      loadMore()
    }
  }, [activeIndex])

  async function loadMore() {
    if (loading || !hasMore) return
    setLoading(true)
    const supabaseServer = createClient()
    const { data } = await supabaseServer
      .from('works')
      .select('*, creator:creators(id, display_name, username, avatar_url)')
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .range(offset, offset + 9)
    if (!data || data.length === 0) {
      setHasMore(false)
    } else {
      setWorks(prev => [...prev, ...(data as CanvasWork[])])
      setOffset(prev => prev + data.length)
      const h: Record<string, { count: number; liked: boolean }> = {}
      data.forEach((w: Work) => { h[w.id] = { count: w.heart_count, liked: false } })
      setHearts(prev => ({ ...prev, ...h }))
    }
    setLoading(false)
  }

  async function toggleHeart(workId: string) {
    if (!user) return
    const current = hearts[workId]
    if (!current) return

    const newLiked = !current.liked
    setHearts(prev => ({ ...prev, [workId]: { count: current.count + (newLiked ? 1 : -1), liked: newLiked } }))

    if (newLiked) {
      await supabase.from('hearts').insert({ user_id: user.id, work_id: workId })
    } else {
      await supabase.from('hearts').delete().eq('user_id', user.id).eq('work_id', workId)
    }
  }

  function setCardRef(index: number, el: HTMLDivElement | null) {
    if (el) cardRefs.current.set(index, el)
    else cardRefs.current.delete(index)
  }

  function setVideoRef(index: number, el: HTMLVideoElement | null) {
    if (el) videoRefs.current.set(index, el)
    else videoRefs.current.delete(index)
  }

  return (
    <div
      ref={containerRef}
      className="h-[100svh] overflow-y-scroll"
      style={{ scrollSnapType: 'y mandatory', scrollBehavior: 'smooth' }}
    >
      {works.map((work, index) => (
        <CanvasCard
          key={work.id}
          work={work}
          index={index}
          isActive={index === activeIndex}
          heartState={hearts[work.id] ?? { count: work.heart_count, liked: false }}
          onHeart={() => toggleHeart(work.id)}
          setRef={el => setCardRef(index, el)}
          setVideoRef={el => setVideoRef(index, el)}
        />
      ))}

      {loading && (
        <div className="h-16 flex items-center justify-center text-ivory-dim text-sm" style={{ scrollSnapAlign: 'none' }}>
          Loading more...
        </div>
      )}
      {!hasMore && (
        <div className="h-24 flex flex-col items-center justify-center gap-2" style={{ scrollSnapAlign: 'none' }}>
          <p className="text-ivory-dim text-sm">You've seen everything</p>
          <Link href="/explore" className="text-gold text-sm hover:text-gold-light">Explore more</Link>
        </div>
      )}
    </div>
  )
}

interface CardProps {
  work: CanvasWork
  index: number
  isActive: boolean
  heartState: { count: number; liked: boolean }
  onHeart: () => void
  setRef: (el: HTMLDivElement | null) => void
  setVideoRef: (el: HTMLVideoElement | null) => void
}

function CanvasCard({ work, index, isActive, heartState, onHeart, setRef, setVideoRef }: CardProps) {
  const isVideo = ['film', 'dance', 'comedy', 'theatre'].includes(work.category)
  const isAudio = work.category === 'music'
  const isText = ['poetry', 'writing'].includes(work.category)
  const catColor = CATEGORY_COLORS[work.category] ?? 'text-ivory'

  return (
    <div
      ref={setRef}
      data-index={index}
      className="relative w-full flex-shrink-0 bg-black overflow-hidden"
      style={{ height: '100svh', scrollSnapAlign: 'start' }}
    >
      {/* Background layer */}
      {isVideo && work.video_url ? (
        <video
          ref={setVideoRef}
          src={work.video_url}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          muted
          playsInline
          poster={work.video_thumbnail ?? undefined}
        />
      ) : isAudio && work.cover_art_url ? (
        <div className="absolute inset-0">
          <Image src={work.cover_art_url} alt={work.title} fill className="object-cover blur-xl scale-110 opacity-40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-56 h-56 rounded-3xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/10">
              <Image src={work.cover_art_url} alt={work.title} fill className="object-cover" />
            </div>
          </div>
        </div>
      ) : isText ? (
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black-mid to-black flex items-center justify-center p-10">
          <div className="max-w-lg">
            <p className="font-syne text-xl sm:text-2xl text-ivory leading-relaxed line-clamp-10 italic">
              {work.written_content?.slice(0, 400) ?? work.description ?? ''}
              {(work.written_content?.length ?? 0) > 400 ? '…' : ''}
            </p>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 kente-bg opacity-40" />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/5 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent pointer-events-none" />

      {/* Content — bottom left */}
      <div className="absolute bottom-0 left-0 right-16 p-5 pb-8">
        {/* Category label */}
        <p className={`text-xs font-mono uppercase tracking-wider mb-2 ${catColor}`}>
          {work.category.replace('_', ' ')}
        </p>

        {/* Title */}
        <h2 className="font-syne font-bold text-2xl sm:text-3xl text-ivory leading-tight mb-2 line-clamp-2">
          {work.title}
        </h2>

        {/* AI summary or description */}
        {(work.ai_summary || work.description) && (
          <p className="text-ivory-mid text-sm leading-relaxed line-clamp-2 mb-4 max-w-sm">
            {work.ai_summary ?? work.description}
          </p>
        )}

        {/* Creator */}
        <Link href={`/creator/${work.creator.username}`} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-gold/20 overflow-hidden flex-shrink-0 ring-1 ring-gold/30">
            {work.creator.avatar_url ? (
              <Image src={work.creator.avatar_url} alt={work.creator.display_name} width={32} height={32} className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gold text-xs font-syne font-bold">
                {work.creator.display_name[0]}
              </div>
            )}
          </div>
          <span className="text-sm text-ivory group-hover:text-gold transition-colors font-syne font-medium">
            {work.creator.display_name}
          </span>
        </Link>

        {/* Mood tags */}
        {work.mood_tags?.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {work.mood_tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-ivory-dim">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons — right side */}
      <div className="absolute right-4 bottom-8 flex flex-col items-center gap-5">
        {/* Heart */}
        <button onClick={onHeart} className="flex flex-col items-center gap-1 group">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 ${heartState.liked ? 'bg-terra/80 scale-110' : 'bg-white/10 group-hover:bg-white/20'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={heartState.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className={heartState.liked ? 'text-white' : 'text-white'}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <span className="text-xs text-white/80 font-mono">{formatCount(heartState.count)}</span>
        </button>

        {/* View full work */}
        <Link href={`/work/${work.id}`} className="flex flex-col items-center gap-1 group">
          <div className="w-11 h-11 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center backdrop-blur-sm transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15,3 21,3 21,9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </div>
          <span className="text-xs text-white/80 font-mono">{formatCount(work.view_count)}</span>
        </Link>

        {/* Share */}
        <button
          onClick={() => navigator.share?.({ title: work.title, url: `${window.location.origin}/work/${work.id}` }).catch(() => {})}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="w-11 h-11 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center backdrop-blur-sm transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </div>
          <span className="text-xs text-white/80 font-mono">Share</span>
        </button>
      </div>

      {/* Index indicator — top right */}
      <div className="absolute top-20 right-4 flex flex-col gap-1">
        {Array.from({ length: Math.min(5, 1) }).map((_, i) => (
          <div key={i} className={`w-1 h-1 rounded-full ${i === 0 ? 'bg-gold' : 'bg-white/20'}`} />
        ))}
      </div>
    </div>
  )
}
