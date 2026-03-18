'use client'

import { useState, useEffect, useRef } from 'react'
import { cn, readingTime } from '@/lib/utils'
import type { Work } from '@/types'

type ReadingTheme = 'dark' | 'sepia' | 'light'
type FontSize = 14 | 16 | 18 | 20 | 24

interface WritingReaderProps {
  work: Work
  onProgress?: (pct: number) => void
}

export function WritingReader({ work, onProgress }: WritingReaderProps) {
  const [theme, setTheme] = useState<ReadingTheme>('dark')
  const [fontSize, setFontSize] = useState<FontSize>(18)
  const [fontFamily, setFontFamily] = useState<'syne' | 'baskerville' | 'mono'>('baskerville')
  const [showSettings, setShowSettings] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const content = work.written_content ?? ''
  const paragraphs = content.split('\n\n').filter(Boolean)

  useEffect(() => {
    function handleScroll() {
      if (!contentRef.current) return
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current
      const pct = scrollTop / (scrollHeight - clientHeight)
      onProgress?.(Math.min(1, Math.max(0, pct)))
    }
    const el = contentRef.current
    el?.addEventListener('scroll', handleScroll, { passive: true })
    return () => el?.removeEventListener('scroll', handleScroll)
  }, [onProgress])

  const themeClasses: Record<ReadingTheme, string> = {
    dark: 'bg-[#0e0e0e] text-[#e8e0cc]',
    sepia: 'bg-[#f4efe4] text-[#3d2e1e]',
    light: 'bg-white text-[#1a1a1a]',
  }

  const fontClasses: Record<string, string> = {
    syne: 'font-syne',
    baskerville: 'font-baskerville',
    mono: 'font-mono',
  }

  return (
    <div className={cn('relative rounded-xl overflow-hidden', themeClasses[theme])}>
      {/* Toolbar */}
      <div className={cn(
        'flex items-center justify-between px-6 py-3 border-b sticky top-0 z-10',
        theme === 'dark' ? 'border-white/10 bg-[#0e0e0e]' : theme === 'sepia' ? 'border-[#c9b89a] bg-[#f4efe4]' : 'border-gray-200 bg-white'
      )}>
        <div className="flex items-center gap-2">
          {(['dark', 'sepia', 'light'] as ReadingTheme[]).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-syne transition-all',
                theme === t
                  ? 'bg-gold text-black'
                  : theme === 'dark' ? 'text-[#e8e0cc] hover:bg-white/10' : 'text-gray-600 hover:bg-black/10'
              )}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className={cn('text-xs', theme === 'dark' ? 'text-[#7a7060]' : 'text-gray-500')}>
            {readingTime(content)}
          </span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn('p-1.5 rounded', theme === 'dark' ? 'hover:bg-white/10 text-[#c8bfa8]' : 'hover:bg-black/10 text-gray-600')}
            aria-label="Reading settings"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className={cn(
          'flex flex-wrap gap-4 px-6 py-4 border-b',
          theme === 'dark' ? 'border-white/10' : theme === 'sepia' ? 'border-[#c9b89a]' : 'border-gray-200'
        )}>
          <div className="flex flex-col gap-2">
            <span className="text-xs opacity-60 font-syne uppercase tracking-wider">Font Size</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setFontSize(s => Math.max(14, s - 2) as FontSize)} className="w-7 h-7 rounded border border-current/20 flex items-center justify-center text-sm opacity-70 hover:opacity-100">−</button>
              <span className="text-sm font-mono w-8 text-center">{fontSize}</span>
              <button onClick={() => setFontSize(s => Math.min(24, s + 2) as FontSize)} className="w-7 h-7 rounded border border-current/20 flex items-center justify-center text-sm opacity-70 hover:opacity-100">+</button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs opacity-60 font-syne uppercase tracking-wider">Font</span>
            <div className="flex gap-2">
              {(['baskerville', 'syne', 'mono'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFontFamily(f)}
                  className={cn('px-3 py-1 rounded text-xs transition-all border', fontFamily === f ? 'border-gold bg-gold/20 text-gold' : 'border-current/20 opacity-60 hover:opacity-100')}
                >
                  {f === 'baskerville' ? 'Serif' : f === 'syne' ? 'Sans' : 'Mono'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        ref={contentRef}
        className="max-h-[70vh] overflow-y-auto"
        style={{ scrollbarWidth: 'thin' }}
      >
        <div
          className={cn('max-w-2xl mx-auto px-6 py-12', fontClasses[fontFamily])}
          style={{ fontSize: `${fontSize}px`, lineHeight: '1.9' }}
        >
          {paragraphs.map((para, i) => (
            <p key={i} className="mb-6">
              {para}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}
