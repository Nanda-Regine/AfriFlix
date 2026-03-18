'use client'

import { useState } from 'react'
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
  const [activeEpisode, setActiveEpisode] = useState<Work | null>(null)

  // Group by season number derived from episode_number (episodes 1-99 = S1, 100-199 = S2, etc.)
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
        <div className="mb-2">
          <FilmPlayer work={activeEpisode} />
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-ivory-dim mb-0.5">
                {activeEpisode.episode_number ? `Episode ${activeEpisode.episode_number}` : 'Episode'}
              </p>
              <p className="font-syne font-semibold text-ivory">{activeEpisode.title}</p>
            </div>
            <button
              onClick={() => setActiveEpisode(null)}
              className="text-xs text-ivory-dim hover:text-ivory transition-colors"
            >
              Close player
            </button>
          </div>
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
            {eps.map((ep, i) => {
              const isActive = activeEpisode?.id === ep.id
              const thumbnail = ep.video_thumbnail || ep.cover_art_url

              return (
                <button
                  key={ep.id}
                  onClick={() => setActiveEpisode(isActive ? null : ep)}
                  className={cn(
                    'w-full flex items-start gap-4 p-3 rounded-xl border text-left transition-all group',
                    isActive
                      ? 'border-gold bg-gold/10'
                      : 'border-white/5 bg-black-card hover:border-white/15 hover:bg-black-hover'
                  )}
                >
                  {/* Episode number */}
                  <div className="w-8 flex-shrink-0 pt-1 text-center">
                    {isActive ? (
                      <div className="flex flex-col gap-0.5 items-center">
                        <div className="w-1 h-3 bg-gold rounded-full animate-pulse" />
                        <div className="w-1 h-4 bg-gold rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                        <div className="w-1 h-2 bg-gold rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      <span className="text-sm font-mono text-ivory-dim group-hover:text-ivory transition-colors">
                        {ep.episode_number ?? i + 1}
                      </span>
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div className="relative w-28 sm:w-36 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-black-mid">
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt={ep.title}
                        fill
                        className="object-cover"
                        sizes="144px"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-terra/10 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white/30">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                      </div>
                    )}

                    {/* Duration overlay */}
                    {ep.video_duration_seconds && (
                      <span className="absolute bottom-1 right-1 text-[10px] font-mono text-ivory bg-black/70 px-1 py-0.5 rounded">
                        {formatDuration(ep.video_duration_seconds)}
                      </span>
                    )}

                    {/* Play icon on hover */}
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

                  {/* Info */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className={cn(
                      'font-syne font-semibold text-sm leading-snug mb-1 line-clamp-2',
                      isActive ? 'text-gold' : 'text-ivory group-hover:text-gold transition-colors'
                    )}>
                      {ep.title}
                    </p>

                    {ep.ai_summary || ep.description ? (
                      <p className="text-xs text-ivory-dim leading-relaxed line-clamp-2 mb-2">
                        {ep.ai_summary ?? ep.description}
                      </p>
                    ) : null}

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
