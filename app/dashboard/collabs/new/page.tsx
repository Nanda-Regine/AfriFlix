'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { CollabType, ContentCategory } from '@/types'

const COLLAB_TYPES: { value: CollabType; label: string; description: string; emoji: string }[] = [
  { value: 'collab', label: 'Collab', description: 'Creative partnership on a project', emoji: '🤝' },
  { value: 'commission', label: 'Commission', description: 'Paid creative work for a brand or client', emoji: '💼' },
  { value: 'casting', label: 'Casting', description: 'Looking for performers or on-screen talent', emoji: '🎭' },
  { value: 'gig', label: 'Gig', description: 'One-off event or short-term job', emoji: '🎤' },
  { value: 'mentorship', label: 'Mentorship', description: 'Offering or seeking guidance', emoji: '🌱' },
]

const CATEGORIES: { value: ContentCategory; label: string }[] = [
  { value: 'film', label: 'Film & Series' },
  { value: 'music', label: 'Music' },
  { value: 'dance', label: 'Dance' },
  { value: 'writing', label: 'Writing' },
  { value: 'poetry', label: 'Poetry' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'theatre', label: 'Theatre' },
  { value: 'visual_art', label: 'Visual Art' },
]

export default function NewCollabPage() {
  const router = useRouter()
  const { creator } = useAuthStore()

  const [type, setType] = useState<CollabType | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ContentCategory | null>(null)
  const [skills, setSkills] = useState('')
  const [location, setLocation] = useState('')
  const [compensation, setCompensation] = useState<'paid' | 'revenue_share' | 'credit_only' | null>(null)
  const [budget, setBudget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = type && title.trim() && description.trim()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !creator) return

    setSubmitting(true)
    setError('')

    try {
      const supabase = createClient()
      const { error: insertError } = await supabase.from('collabs').insert({
        creator_id: creator.id,
        type,
        title: title.trim(),
        description: description.trim(),
        category: category ?? null,
        skills_needed: skills.split(',').map(s => s.trim()).filter(Boolean),
        location: location.trim() || null,
        compensation_type: compensation ?? null,
        budget_range: budget.trim() || null,
        deadline: deadline || null,
        status: 'open',
      })

      if (insertError) throw insertError

      router.push('/dashboard/collabs')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-syne font-bold text-2xl text-ivory">Post a Collab Listing</h1>
        <p className="text-ivory-dim mt-1">
          Let Africa's creative community find and apply for your opportunity.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-7">
        {/* Type */}
        <div>
          <p className="text-sm font-syne text-ivory-mid mb-3">What type of listing is this?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {COLLAB_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={cn(
                  'text-left p-4 rounded-xl border transition-all',
                  type === t.value
                    ? 'border-gold bg-gold/10'
                    : 'border-white/10 hover:border-white/20 bg-black-card'
                )}
              >
                <span className="text-xl mb-1.5 block">{t.emoji}</span>
                <p className="font-syne text-sm text-ivory">{t.label}</p>
                <p className="text-xs text-ivory-dim mt-0.5">{t.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <Input
          label="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Need a composer for a short film soundtrack"
          required
        />

        {/* Description */}
        <Textarea
          label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe the opportunity, what you're looking for, and what applicants should know..."
          rows={5}
          required
        />

        {/* Category */}
        <div>
          <p className="text-sm font-syne text-ivory-mid mb-3">Category (optional)</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(prev => prev === cat.value ? null : cat.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full border text-sm transition-all',
                  category === cat.value
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-white/10 text-ivory-dim hover:border-white/20'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Skills + Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Skills needed (comma separated)"
            value={skills}
            onChange={e => setSkills(e.target.value)}
            placeholder="Composing, audio mixing, live session"
          />
          <Input
            label="Location"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Remote, Cape Town, Lagos..."
          />
        </div>

        {/* Compensation */}
        <div>
          <p className="text-sm font-syne text-ivory-mid mb-3">Compensation</p>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'paid', label: 'Paid' },
              { value: 'revenue_share', label: 'Revenue share' },
              { value: 'credit_only', label: 'Credit only' },
            ].map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCompensation(prev => prev === c.value ? null : c.value as typeof compensation)}
                className={cn(
                  'px-3 py-1.5 rounded-full border text-sm transition-all',
                  compensation === c.value
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-white/10 text-ivory-dim hover:border-white/20'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Budget + Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Budget range (optional)"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            placeholder="R1,000–R5,000 or negotiable"
          />
          <div>
            <label className="block text-sm font-syne text-ivory-mid mb-2">
              Application deadline (optional)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full bg-black-card border border-white/10 rounded-lg px-4 py-3 text-sm text-ivory placeholder-ivory-dim focus:border-gold/50 focus:outline-none transition-colors"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-900/10 border border-red-900/30 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="gold"
            loading={submitting}
            disabled={!canSubmit}
          >
            Post Listing
          </Button>
        </div>
      </form>
    </div>
  )
}
