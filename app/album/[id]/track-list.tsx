'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAudioPlayer } from '@/store/audio-player'
import { Badge } from '@/components/ui/badge'
import { formatDuration, formatCount, cn } from '@/lib/utils'
import type { Work, Album } from '@/types'

interface AlbumTrackListProps {
  tracks: Work[]
  album: Album
}

export function AlbumTrackList({ tracks, album }: AlbumTrackListProps) {
  const { currentWork, isPlaying, play, pause, resume } = useAudioPlayer()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  function handleTrackClick(track: Work) {
    if (currentWork?.id === track.id) {
      isPlaying ? pause() : resume()
    } else {
      play(track, tracks)
    }
  }

  const isCurrentTrack = (track: Work) => currentWork?.id === track.id

  const totalHearts = tracks.reduce((s, t) => s + t.heart_count, 0)

  return (
    <div>
      {/* Play all / shuffle row */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => play(tracks[0], tracks)}
          className="flex items-center gap-2 px-6 py-3 bg-gold rounded-pill text-black font-syne font-semibold text-sm hover:bg-gold-light transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
          Play All
        </button>
        <button
          onClick={() => {
            const shuffled = [...tracks].sort(() => Math.random() - 0.5)
            play(shuffled[0], shuffled)
          }}
          className="flex items-center gap-2 px-6 py-3 border border-white/10 rounded-pill text-ivory-mid font-syne font-medium text-sm hover:border-gold/30 hover:text-ivory transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
            <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
            <line x1="4" y1="4" x2="9" y2="9"/>
          </svg>
          Shuffle
        </button>

        {totalHearts > 0 && (
          <span className="ml-auto text-sm font-mono text-ivory-dim">
            {formatCount(totalHearts)} hearts
          </span>
        )}
      </div>

      {/* Header row */}
      <div className="grid grid-cols-[24px_1fr_auto_auto] gap-4 px-3 py-2 border-b border-white/10 text-xs font-mono text-ivory-dim uppercase tracking-wider mb-1">
        <span>#</span>
        <span>Title</span>
        <span className="hidden sm:block">Plays</span>
        <span>Time</span>
      </div>

      {/* Tracks */}
      <div className="flex flex-col">
        {tracks.map((track, i) => {
          const active = isCurrentTrack(track)
          const hovered = hoveredId === track.id

          return (
            <div
              key={track.id}
              onMouseEnter={() => setHoveredId(track.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={cn(
                'grid grid-cols-[24px_1fr_auto_auto] gap-4 items-center px-3 py-3 rounded-lg transition-colors group',
                active ? 'bg-gold/10' : 'hover:bg-black-hover'
              )}
            >
              {/* Track number / play icon */}
              <button
                onClick={() => handleTrackClick(track)}
                className="flex items-center justify-center w-6 h-6 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded"
                aria-label={active && isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
              >
                {active && isPlaying ? (
                  /* Animated playing bars */
                  <div className="flex gap-0.5 items-end h-4">
                    <div className="w-0.5 bg-gold rounded-full animate-pulse h-3" />
                    <div className="w-0.5 bg-gold rounded-full animate-pulse h-4" style={{ animationDelay: '150ms' }} />
                    <div className="w-0.5 bg-gold rounded-full animate-pulse h-2" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : hovered || (active && !isPlaying) ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill={active ? '#C9A84C' : 'currentColor'} className={active ? '' : 'text-ivory'}>
                    {active && !isPlaying
                      ? <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>
                      : <polygon points="5,3 19,12 5,21" />}
                  </svg>
                ) : (
                  <span className={cn('font-mono text-sm', active ? 'text-gold' : 'text-ivory-dim')}>
                    {track.track_number ?? i + 1}
                  </span>
                )}
              </button>

              {/* Title + creator */}
              <div className="min-w-0">
                <p className={cn(
                  'font-syne font-medium text-sm truncate',
                  active ? 'text-gold' : 'text-ivory'
                )}>
                  {track.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {track.creator && (
                    <Link
                      href={`/creator/${track.creator.username}`}
                      onClick={e => e.stopPropagation()}
                      className="text-xs text-ivory-dim hover:text-ivory transition-colors truncate"
                    >
                      {track.creator.display_name}
                    </Link>
                  )}
                  {track.is_explicit && (
                    <span className="text-[9px] font-mono px-1 py-0.5 bg-ivory-dim/20 text-ivory-dim rounded uppercase flex-shrink-0">
                      E
                    </span>
                  )}
                  {track.genres.slice(0, 1).map(g => (
                    <Badge key={g} variant="dark" className="text-[10px] py-0 hidden sm:inline-flex flex-shrink-0">
                      {g}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Play count */}
              <span className="text-xs font-mono text-ivory-dim hidden sm:block">
                {track.view_count > 0 ? formatCount(track.view_count) : '—'}
              </span>

              {/* Duration + heart */}
              <div className="flex items-center gap-3">
                <button
                  onClick={e => {
                    e.stopPropagation()
                    // TODO: toggle heart via Supabase
                  }}
                  className={cn(
                    'hidden group-hover:block transition-colors focus-visible:block',
                    'text-ivory-dim hover:text-terra-light'
                  )}
                  aria-label="Heart this track"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
                <span className="text-xs font-mono text-ivory-dim w-10 text-right">
                  {track.audio_duration_seconds ? formatDuration(track.audio_duration_seconds) : '—'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <p className="text-xs font-mono text-ivory-dim">
          {tracks.length} tracks
          {tracks[0]?.published_at && (
            <> · Released {new Date(album.release_date ?? tracks[0].published_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</>
          )}
        </p>
      </div>
    </div>
  )
}
