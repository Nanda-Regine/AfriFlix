'use client'

import Image from 'next/image'
import { useAudioPlayer } from '@/store/audio-player'
import type { Work } from '@/types'

interface Props {
  work: Work
}

export function MusicPlayer({ work }: Props) {
  const { currentWork, isPlaying, play, pause, resume } = useAudioPlayer()
  const isThisTrack = currentWork?.id === work.id

  function handlePlay() {
    if (isThisTrack) {
      isPlaying ? pause() : resume()
    } else {
      play(work, [work])
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto mb-6">
      {/* Album art with play overlay */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gold/20 to-terra/20 shadow-gold mb-5 group cursor-pointer" onClick={handlePlay}>
        {work.cover_art_url ? (
          <Image
            src={work.cover_art_url}
            alt={work.title}
            fill
            className={`object-cover transition-transform duration-500 ${isThisTrack && isPlaying ? 'scale-105' : ''}`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-syne font-bold text-7xl text-gold/20">{work.title[0]}</span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gold/90 flex items-center justify-center shadow-gold">
            {isThisTrack && isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-black">
                <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-black ml-1">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </div>
        </div>

        {/* Now playing indicator */}
        {isThisTrack && isPlaying && (
          <div className="absolute bottom-3 left-3 flex items-end gap-0.5">
            {[3, 5, 4, 6, 3].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-gold rounded-full animate-pulse"
                style={{ height: `${h * 3}px`, animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Play button */}
      <button
        onClick={handlePlay}
        className="w-full flex items-center justify-center gap-3 py-3.5 bg-gold text-black rounded-xl font-syne font-semibold hover:bg-gold-light transition-colors"
      >
        {isThisTrack && isPlaying ? (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
            </svg>
            Pause
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
            {isThisTrack ? 'Resume' : 'Play'}
          </>
        )}
      </button>

      {!work.audio_url && (
        <p className="text-center text-xs text-ivory-dim mt-2">Preview not available yet</p>
      )}
    </div>
  )
}
