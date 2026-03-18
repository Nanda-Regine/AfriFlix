'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAudioPlayer } from '@/store/audio-player'
import { formatDuration, cn } from '@/lib/utils'

export function MiniPlayer() {
  const {
    currentWork, isPlaying, currentTime, duration, volume,
    isMuted, isShuffled, repeatMode, isExpanded,
    pause, resume, next, previous, setCurrentTime, setDuration,
    setVolume, toggleMute, toggleShuffle, cycleRepeat, setExpanded, close
  } = useAudioPlayer()

  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) audio.play().catch(() => {})
    else audio.pause()
  }, [isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentWork?.audio_url) return
    audio.src = currentWork.audio_url
    if (isPlaying) audio.play().catch(() => {})
  }, [currentWork?.id])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  if (!currentWork) return null

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0
  const cover = currentWork.cover_art_url

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={e => setCurrentTime(Math.floor(e.currentTarget.currentTime))}
        onDurationChange={e => setDuration(Math.floor(e.currentTarget.duration))}
        onEnded={next}
        preload="auto"
      />

      <div
        className={cn(
          'fixed z-50 bg-black-mid border-t border-white/10 transition-all duration-300',
          isExpanded
            ? 'inset-0 flex flex-col items-center justify-center'
            : 'bottom-0 left-0 right-0 h-20'
        )}
      >
        {/* Progress bar (mini) */}
        {!isExpanded && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10">
            <div
              className="h-full bg-gold transition-all duration-1000"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}

        {isExpanded ? (
          /* Full expanded player */
          <div className="w-full max-w-sm flex flex-col items-center gap-6 p-6">
            {/* Cover */}
            <div className={cn(
              'w-64 h-64 rounded-xl overflow-hidden bg-gradient-to-br from-gold/20 to-terra/20',
              'shadow-gold animate-pulse-slow'
            )}>
              {cover ? (
                <Image src={cover} alt={currentWork.title} width={256} height={256} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-syne font-bold text-8xl text-gold/30">
                  {currentWork.title[0]}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-center">
              <Link href={`/work/${currentWork.id}`} className="font-syne font-bold text-xl text-ivory hover:text-gold transition-colors">
                {currentWork.title}
              </Link>
              {currentWork.creator && (
                <p className="text-ivory-dim mt-1">{currentWork.creator.display_name}</p>
              )}
            </div>

            {/* Seekbar */}
            <div className="w-full">
              <input
                type="range" min={0} max={duration || 100} value={currentTime}
                onChange={e => {
                  const v = Number(e.target.value)
                  if (audioRef.current) audioRef.current.currentTime = v
                  setCurrentTime(v)
                }}
                className="w-full h-1 accent-gold cursor-pointer"
                aria-label="Seek"
              />
              <div className="flex justify-between text-xs font-mono text-ivory-dim mt-1">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6">
              <button onClick={toggleShuffle} className={cn('text-ivory-dim hover:text-ivory', isShuffled && 'text-gold')} aria-label="Shuffle">
                <ShuffleIcon />
              </button>
              <button onClick={previous} className="text-ivory-mid hover:text-ivory" aria-label="Previous">
                <PrevIcon />
              </button>
              <button
                onClick={isPlaying ? pause : resume}
                className="w-14 h-14 rounded-full bg-gold flex items-center justify-center text-black hover:bg-gold-light transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <PauseIconLg /> : <PlayIconLg />}
              </button>
              <button onClick={next} className="text-ivory-mid hover:text-ivory" aria-label="Next">
                <NextIcon />
              </button>
              <button onClick={cycleRepeat} className={cn('text-ivory-dim hover:text-ivory', repeatMode !== 'none' && 'text-gold')} aria-label="Repeat">
                <RepeatIcon />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 w-full">
              <button onClick={toggleMute} className="text-ivory-dim hover:text-ivory">
                {isMuted ? <MuteIconSm /> : <VolumeIconSm />}
              </button>
              <input
                type="range" min={0} max={1} step={0.05} value={isMuted ? 0 : volume}
                onChange={e => setVolume(Number(e.target.value))}
                className="flex-1 h-1 accent-gold cursor-pointer"
                aria-label="Volume"
              />
            </div>

            {/* Collapse */}
            <button onClick={() => setExpanded(false)} className="text-ivory-dim hover:text-ivory text-sm font-syne">
              Collapse
            </button>
          </div>
        ) : (
          /* Mini bar */
          <div className="flex items-center gap-3 h-full px-4 max-w-7xl mx-auto w-full">
            {/* Cover */}
            <button onClick={() => setExpanded(true)} className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-md overflow-hidden bg-gold/20 flex-shrink-0">
                {cover ? (
                  <Image src={cover} alt={currentWork.title} width={44} height={44} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gold font-syne font-bold">
                    {currentWork.title[0]}
                  </div>
                )}
              </div>
              <div className="min-w-0 text-left">
                <p className="font-syne text-sm text-ivory truncate">{currentWork.title}</p>
                {currentWork.creator && (
                  <p className="text-xs text-ivory-dim truncate">{currentWork.creator.display_name}</p>
                )}
              </div>
            </button>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button onClick={previous} className="text-ivory-mid hover:text-ivory hidden sm:block" aria-label="Previous">
                <PrevIcon size={16} />
              </button>
              <button
                onClick={isPlaying ? pause : resume}
                className="w-9 h-9 rounded-full bg-gold flex items-center justify-center text-black hover:bg-gold-light transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <PauseSm /> : <PlaySm />}
              </button>
              <button onClick={next} className="text-ivory-mid hover:text-ivory" aria-label="Next">
                <NextIcon size={16} />
              </button>
            </div>

            <button onClick={close} className="text-ivory-dim hover:text-ivory ml-2 hidden sm:block" aria-label="Close player">
              <CloseIcon />
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function PlayIconLg() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg> }
function PauseIconLg() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> }
function PlaySm() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg> }
function PauseSm() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> }
function PrevIcon({ size = 18 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="19,20 9,12 19,4"/><line x1="5" y1="19" x2="5" y2="5"/></svg> }
function NextIcon({ size = 18 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19"/></svg> }
function ShuffleIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg> }
function RepeatIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> }
function VolumeIconSm() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> }
function MuteIconSm() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg> }
function CloseIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }
