'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { cn, formatDuration } from '@/lib/utils'
import type { Work } from '@/types'

interface FilmPlayerProps {
  work: Work
  onProgress?: (seconds: number) => void
  initialTime?: number
}

export function FilmPlayer({ work, onProgress, initialTime = 0 }: FilmPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(initialTime)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [quality, setQuality] = useState<'auto' | '1080p' | '720p' | '480p' | '360p'>('auto')
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !work.video_url) return
    if (initialTime > 0) video.currentTime = initialTime
  }, [initialTime, work.video_url])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ': e.preventDefault(); togglePlay(); break
        case 'ArrowLeft': seek(-10); break
        case 'ArrowRight': seek(10); break
        case 'ArrowUp': e.preventDefault(); adjustVolume(0.1); break
        case 'ArrowDown': e.preventDefault(); adjustVolume(-0.1); break
        case 'f': case 'F': toggleFullscreen(); break
        case 'm': case 'M': toggleMute(); break
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [playing, volume, muted])

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) { video.play(); setPlaying(true) }
    else { video.pause(); setPlaying(false) }
  }

  function seek(delta: number) {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + delta))
  }

  function adjustVolume(delta: number) {
    const video = videoRef.current
    if (!video) return
    const newVol = Math.max(0, Math.min(1, volume + delta))
    video.volume = newVol
    setVolume(newVol)
  }

  function toggleMute() {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(!video.muted)
  }

  async function toggleFullscreen() {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen()
      setFullscreen(true)
    } else {
      await document.exitFullscreen()
      setFullscreen(false)
    }
  }

  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current)
    if (playing) {
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000)
    }
  }, [playing])

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!work.video_url) {
    return (
      <div className="w-full aspect-video bg-black-card rounded-xl flex items-center justify-center">
        <p className="text-ivory-dim">Video unavailable</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full aspect-video bg-black rounded-xl overflow-hidden group',
        fullscreen && 'rounded-none'
      )}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={work.video_url}
        className="w-full h-full object-contain"
        playsInline
        preload="metadata"
        poster={work.video_thumbnail ?? undefined}
        onTimeUpdate={e => {
          const t = Math.floor(e.currentTarget.currentTime)
          setCurrentTime(t)
          onProgress?.(t)
        }}
        onDurationChange={e => setDuration(Math.floor(e.currentTarget.duration))}
        onEnded={() => setPlaying(false)}
        onClick={togglePlay}
      />

      {/* Controls overlay */}
      <div
        className={cn(
          'absolute inset-0 flex flex-col justify-end transition-opacity duration-300',
          showControls || !playing ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

        {/* Title */}
        <div className="relative px-4 pt-4 pb-2">
          <p className="text-xs text-ivory-dim font-mono mb-1">{work.category.toUpperCase()}</p>
          <p className="font-syne font-semibold text-ivory">{work.title}</p>
        </div>

        {/* Progress bar */}
        <div className="relative px-4">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={e => {
              const v = Number(e.target.value)
              if (videoRef.current) videoRef.current.currentTime = v
              setCurrentTime(v)
            }}
            className="w-full h-1 accent-gold cursor-pointer"
            aria-label="Seek"
          />
        </div>

        {/* Control buttons */}
        <div className="relative flex items-center gap-3 px-4 py-3">
          <button onClick={() => seek(-10)} className="text-ivory-mid hover:text-ivory transition-colors" aria-label="Skip back 10 seconds">
            <SkipBackIcon />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-black hover:bg-gold-light transition-colors"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>

          <button onClick={() => seek(10)} className="text-ivory-mid hover:text-ivory transition-colors" aria-label="Skip forward 10 seconds">
            <SkipForwardIcon />
          </button>

          <span className="text-xs font-mono text-ivory-mid ml-2">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>

          <div className="flex items-center gap-2 ml-auto">
            {/* Volume */}
            <button onClick={toggleMute} className="text-ivory-mid hover:text-ivory" aria-label={muted ? 'Unmute' : 'Mute'}>
              {muted || volume === 0 ? <MuteIcon /> : <VolumeIcon />}
            </button>
            <input
              type="range" min={0} max={1} step={0.05}
              value={muted ? 0 : volume}
              onChange={e => { const v = Number(e.target.value); setVolume(v); if (videoRef.current) videoRef.current.volume = v }}
              className="w-20 h-1 accent-gold cursor-pointer hidden sm:block"
              aria-label="Volume"
            />

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-ivory-mid hover:text-ivory" aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              <FullscreenIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Big play button when paused */}
      {!playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="Play"
        >
          <div className="w-16 h-16 rounded-full bg-gold/90 flex items-center justify-center text-black hover:bg-gold transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
        </button>
      )}
    </div>
  )
}

function PlayIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg> }
function PauseIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> }
function SkipBackIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="19,20 9,12 19,4"/><line x1="5" y1="19" x2="5" y2="5"/></svg> }
function SkipForwardIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19"/></svg> }
function VolumeIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> }
function MuteIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg> }
function FullscreenIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg> }
