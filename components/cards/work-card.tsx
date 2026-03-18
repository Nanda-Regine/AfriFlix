'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn, generateCardBg, formatDuration, formatCount } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useAudioPlayer } from '@/store/audio-player'
import type { Work } from '@/types'

interface WorkCardProps {
  work: Work
  index?: number
  badge?: string
  badgeVariant?: 'gold' | 'terra' | 'dark' | 'trophy'
  onPlay?: (work: Work) => void
}

export function WorkCard({ work, index = 0, badge, badgeVariant = 'dark', onPlay }: WorkCardProps) {
  const [hovered, setHovered] = useState(false)
  const [description, setDescription] = useState<string | null>(null)
  const [loadingDesc, setLoadingDesc] = useState(false)
  const descFetched = useRef(false)
  const { play } = useAudioPlayer()

  const isAudio = work.category === 'music'
  const isText = work.category === 'writing'
  const thumbnail = work.video_thumbnail || work.cover_art_url
  const duration = work.video_duration_seconds || work.audio_duration_seconds

  async function fetchDescription() {
    if (descFetched.current || description) return
    descFetched.current = true
    setLoadingDesc(true)

    // Check localStorage cache first
    const cacheKey = `afriflix_desc_${work.id}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      setDescription(cached)
      setLoadingDesc(false)
      return
    }

    try {
      const res = await fetch('/api/ai/card-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: work.title, category: work.category }),
      })
      const data = await res.json()
      setDescription(data.description)
      localStorage.setItem(cacheKey, data.description)
    } catch {
      setDescription(null)
    } finally {
      setLoadingDesc(false)
    }
  }

  function handleMouseEnter() {
    setHovered(true)
    if (window.innerWidth >= 768) fetchDescription()
  }

  function handlePlay(e: React.MouseEvent) {
    e.preventDefault()
    if (isAudio) {
      play(work)
    } else if (onPlay) {
      onPlay(work)
    }
  }

  return (
    <Link
      href={`/work/${work.id}`}
      className="group relative flex-shrink-0 w-44 sm:w-48 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-lg"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Poster */}
      <div
        className={cn(
          'relative w-full aspect-[2/3] rounded-lg overflow-hidden transition-all duration-300',
          'shadow-card group-hover:shadow-gold-strong group-hover:scale-[1.03]',
          !thumbnail && generateCardBg(index)
        )}
      >
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={work.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 176px, 192px"
          />
        ) : (
          <div className="absolute inset-0 flex items-end">
            {/* Decorative letter */}
            <span className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 font-syne font-bold text-7xl text-white/10 select-none">
              {work.title[0]}
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Badge */}
        {badge && (
          <div className="absolute top-2 left-2">
            <Badge variant={badgeVariant}>{badge}</Badge>
          </div>
        )}

        {/* Duration */}
        {duration && (
          <span className="absolute bottom-2 right-2 text-xs font-mono text-ivory-mid bg-black/60 px-1.5 py-0.5 rounded">
            {formatDuration(duration)}
          </span>
        )}

        {/* Hover overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-black/60 flex flex-col justify-end p-3 transition-opacity duration-200',
            hovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          {/* AI description */}
          <div className="mb-3 min-h-[40px]">
            {loadingDesc ? (
              <div className="space-y-1">
                <div className="h-2 bg-white/10 rounded animate-shimmer" />
                <div className="h-2 bg-white/10 rounded animate-shimmer w-4/5" />
              </div>
            ) : description ? (
              <p className="text-xs text-ivory leading-relaxed">{description}</p>
            ) : null}
          </div>

          {/* Action row */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlay}
              className="w-9 h-9 rounded-full bg-gold flex items-center justify-center text-black hover:bg-gold-light transition-colors flex-shrink-0"
              aria-label={`Play ${work.title}`}
            >
              <PlayIcon />
            </button>
            <button
              onClick={e => { e.preventDefault(); /* TODO: save to collection */ }}
              className="w-9 h-9 rounded-full bg-black-card border border-white/20 flex items-center justify-center text-ivory-mid hover:text-ivory transition-colors"
              aria-label="Save"
            >
              <SaveIcon />
            </button>
            {work.heart_count > 0 && (
              <span className="text-xs text-ivory-dim ml-auto font-mono">
                {formatCount(work.heart_count)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="mt-2 px-0.5">
        <p className="text-sm font-syne text-ivory leading-snug line-clamp-2 group-hover:text-gold transition-colors">
          {work.title}
        </p>
        {work.creator && (
          <p className="text-xs text-ivory-dim mt-0.5 truncate">
            {work.creator.display_name}
          </p>
        )}
      </div>
    </Link>
  )
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  )
}

function SaveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}
