'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { Work } from '@/types'

interface DancePlayerProps {
  work: Work
  autoPlay?: boolean
}

const SPEEDS = [0.5, 0.75, 1, 1.25] as const
type Speed = typeof SPEEDS[number]

export function DancePlayer({ work, autoPlay = false }: DancePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [speed, setSpeed] = useState<Speed>(1)
  const [looping, setLooping] = useState(true)
  const [progress, setProgress] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const controlsTimer = useRef<ReturnType<typeof setTimeout>>()

  // IntersectionObserver: auto-play when 60%+ visible, pause when not
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.6) {
          video.play().catch(() => {})
          setPlaying(true)
        } else {
          video.pause()
          setPlaying(false)
        }
      },
      { threshold: [0, 0.6] }
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = speed
  }, [speed])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.loop = looping
  }, [looping])

  function handleTimeUpdate() {
    const v = videoRef.current
    if (!v || !v.duration) return
    setProgress((v.currentTime / v.duration) * 100)
  }

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play()
      setPlaying(true)
    } else {
      v.pause()
      setPlaying(false)
    }
  }

  function toggleMute() {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const v = videoRef.current
    if (!v || !v.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    v.currentTime = pct * v.duration
  }

  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    if (controlsTimer.current) clearTimeout(controlsTimer.current)
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000)
  }, [])

  useEffect(() => {
    resetControlsTimer()
    return () => { if (controlsTimer.current) clearTimeout(controlsTimer.current) }
  }, [resetControlsTimer])

  if (!work.video_url) {
    return (
      <div className="aspect-[9/16] max-w-sm mx-auto bg-black-card rounded-2xl flex items-center justify-center">
        <p className="text-ivory-dim text-sm">Video unavailable</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-[9/16] max-w-sm mx-auto bg-black rounded-2xl overflow-hidden select-none"
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={work.video_url}
        className="absolute inset-0 w-full h-full object-cover"
        muted={muted}
        loop={looping}
        playsInline
        preload="none"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        aria-label={`Dance video: ${work.title}`}
      />

      {/* Gradient overlay for controls readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Play/pause tap area */}
      <button
        className="absolute inset-0 w-full h-full focus-visible:outline-none"
        onClick={togglePlay}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {/* Big play icon on pause */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
          </div>
        )}
      </button>

      {/* Top controls */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 p-4 flex items-center justify-between transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div>
          <p className="font-syne font-semibold text-ivory text-sm line-clamp-1">{work.title}</p>
          {work.creator && (
            <p className="text-xs text-ivory-mid">{work.creator.display_name}</p>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-3 transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Speed selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-ivory-dim">Speed</span>
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={cn(
                'text-xs font-mono px-2 py-0.5 rounded transition-colors',
                speed === s
                  ? 'bg-gold text-black font-semibold'
                  : 'text-ivory-mid hover:text-ivory'
              )}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div
          className="w-full h-1 bg-white/20 rounded-full cursor-pointer"
          onClick={handleSeek}
          role="slider"
          aria-label="Video progress"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-gold rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Icon controls row */}
        <div className="flex items-center gap-3">
          {/* Mute */}
          <button
            onClick={toggleMute}
            className="w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-ivory hover:bg-black/80 transition-colors"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <MuteIcon /> : <SoundIcon />}
          </button>

          {/* Loop */}
          <button
            onClick={() => setLooping(l => !l)}
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
              looping ? 'bg-gold text-black' : 'bg-black/60 text-ivory hover:bg-black/80'
            )}
            aria-label={looping ? 'Disable loop' : 'Enable loop'}
            aria-pressed={looping}
          >
            <LoopIcon />
          </button>

          <div className="ml-auto">
            <span className="text-xs font-mono text-ivory-dim">
              {work.category}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function MuteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  )
}

function SoundIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
}

function LoopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  )
}
