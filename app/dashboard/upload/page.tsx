'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'
import type { ContentCategory, AIEnrichment } from '@/types'

const STEPS = ['Category', 'Upload', 'Metadata', 'AI Enrichment', 'Publish']

const CATEGORIES: { value: ContentCategory; label: string; emoji: string; accept: string; maxMB: number }[] = [
  { value: 'film', label: 'Film & Series', emoji: '🎬', accept: 'video/*', maxMB: 4096 },
  { value: 'music', label: 'Music', emoji: '🎵', accept: 'audio/*', maxMB: 200 },
  { value: 'dance', label: 'Dance', emoji: '💃', accept: 'video/*', maxMB: 1024 },
  { value: 'writing', label: 'Writing', emoji: '✍️', accept: '.txt,.md,.docx', maxMB: 10 },
  { value: 'poetry', label: 'Poetry', emoji: '🎤', accept: 'video/*,audio/*', maxMB: 500 },
  { value: 'comedy', label: 'Comedy', emoji: '😂', accept: 'video/*', maxMB: 2048 },
  { value: 'theatre', label: 'Theatre', emoji: '🎭', accept: 'video/*', maxMB: 4096 },
  { value: 'visual_art', label: 'Visual Art', emoji: '🎨', accept: 'video/*,image/*', maxMB: 2048 },
]

const GENRE_OPTIONS: Partial<Record<ContentCategory, string[]>> = {
  music: ['Amapiano', 'Afrobeats', 'Gqom', 'Highlife', 'Kwaito', 'Afro-soul', 'Traditional', 'Neo-soul', 'Jazz', 'Gospel'],
  film: ['Short film', 'Documentary', 'Web series', 'Thriller', 'Drama', 'Comedy', 'Horror', 'Romance', 'Sci-fi'],
  poetry: ['Spoken word', 'Slam', 'Audio poetry', 'Written', 'Poetry film'],
  dance: ['Contemporary', 'Traditional', 'Choreography', 'Tutorial', 'Social'],
  comedy: ['Stand-up', 'Sketch', 'Satire', 'Roast', 'Parody'],
}

export default function UploadPage() {
  const [step, setStep] = useState(0)
  const [category, setCategory] = useState<ContentCategory | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [genres, setGenres] = useState<string[]>([])
  const [languages, setLanguages] = useState('')
  const [country, setCountry] = useState('')
  const [ageRating, setAgeRating] = useState('G')
  const [enrichment, setEnrichment] = useState<AIEnrichment | null>(null)
  const [enrichmentLoading, setEnrichmentLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishedId, setPublishedId] = useState<string | null>(null)
  const { creator } = useAuthStore()
  const router = useRouter()

  async function runEnrichment() {
    if (!category || !title) return
    setEnrichmentLoading(true)
    try {
      const res = await fetch('/api/ai/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work: { title, category, description, country_of_origin: country, languages: languages.split(',').map(l => l.trim()) }
        }),
      })
      const data = await res.json()
      setEnrichment(data)
    } catch {
      // AI enrichment is optional — skip on error
    } finally {
      setEnrichmentLoading(false)
    }
  }

  async function publish() {
    if (!creator || !category) return
    setPublishing(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('works').insert({
      creator_id: creator.id,
      title,
      category,
      description,
      genres,
      languages: languages.split(',').map(l => l.trim()).filter(Boolean),
      country_of_origin: country || null,
      age_rating: ageRating,
      ai_summary: enrichment?.ai_summary ?? null,
      mood_tags: enrichment?.mood_tags ?? [],
      theme_tags: enrichment?.theme_tags ?? [],
      status: 'published',
    }).select().single()

    if (!error && data) {
      setPublishedId(data.id)
    }
    setPublishing(false)
  }

  if (publishedId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto">
        <p className="text-5xl mb-4">🎉</p>
        <h2 className="font-syne font-bold text-2xl text-ivory mb-3">Published!</h2>
        <p className="text-ivory-dim mb-6">Your work is now live on AfriFlix.</p>
        <div className="flex gap-3">
          <Button variant="gold" onClick={() => router.push(`/work/${publishedId}`)}>View Work</Button>
          <Button variant="outline" onClick={() => { setStep(0); setPublishedId(null); setTitle(''); setDescription(''); setEnrichment(null) }}>Upload Another</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-syne font-bold text-2xl text-ivory mb-2">Upload a New Work</h1>
      <p className="text-ivory-dim mb-8">Share your creativity with the African world.</p>

      {/* Step indicator */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 flex flex-col gap-1">
            <div className={cn('h-1 rounded-full transition-all duration-300', i <= step ? 'bg-gold' : 'bg-white/10')} />
            <span className={cn('text-[10px] font-mono truncate', i === step ? 'text-gold' : 'text-ivory-dim')}>{s}</span>
          </div>
        ))}
      </div>

      {/* Step 0: Category */}
      {step === 0 && (
        <div>
          <h2 className="font-syne font-semibold text-ivory mb-6">What are you sharing?</h2>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={cn(
                  'p-5 rounded-xl border text-left transition-all',
                  category === cat.value
                    ? 'border-gold bg-gold/10'
                    : 'border-white/10 hover:border-white/20 bg-black-card'
                )}
              >
                <span className="text-2xl mb-2 block">{cat.emoji}</span>
                <p className="font-syne text-sm text-ivory">{cat.label}</p>
                <p className="text-xs text-ivory-dim mt-0.5">Max {cat.maxMB >= 1024 ? `${cat.maxMB / 1024}GB` : `${cat.maxMB}MB`}</p>
              </button>
            ))}
          </div>
          <div className="mt-6">
            <Button variant="gold" disabled={!category} onClick={() => setStep(1)}>Continue</Button>
          </div>
        </div>
      )}

      {/* Step 1: Upload (file picker — actual upload needs Cloudflare Stream/R2 integration) */}
      {step === 1 && (
        <div>
          <h2 className="font-syne font-semibold text-ivory mb-2">Upload your file</h2>
          <p className="text-ivory-dim text-sm mb-6">
            {CATEGORIES.find(c => c.value === category)?.accept} accepted · Max{' '}
            {(() => { const c = CATEGORIES.find(x => x.value === category); return c && c.maxMB >= 1024 ? `${c.maxMB / 1024}GB` : `${CATEGORIES.find(x => x.value === category)?.maxMB}MB` })()}
          </p>

          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-gold/40 transition-colors bg-black-card">
            <span className="text-4xl mb-3">📁</span>
            <p className="font-syne text-ivory-mid">Click to select file</p>
            <p className="text-xs text-ivory-dim mt-1">or drag and drop</p>
            <input
              type="file"
              accept={CATEGORIES.find(c => c.value === category)?.accept}
              className="hidden"
              onChange={() => { /* TODO: Upload to Cloudflare Stream/R2 */ }}
            />
          </label>

          <p className="text-xs text-ivory-dim mt-4 text-center">
            Files are uploaded to Cloudflare — optimised for African bandwidth
          </p>

          <div className="flex gap-3 mt-6">
            <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
            <Button variant="gold" onClick={() => setStep(2)}>Continue</Button>
          </div>
        </div>
      )}

      {/* Step 2: Metadata */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-syne font-semibold text-ivory mb-2">Tell us about your work</h2>
          <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Give your work a title" required />
          <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this about?" rows={3} />

          {/* Genres */}
          {category && GENRE_OPTIONS[category] && (
            <div>
              <p className="text-sm font-syne text-ivory-mid mb-2">Genres</p>
              <div className="flex flex-wrap gap-2">
                {GENRE_OPTIONS[category]!.map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])}
                    className={cn('px-3 py-1.5 rounded-pill text-sm border transition-all', genres.includes(g) ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 text-ivory-dim hover:border-white/20')}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Input label="Languages (comma separated)" value={languages} onChange={e => setLanguages(e.target.value)} placeholder="English, isiZulu, Yoruba" />
          <Input label="Country of origin" value={country} onChange={e => setCountry(e.target.value)} placeholder="South Africa" />

          <div>
            <p className="text-sm font-syne text-ivory-mid mb-2">Age rating</p>
            <div className="flex gap-2">
              {['G', 'PG', '13', '16', '18'].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setAgeRating(r)}
                  className={cn('px-3 py-1.5 rounded border text-sm font-mono transition-all', ageRating === r ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 text-ivory-dim')}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button variant="gold" disabled={!title} onClick={() => { setStep(3); runEnrichment() }}>Continue</Button>
          </div>
        </div>
      )}

      {/* Step 3: AI Enrichment */}
      {step === 3 && (
        <div>
          <h2 className="font-syne font-semibold text-ivory mb-2">AI Discovery Enhancement</h2>
          <p className="text-ivory-dim text-sm mb-6">Claude has analysed your work to improve discoverability. Review and edit the suggestions.</p>

          {enrichmentLoading && (
            <div className="flex items-center gap-3 py-8">
              <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-ivory-dim text-sm">Claude is analysing your work...</p>
            </div>
          )}

          {enrichment && !enrichmentLoading && (
            <div className="flex flex-col gap-5">
              {/* AI Summary */}
              <div>
                <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-2">AI Summary</p>
                <p className="text-sm text-ivory bg-black-card border border-white/10 rounded-lg px-4 py-3 leading-relaxed">
                  {enrichment.ai_summary}
                </p>
              </div>

              {/* Mood tags */}
              <div>
                <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-2">Mood Tags</p>
                <div className="flex flex-wrap gap-2">
                  {enrichment.mood_tags.map(tag => (
                    <Badge key={tag} variant="gold">{tag}</Badge>
                  ))}
                </div>
              </div>

              {/* Theme tags */}
              <div>
                <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-2">Theme Tags</p>
                <div className="flex flex-wrap gap-2">
                  {enrichment.theme_tags.map(tag => (
                    <Badge key={tag} variant="dark">{tag}</Badge>
                  ))}
                </div>
              </div>

              {enrichment.cultural_context && (
                <div>
                  <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-2">Cultural Context</p>
                  <p className="text-sm text-ivory-mid">{enrichment.cultural_context}</p>
                </div>
              )}
            </div>
          )}

          {!enrichmentLoading && !enrichment && (
            <div className="text-center py-8">
              <p className="text-ivory-dim text-sm mb-4">AI enrichment unavailable — you can skip and publish without it.</p>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
            <Button variant="gold" onClick={() => setStep(4)}>Continue to Publish</Button>
          </div>
        </div>
      )}

      {/* Step 4: Publish */}
      {step === 4 && (
        <div>
          <h2 className="font-syne font-semibold text-ivory mb-6">Ready to publish</h2>

          <div className="bg-black-card border border-white/10 rounded-xl p-5 mb-6">
            <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-3">Summary</p>
            <p className="font-syne font-semibold text-ivory">{title}</p>
            <p className="text-sm text-ivory-dim mt-1 capitalize">{category?.replace('_', ' ')}</p>
            {description && <p className="text-sm text-ivory-mid mt-2 line-clamp-2">{description}</p>}
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(3)}>Back</Button>
            <Button variant="gold" loading={publishing} onClick={publish}>
              Publish Now
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
