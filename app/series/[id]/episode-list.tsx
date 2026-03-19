'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FilmPlayer } from '@/components/players/film-player'
import { Badge } from '@/components/ui/badge'
import { formatDuration, formatCount, timeAgo, cn } from '@/lib/utils'
import type { Work } from '@/types'

interface SeriesEpisodeListProps {
  episodes: Work[]
}

export function SeriesEpisodeList({ episodes }: SeriesEpisodeListProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const playerRef = useRef<HTMLDivElement>(null)

  const activeEpisode = activeIndex !== null ? episodes[activeIndex] : null
  const nextEpisode = activeIndex !== null && activeIndex < episodes.length - 1 ? episodes[activeIndex + 1] : null

  function playEpisode(index: number) {
    clearCountdown()
    setActiveIndex(index)
    setCountdown(null)
    // Scroll to player
    setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function clearCountdown() {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }

  function startNextEpisodeCountdown() {
    if (!nextEpisode) return
    setCountdown(5)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearCountdown()
          setActiveIndex(i => (i !== null ? i + 1 : null))
          setCountdown(null)
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => () => clearCountdown(), [])

  // Group by season
  const seasons = episodes.reduce<Record<number, Work[]>>((acc, ep) => {
    const seasonKey = ep.episode_number ? Math.ceil(ep.episode_number / 100) : 1
    if (!acc[seasonKey]) acc[seasonKey] = []
    acc[seasonKey].push(ep)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-6">
      {/* Active player */}
      {activeEpisode && (
        <div ref={playerRef} className="mb-2">
          <FilmPlayer work={activeEpisode} />

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-ivory-dim mb-0.5">
                {activeEpisode.episode_number ? `Episode ${activeEpisode.episode_number}` : 'Now Playing'}
              </p>
              <p className="font-syne font-semibold text-ivory">{activeEpisode.title}</p>
            </div>
            <button
              onClick={() => { clearCountdown(); setActiveIndex(null); setCountdown(null) }}
              className="text-xs text-ivory-dim hover:text-ivory transition-colors"
            >
              Close player
            </button>
          </div>

          {/* Next episode panel */}
          {nextEpisode && (
            <div className="mt-4 bg-black-card border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {(nextEpisode.video_thumbnail || nextEpisode.cover_art_url) && (
                    <div className="relative w-20 aspect-video rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={(nextEpisode.video_thumbnail || nextEpisode.cover_art_url)!}
                        alt={nextEpisode.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-ivory-dim font-mono">
                      Up next · Episode {nextEpisode.episode_number ?? (activeIndex! + 2)}
                    </p>
                    <p className="text-sm font-syne font-semibold text-ivory line-clamp-1">{nextEpisode.title}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {countdown !== null ? (
                    <>
                      <button
                        onClick={() => { clearCountdown(); setCountdown(null) }}
                        className="text-xs text-ivory-dim hover:text-ivory transition-colors px-3 py-1.5 border border-white/10 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => { clearCountdown(); setActiveIndex(activeIndex! + 1); setCountdown(null) }}
                        className="flex items-center gap-2 px-4 py-1.5 bg-gold text-black rounded-lg text-sm font-syne font-semibold"
                      >
                        <span className="w-5 h-5 rounded-full border-2 border-black flex items-center justify-center text-xs font-mono font-bold">
                          {countdown}
                        </span>
                        Play
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={startNextEpisodeCountdown}
                        className="text-xs text-ivory-dim hover:text-gold transition-colors px-3 py-1.5 border border-white/10 rounded-lg"
                      >
                        Autoplay
                      </button>
                      <button
                        onClick={() => playEpisode(activeIndex! + 1)}
                        className="px-4 py-1.5 bg-gold/20 border border-gold/30 text-gold rounded-lg text-sm font-syne font-medium hover:bg-gold/30 transition-colors"
                      >
                        Play next
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {!nextEpisode && activeIndex !== null && (
            <div className="mt-3 text-center py-3 text-sm text-ivory-dim">
              You've finished the series. Check back for new episodes.
            </div>
          )}
        </div>
      )}

      {/* Episode rows */}
      {Object.entries(seasons).map(([season, eps]) => (
        <div key={season}>
          {Object.keys(seasons).length > 1 && (
            <h3 className="font-syne font-semibold text-ivory-mid text-sm uppercase tracking-wider mb-3">
              Season {season}
            </h3>
          )}

          <div className="flex flex-col gap-2">
            {eps.map((ep) => {
              const epIndex = episodes.findIndex(e => e.id === ep.id)
              const isActive = activeIndex === epIndex
              const thumbnail = ep.video_thumbnail || ep.cover_art_url

              return (
                <button
                  key={ep.id}
                  onClick={() => playEpisode(epIndex)}
                  className={cn(
                    'w-full flex items-start gap-4 p-3 rounded-xl border text-left transition-all group',
                    isActive
                      ? 'border-gold bg-gold/10'
                      : 'border-white/5 bg-black-card hover:border-white/15 hover:bg-black-hover'
                  )}
                >
                  <div className="w-8 flex-shrink-0 pt-1 text-center">
                    {isActive ? (
                      <div className="flex flex-col gap-0.5 items-center">
                        {[3, 4, 2].map((h, i) => (
                          <div key={i} className="w-1 bg-gold rounded-full animate-pulse" style={{ height: `${h * 4}px`, animationDelay: `${i * 150}ms` }} />
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm font-mono text-ivory-dim group-hover:text-ivory transition-colors">
                        {ep.episode_number ?? epIndex + 1}
                      </span>
                    )}
                  </div>

                  <div className="relative w-28 sm:w-36 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-black-mid">
                    {thumbnail ? (
                      <Image src={thumbnail} alt={ep.title} fill className="object-cover" sizes="144px" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-terra/10 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white/30">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                      </div>
                    )}
                    {ep.video_duration_seconds && (
                      <span className="absolute bottom-1 right-1 text-[10px] font-mono text-ivory bg-black/70 px-1 py-0.5 rounded">
                        {formatDuration(ep.video_duration_seconds)}
                      </span>
                    )}
                    {!isActive && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <div className="w-8 h-8 rounded-full bg-gold/90 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-black ml-0.5">
                            <polygon points="5,3 19,12 5,21" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className={cn(
                      'font-syne font-semibold text-sm leading-snug mb-1 line-clamp-2',
                      isActive ? 'text-gold' : 'text-ivory group-hover:text-gold transition-colors'
                    )}>
                      {ep.title}
                    </p>
                    {(ep.ai_summary || ep.description) && (
                      <p className="text-xs text-ivory-dim leading-relaxed line-clamp-2 mb-2">
                        {ep.ai_summary ?? ep.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-ivory-dim">
                      {ep.view_count > 0 && <span>{formatCount(ep.view_count)} views</span>}
                      <span>{timeAgo(ep.published_at)}</span>
                      {ep.is_featured && <Badge variant="gold" className="text-[10px] py-0">Featured</Badge>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
