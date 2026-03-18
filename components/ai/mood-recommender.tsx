'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MOOD_CONFIG } from '@/types'
import type { Work } from '@/types'

interface MoodRecommenderProps {
  onRecommend?: (workIds: string[], note: string) => void
}

export function MoodRecommender({ onRecommend }: MoodRecommenderProps) {
  const [activeMood, setActiveMood] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ note: string; mood: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleMoodSelect(mood: string) {
    setActiveMood(mood)
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/ai/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, userId: 'anonymous' }),
      })
      if (!res.ok) throw new Error('Failed to get recommendations')
      const data = await res.json()
      setResult({ note: data.curation_note, mood })
      onRecommend?.(data.work_ids, data.curation_note)
    } catch {
      setError('Could not load recommendations. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const config = activeMood ? MOOD_CONFIG[activeMood] : null

  return (
    <section className="py-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs font-mono text-gold uppercase tracking-[0.3em] mb-3">AI Curator</p>
        <h2 className="font-syne font-bold text-3xl sm:text-4xl text-ivory mb-4">
          How are you feeling right now?
        </h2>
        <p className="text-ivory-dim mb-10">
          Tell us your mood and we'll find the perfect African stories for this moment.
        </p>

        {/* Mood pills */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {Object.entries(MOOD_CONFIG).map(([mood, cfg]) => (
            <button
              key={mood}
              onClick={() => handleMoodSelect(mood)}
              disabled={loading}
              style={activeMood === mood ? {
                background: cfg.bg,
                borderColor: cfg.border,
                color: cfg.text,
                boxShadow: `0 0 20px ${cfg.border}`,
              } : undefined}
              className="flex items-center gap-2 px-5 py-2.5 rounded-pill border border-white/10 text-ivory-mid font-syne font-medium text-sm transition-all duration-200 hover:border-white/30 hover:text-ivory disabled:opacity-50"
            >
              <span>{cfg.emoji}</span>
              <span>{cfg.label}</span>
            </button>
          ))}
        </div>

        {/* Result */}
        {loading && (
          <div className="bg-black-card border border-white/10 rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-3/4 mx-auto mb-3" />
            <div className="h-4 bg-white/10 rounded w-1/2 mx-auto" />
          </div>
        )}

        {result && !loading && config && (
          <div
            className="rounded-xl p-6 border transition-all duration-300"
            style={{ background: config.bg, borderColor: config.border }}
          >
            <p className="text-sm font-mono mb-2" style={{ color: config.text }}>
              {config.emoji} {result.mood.toUpperCase()} PICKS
            </p>
            <p className="text-ivory leading-relaxed text-base mb-4">
              {result.note}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="border"
              style={{ borderColor: config.border, color: config.text }}
            >
              Browse {result.mood} content
            </Button>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}
      </div>
    </section>
  )
}
