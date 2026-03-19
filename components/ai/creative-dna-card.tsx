'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'

interface DNA {
  headline: string
  voice: string
  themes: string
  power: string
  direction: string
  tags: string[]
}

interface Props {
  dna: DNA | null
  creatorId: string
  isOwner: boolean
  worksCount: number
}

export function CreativeDnaCard({ dna, creatorId, isOwner, worksCount }: Props) {
  const [generating, setGenerating] = useState(false)
  const [localDna, setLocalDna] = useState<DNA | null>(dna)
  const [error, setError] = useState('')

  async function generate() {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/ai/creative-dna', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to generate')
      }
      const data = await res.json()
      setLocalDna(data.dna)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setGenerating(false)
    }
  }

  if (!localDna) {
    if (!isOwner) return null
    return (
      <div className="bg-black-card border border-white/5 rounded-xl p-5">
        <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-3">Creative DNA</p>
        {worksCount < 1 ? (
          <p className="text-sm text-ivory-dim">Upload your first work to unlock your Creative DNA analysis.</p>
        ) : (
          <>
            <p className="text-sm text-ivory-dim mb-4">
              Claude will analyse your portfolio and write your creative identity — your voice, themes, and signature superpower.
            </p>
            {error && <p className="text-xs text-terra-light mb-3">{error}</p>}
            <button
              onClick={generate}
              disabled={generating}
              className="w-full py-2.5 bg-gold/10 border border-gold/20 rounded-xl text-gold text-sm font-syne font-medium hover:bg-gold/20 transition-colors disabled:opacity-50"
            >
              {generating ? 'Analysing your portfolio...' : 'Generate my Creative DNA'}
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-gold/5 to-terra/5 border border-gold/20 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-mono text-gold uppercase tracking-wider mb-1">Creative DNA</p>
          <p className="font-syne font-semibold text-ivory text-base leading-tight">{localDna.headline}</p>
        </div>
        <span className="text-xl flex-shrink-0">🧬</span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-1">Voice</p>
          <p className="text-sm text-ivory-mid leading-relaxed">{localDna.voice}</p>
        </div>
        <div>
          <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-1">Themes</p>
          <p className="text-sm text-ivory-mid leading-relaxed">{localDna.themes}</p>
        </div>
        <div className="bg-black/30 rounded-lg px-4 py-3">
          <p className="text-xs font-mono text-gold uppercase tracking-wider mb-1">Superpower</p>
          <p className="text-sm text-ivory font-syne font-medium italic">"{localDna.power}"</p>
        </div>
        <div>
          <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-1">What's next</p>
          <p className="text-sm text-ivory-mid leading-relaxed">{localDna.direction}</p>
        </div>
      </div>

      {localDna.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {localDna.tags.map(tag => (
            <Badge key={tag} variant="dark">{tag}</Badge>
          ))}
        </div>
      )}

      {isOwner && (
        <button
          onClick={generate}
          disabled={generating}
          className="text-xs text-ivory-dim hover:text-gold transition-colors disabled:opacity-50"
        >
          {generating ? 'Regenerating...' : 'Regenerate'}
        </button>
      )}
    </div>
  )
}
