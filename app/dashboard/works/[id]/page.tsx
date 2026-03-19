'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CATEGORY_META, AFRICAN_COUNTRIES } from '@/types'
import type { Work, ContentCategory, WorkStatus } from '@/types'

const MOOD_OPTIONS = ['joyful', 'nostalgic', 'empowering', 'spiritual', 'romantic', 'intense', 'playful', 'melancholy', 'hopeful']
const GENRE_OPTIONS = ['drama', 'comedy', 'romance', 'thriller', 'documentary', 'animation', 'spoken word', 'afrobeats', 'amapiano', 'afropop', 'hip-hop', 'jazz', 'traditional', 'experimental']

export default function EditWorkPage() {
  const params = useParams()
  const workId = params.id as string
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [work, setWork] = useState<Work | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [country, setCountry] = useState('')
  const [language, setLanguage] = useState('')
  const [genres, setGenres] = useState<string[]>([])
  const [moodTags, setMoodTags] = useState<string[]>([])
  const [themeTags, setThemeTags] = useState('')
  const [status, setStatus] = useState<WorkStatus>('draft')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('works')
        .select('*')
        .eq('id', workId)
        .single()

      if (!data) { router.push('/dashboard/works'); return }
      const w = data as Work
      setWork(w)
      setTitle(w.title)
      setDescription(w.description ?? '')
      setCountry(w.country_of_origin ?? '')
      setLanguage(w.languages?.[0] ?? '')
      setGenres(w.genres ?? [])
      setMoodTags(w.mood_tags ?? [])
      setThemeTags((w.theme_tags ?? []).join(', '))
      setStatus(w.status)
      setLoading(false)
    }
    load()
  }, [workId, router])

  function toggleTag(value: string, list: string[], setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter(x => x !== value) : [...list, value])
  }

  async function save() {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: err } = await supabase
        .from('works')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          country_of_origin: country || null,
          languages: language ? [language] : [],
          genres,
          mood_tags: moodTags,
          theme_tags: themeTags.split(',').map(t => t.trim()).filter(Boolean),
          status,
        })
        .eq('id', workId)

      if (err) { setError(err.message); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      startTransition(() => router.refresh())
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl py-16 text-center">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (!work) return null

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/works" className="text-ivory-dim hover:text-ivory transition-colors text-sm font-mono">
          ← Works
        </Link>
        <div className="flex-1">
          <h1 className="font-syne font-bold text-2xl text-ivory">Edit Work</h1>
        </div>
      </div>

      <div className="space-y-6">
        {/* Status */}
        <div className="bg-black-card border border-white/5 rounded-xl p-5">
          <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-3">Status</p>
          <div className="flex gap-2">
            {(['draft', 'published'] as WorkStatus[]).map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-4 py-2 rounded-lg text-sm font-syne capitalize transition-all ${
                  status === s
                    ? 'bg-gold text-black font-semibold'
                    : 'border border-white/10 text-ivory-dim hover:border-white/20'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Title & Description */}
        <div className="bg-black-card border border-white/5 rounded-xl p-5 space-y-4">
          <div>
            <label className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-2 block">Title *</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Work title"
              maxLength={200}
            />
          </div>
          <div>
            <label className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-2 block">
              Description <span className="normal-case font-normal">(optional)</span>
            </label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Tell viewers about this work..."
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-ivory-dim font-mono mt-1">{description.length}/2000</p>
          </div>
        </div>

        {/* Origin & Language */}
        <div className="bg-black-card border border-white/5 rounded-xl p-5 space-y-4">
          <div>
            <label className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-2 block">Country of Origin</label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full bg-black-hover border border-white/10 rounded-lg px-3 py-2.5 text-sm text-ivory focus:outline-none focus:border-gold/40"
            >
              <option value="">Select country</option>
              {AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-2 block">Primary Language</label>
            <Input
              value={language}
              onChange={e => setLanguage(e.target.value)}
              placeholder="e.g. Zulu, Yoruba, Swahili, English"
            />
          </div>
        </div>

        {/* Genres */}
        <div className="bg-black-card border border-white/5 rounded-xl p-5">
          <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-3">Genres</p>
          <div className="flex flex-wrap gap-2">
            {GENRE_OPTIONS.map(g => (
              <button
                key={g}
                onClick={() => toggleTag(g, genres, setGenres)}
                className={`px-3 py-1.5 rounded-lg text-xs font-syne capitalize transition-all ${
                  genres.includes(g)
                    ? 'bg-gold/20 border border-gold/40 text-gold'
                    : 'border border-white/10 text-ivory-dim hover:border-white/20'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div className="bg-black-card border border-white/5 rounded-xl p-5">
          <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-3">Mood</p>
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map(m => (
              <button
                key={m}
                onClick={() => toggleTag(m, moodTags, setMoodTags)}
                className={`px-3 py-1.5 rounded-lg text-xs font-syne capitalize transition-all ${
                  moodTags.includes(m)
                    ? 'bg-terra/20 border border-terra/40 text-terra-light'
                    : 'border border-white/10 text-ivory-dim hover:border-white/20'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Tags */}
        <div className="bg-black-card border border-white/5 rounded-xl p-5">
          <label className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-2 block">
            Theme Tags <span className="normal-case font-normal">(comma separated)</span>
          </label>
          <Input
            value={themeTags}
            onChange={e => setThemeTags(e.target.value)}
            placeholder="identity, diaspora, family, resilience..."
          />
        </div>

        {/* Save */}
        {error && <p className="text-sm text-terra-light">{error}</p>}

        <div className="flex items-center gap-4">
          <Button
            variant="gold"
            onClick={save}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          {saved && <span className="text-sm text-green-400 font-mono">Saved ✓</span>}
          <Link href={`/work/${workId}`} target="_blank" className="text-sm text-ivory-dim hover:text-gold transition-colors font-syne">
            View work →
          </Link>
        </div>
      </div>
    </div>
  )
}
