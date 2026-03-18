'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { MOOD_CONFIG } from '@/types'
import type { Work } from '@/types'

interface PoetryPlayerProps {
  work: Work
}

type FontFamily = 'baskerville' | 'syne' | 'mono'
type ReadingMode = 'dark' | 'sepia' | 'light'

const MODE_STYLES: Record<ReadingMode, string> = {
  dark:  'bg-black-mid text-ivory',
  sepia: 'bg-[#1a1308] text-[#d4c5a0]',
  light: 'bg-[#f2ece0] text-[#1a1308]',
}

const FONT_STYLES: Record<FontFamily, string> = {
  baskerville: 'font-baskerville',
  syne:        'font-syne',
  mono:        'font-mono',
}

export function PoetryPlayer({ work }: PoetryPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const [fontSize, setFontSize] = useState(18)
  const [fontFamily, setFontFamily] = useState<FontFamily>('baskerville')
  const [readingMode, setReadingMode] = useState<ReadingMode>('dark')
  const [layout, setLayout] = useState<'side' | 'stacked'>('side')

  const hasVideo = !!work.video_url
  const hasText = !!work.written_content

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) }
    else { v.pause(); setPlaying(false) }
  }

  function handleTimeUpdate() {
    const v = videoRef.current
    if (!v || !v.duration) return
    setVideoProgress((v.currentTime / v.duration) * 100)
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const v = videoRef.current
    if (!v || !v.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration
  }

  return (
    <div
      className={cn(
        'min-h-screen rounded-2xl overflow-hidden transition-colors duration-300',
        MODE_STYLES[readingMode]
      )}
    >
      {/* Controls bar */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 border-b border-white/5 flex-wrap',
        readingMode === 'light' ? 'border-black/10' : 'border-white/5'
      )}>
        {/* Layout toggle (only when both video and text) */}
        {hasVideo && hasText && (
          <button
            onClick={() => setLayout(l => l === 'side' ? 'stacked' : 'side')}
            className={cn(
              'text-xs px-2.5 py-1 rounded border transition-colors',
              readingMode === 'light' ? 'border-black/20 text-stone-700 hover:border-black/40' : 'border-white/10 text-ivory-mid hover:border-white/20'
            )}
          >
            {layout === 'side' ? 'Stack' : 'Side by side'}
          </button>
        )}

        {/* Reading mode */}
        <div className="flex gap-1 ml-auto">
          {(['dark', 'sepia', 'light'] as ReadingMode[]).map(m => (
            <button
              key={m}
              onClick={() => setReadingMode(m)}
              className={cn(
                'w-5 h-5 rounded-full border-2 transition-all',
                readingMode === m ? 'scale-125' : 'opacity-60 hover:opacity-80',
                m === 'dark'  && 'bg-[#0A0A0A] border-white/30',
                m === 'sepia' && 'bg-[#d4c5a0] border-[#8a7350]',
                m === 'light' && 'bg-[#f2ece0] border-[#8a7350]',
              )}
              aria-label={`${m} reading mode`}
            />
          ))}
        </div>

        {/* Font family */}
        <div className="flex gap-1">
          {([
            { value: 'baskerville', label: 'B' },
            { value: 'syne',        label: 'S' },
            { value: 'mono',        label: 'M' },
          ] as { value: FontFamily; label: string }[]).map(f => (
            <button
              key={f.value}
              onClick={() => setFontFamily(f.value)}
              className={cn(
                'w-7 h-7 rounded text-sm transition-colors',
                FONT_STYLES[f.value],
                fontFamily === f.value
                  ? readingMode === 'light' ? 'bg-stone-800 text-white' : 'bg-white text-black'
                  : readingMode === 'light' ? 'text-stone-600 hover:bg-stone-200' : 'text-ivory-dim hover:bg-white/10'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Font size */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFontSize(s => Math.max(14, s - 2))}
            className={cn('w-6 h-6 rounded text-sm transition-colors', readingMode === 'light' ? 'hover:bg-stone-200 text-stone-600' : 'hover:bg-white/10 text-ivory-dim')}
            aria-label="Decrease font size"
          >A-</button>
          <span className={cn('text-xs font-mono', readingMode === 'light' ? 'text-stone-500' : 'text-ivory-dim')}>{fontSize}</span>
          <button
            onClick={() => setFontSize(s => Math.min(28, s + 2))}
            className={cn('w-6 h-6 rounded text-sm transition-colors', readingMode === 'light' ? 'hover:bg-stone-200 text-stone-600' : 'hover:bg-white/10 text-ivory-dim')}
            aria-label="Increase font size"
          >A+</button>
        </div>
      </div>

      {/* Main content area */}
      <div
        className={cn(
          'flex gap-0',
          hasVideo && hasText && layout === 'side' ? 'md:flex-row flex-col' : 'flex-col'
        )}
      >
        {/* Video panel */}
        {hasVideo && (
          <div
            className={cn(
              'relative bg-black',
              hasText && layout === 'side' ? 'md:w-1/2 w-full' : 'w-full',
              !hasText && 'flex-1'
            )}
          >
            <div className="relative aspect-video">
              <video
                ref={videoRef}
                src={work.video_url!}
                className="w-full h-full object-cover"
                muted={muted}
                playsInline
                preload="metadata"
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                aria-label={work.title}
              />

              {/* Video overlay controls */}
              <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black/70 to-transparent">
                {/* Progress */}
                <div
                  className="w-full h-1 bg-white/20 rounded-full cursor-pointer mb-3"
                  onClick={handleSeek}
                  role="slider"
                  aria-label="Video progress"
                  aria-valuenow={videoProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="h-full bg-gold rounded-full" style={{ width: `${videoProgress}%` }} />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-black hover:bg-gold-light transition-colors"
                    aria-label={playing ? 'Pause' : 'Play'}
                  >
                    {playing ? <PauseIcon /> : <PlayIcon />}
                  </button>
                  <button
                    onClick={() => { const v = videoRef.current; if (v) { v.muted = !v.muted; setMuted(!muted) } }}
                    className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-ivory hover:bg-black/80 transition-colors"
                    aria-label={muted ? 'Unmute' : 'Mute'}
                  >
                    {muted ? <MuteIcon /> : <SoundIcon />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Text panel */}
        {hasText && (
          <div
            className={cn(
              'overflow-y-auto',
              hasVideo && layout === 'side' ? 'md:w-1/2 w-full md:max-h-[70vh]' : 'w-full',
              'px-6 sm:px-10 py-8'
            )}
          >
            {/* Mood tags */}
            {work.mood_tags && work.mood_tags.length > 0 && (
              <div className="flex gap-2 mb-6 flex-wrap">
                {work.mood_tags.map(mood => {
                  const config = MOOD_CONFIG[mood]
                  return config ? (
                    <span
                      key={mood}
                      className="text-xs px-2.5 py-1 rounded-full border"
                      style={{ color: config.text, borderColor: config.border, background: config.bg }}
                    >
                      {config.emoji} {config.label}
                    </span>
                  ) : (
                    <Badge key={mood} variant="dark">{mood}</Badge>
                  )
                })}
              </div>
            )}

            {/* Poem content */}
            <div
              className={cn(
                'leading-relaxed whitespace-pre-wrap',
                FONT_STYLES[fontFamily]
              )}
              style={{ fontSize: `${fontSize}px`, lineHeight: '1.9' }}
            >
              {work.written_content}
            </div>
          </div>
        )}
      </div>

      {/* Cultural context */}
      {work.cultural_origin && (
        <div className={cn(
          'px-6 py-4 border-t',
          readingMode === 'light' ? 'border-black/10 text-stone-500' : 'border-white/5 text-ivory-dim'
        )}>
          <p className="text-xs">
            <span className="font-mono uppercase tracking-wider mr-2">Origin</span>
            {work.cultural_origin}
            {work.country_of_origin && ` · ${work.country_of_origin}`}
          </p>
        </div>
      )}
    </div>
  )
}

function PlayIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
}

function PauseIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
}

function MuteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  )
}

function SoundIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
}
