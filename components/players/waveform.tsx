'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface WaveformProps {
  audioUrl: string
  className?: string
  barColor?: string
  progressColor?: string
  height?: number
}

export function Waveform({
  audioUrl,
  className,
  barColor = 'rgba(201,168,76,0.3)',
  progressColor = '#C9A84C',
  height = 64,
}: WaveformProps) {
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const audioRef       = useRef<HTMLAudioElement | null>(null)
  const ctxRef         = useRef<AudioContext | null>(null)
  const animFrameRef   = useRef<number>(0)
  const peaksRef       = useRef<number[]>([])

  const [playing, setPlaying]     = useState(false)
  const [progress, setProgress]   = useState(0)    // 0–1
  const [duration, setDuration]   = useState(0)
  const [loading, setLoading]     = useState(true)

  // Decode audio and compute waveform peaks
  useEffect(() => {
    let cancelled = false

    async function decode() {
      try {
        const res  = await fetch(audioUrl)
        const buf  = await res.arrayBuffer()
        const actx = new AudioContext()
        const decoded = await actx.decodeAudioData(buf)
        await actx.close()

        if (cancelled) return

        const channelData = decoded.getChannelData(0)
        const canvas = canvasRef.current
        if (!canvas) return

        const bars = Math.floor(canvas.width / 3) // 3px bar + gap
        const blockSize = Math.floor(channelData.length / bars)
        const peaks: number[] = []

        for (let i = 0; i < bars; i++) {
          let max = 0
          for (let j = 0; j < blockSize; j++) {
            const sample = Math.abs(channelData[i * blockSize + j])
            if (sample > max) max = sample
          }
          peaks.push(max)
        }

        peaksRef.current = peaks
        setLoading(false)
        drawWaveform(peaks, 0)
      } catch {
        setLoading(false)
      }
    }

    decode()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl])

  const drawWaveform = useCallback((peaks: number[], prog: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const bars = peaks.length
    const barW = W / bars

    ctx.clearRect(0, 0, W, H)

    for (let i = 0; i < bars; i++) {
      const barH  = Math.max(2, peaks[i] * H * 0.9)
      const x     = i * barW
      const y     = (H - barH) / 2
      const isDone = i / bars <= prog

      ctx.fillStyle = isDone ? progressColor : barColor
      ctx.beginPath()
      ctx.roundRect(x, y, barW * 0.65, barH, 1)
      ctx.fill()
    }
  }, [barColor, progressColor])

  // Animate progress bar
  function tick() {
    const audio = audioRef.current
    if (!audio) return
    const prog = audio.duration ? audio.currentTime / audio.duration : 0
    setProgress(prog)
    drawWaveform(peaksRef.current, prog)
    if (!audio.paused) {
      animFrameRef.current = requestAnimationFrame(tick)
    }
  }

  async function togglePlay() {
    if (!audioRef.current) {
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
      audio.addEventListener('ended', () => {
        setPlaying(false)
        setProgress(0)
        drawWaveform(peaksRef.current, 0)
      })
    }

    const audio = audioRef.current
    if (audio.paused) {
      await audio.play()
      setPlaying(true)
      animFrameRef.current = requestAnimationFrame(tick)
    } else {
      audio.pause()
      setPlaying(false)
      cancelAnimationFrame(animFrameRef.current)
    }
  }

  function seek(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    const audio  = audioRef.current
    if (!canvas || !audio) return
    const rect = canvas.getBoundingClientRect()
    const x    = e.clientX - rect.left
    const pct  = x / rect.width
    audio.currentTime = pct * audio.duration
    drawWaveform(peaksRef.current, pct)
    setProgress(pct)
  }

  // Cleanup
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      audioRef.current?.pause()
      ctxRef.current?.close().catch(() => {})
    }
  }, [])

  function formatTime(secs: number) {
    if (!secs || isNaN(secs)) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Play / Pause */}
      <button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-gold flex items-center justify-center flex-shrink-0 hover:bg-gold-light transition-colors shadow-gold"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? (
          <PauseIcon />
        ) : (
          <PlayIcon />
        )}
      </button>

      {/* Canvas waveform */}
      <div className="flex-1 flex flex-col gap-1">
        <canvas
          ref={canvasRef}
          width={600}
          height={height}
          onClick={seek}
          className={cn('w-full cursor-pointer', loading && 'opacity-30')}
          style={{ height: `${height}px` }}
        />
        <div className="flex justify-between text-[10px] font-mono text-ivory-dim">
          <span>{formatTime((audioRef.current?.currentTime ?? 0))}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="black">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="black">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  )
}
