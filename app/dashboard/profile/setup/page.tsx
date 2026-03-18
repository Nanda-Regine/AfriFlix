'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AFRICAN_COUNTRIES } from '@/types'
import type { ContentCategory } from '@/types'
import { cn } from '@/lib/utils'

const CATEGORIES: { value: ContentCategory; label: string; emoji: string }[] = [
  { value: 'film',       label: 'Film & Series',        emoji: '🎬' },
  { value: 'music',      label: 'Music',                emoji: '🎵' },
  { value: 'dance',      label: 'Dance',                emoji: '💃' },
  { value: 'writing',    label: 'Writing',              emoji: '✍️' },
  { value: 'poetry',     label: 'Poetry',               emoji: '🎤' },
  { value: 'comedy',     label: 'Comedy',               emoji: '😂' },
  { value: 'theatre',    label: 'Theatre',              emoji: '🎭' },
  { value: 'visual_art', label: 'Visual Art',           emoji: '🎨' },
]

const LANG_OPTIONS = [
  'English', 'French', 'Arabic', 'Portuguese', 'Swahili', 'Hausa', 'Yoruba',
  'Igbo', 'Zulu', 'Xhosa', 'Sotho', 'Tswana', 'Shona', 'Amharic', 'Oromo',
  'Somali', 'Wolof', 'Twi', 'isiNdebele', 'Setswana', 'Afrikaans',
]

export default function ProfileSetupPage() {
  const router = useRouter()
  const { user, setCreator } = useAuthStore()

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername]       = useState('')
  const [bio, setBio]                 = useState('')
  const [country, setCountry]         = useState('')
  const [city, setCity]               = useState('')
  const [isDiaspora, setIsDiaspora]   = useState(false)
  const [categories, setCategories]   = useState<ContentCategory[]>([])
  const [languages, setLanguages]     = useState<string[]>([])
  const [culturalRoots, setCulturalRoots] = useState('')

  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [usernameOk, setUsernameOk] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)

  async function checkUsername(val: string) {
    const slug = val.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(slug)
    if (slug.length < 3) { setUsernameOk(null); return }
    setCheckingUsername(true)
    const supabase = createClient()
    const { data } = await supabase.from('creators').select('id').eq('username', slug).maybeSingle()
    setUsernameOk(!data)
    setCheckingUsername(false)
  }

  function toggleCategory(cat: ContentCategory) {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  function toggleLang(lang: string) {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!displayName.trim() || !username || !country) {
      setError('Display name, username, and country are required.')
      return
    }
    if (usernameOk === false) { setError('That username is taken.'); return }
    if (categories.length === 0) { setError('Pick at least one creative category.'); return }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: insertError } = await supabase
      .from('creators')
      .insert({
        user_id: user.id,
        display_name: displayName.trim(),
        username,
        bio: bio.trim() || null,
        country,
        city: city.trim() || null,
        is_diaspora: isDiaspora,
        categories,
        languages,
        cultural_roots: culturalRoots
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Update auth store so rest of dashboard works immediately
    if (data) setCreator(data)

    router.push('/dashboard')
  }

  const STEPS = [
    { id: 'identity', label: 'Identity' },
    { id: 'creative', label: 'Creative' },
    { id: 'location', label: 'Location' },
  ]
  const [step, setStep] = useState(0)

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 flex items-start justify-center">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <p className="text-4xl mb-3">🌍</p>
          <h1 className="font-syne font-bold text-3xl text-ivory mb-2">Create your creator profile</h1>
          <p className="text-ivory-dim">Join the AfriFlix creative community.</p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex-1">
              <div className={cn('h-1 rounded-full transition-all', i <= step ? 'bg-gold' : 'bg-white/10')} />
              <span className={cn('text-[10px] font-mono mt-1 block', i === step ? 'text-gold' : 'text-ivory-dim')}>{s.label}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Step 0: Identity */}
          {step === 0 && (
            <>
              <Input
                label="Display Name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="How you appear on AfriFlix"
                required
              />

              <div>
                <Input
                  label="Username"
                  value={username}
                  onChange={e => checkUsername(e.target.value)}
                  placeholder="yourname (letters, numbers, underscores)"
                />
                {username.length >= 3 && (
                  <p className={cn('text-xs mt-1 font-mono', usernameOk === true ? 'text-green-400' : usernameOk === false ? 'text-terra-light' : 'text-ivory-dim')}>
                    {checkingUsername ? 'Checking...' : usernameOk === true ? `✓ @${username} is available` : usernameOk === false ? `✗ @${username} is taken` : ''}
                  </p>
                )}
              </div>

              <Textarea
                label="Bio"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell the world who you are and what you create..."
                rows={3}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="gold"
                  disabled={!displayName.trim() || !username || usernameOk !== true}
                  onClick={() => setStep(1)}
                >
                  Continue
                </Button>
              </div>
            </>
          )}

          {/* Step 1: Creative */}
          {step === 1 && (
            <>
              <div>
                <p className="font-syne text-sm text-ivory-mid mb-3">What do you create? (pick all that apply)</p>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => toggleCategory(cat.value)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                        categories.includes(cat.value)
                          ? 'border-gold bg-gold/10 text-ivory'
                          : 'border-white/10 text-ivory-dim hover:border-white/20 bg-black-card'
                      )}
                    >
                      <span>{cat.emoji}</span>
                      <span className="text-sm font-syne">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-syne text-sm text-ivory-mid mb-3">Languages you create in</p>
                <div className="flex flex-wrap gap-2">
                  {LANG_OPTIONS.map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLang(lang)}
                      className={cn(
                        'px-3 py-1.5 rounded-pill border text-sm transition-all',
                        languages.includes(lang)
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-white/10 text-ivory-dim hover:border-white/20'
                      )}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Cultural roots / ethnic identity (optional)"
                value={culturalRoots}
                onChange={e => setCulturalRoots(e.target.value)}
                placeholder="e.g. Yoruba, Zulu, Akan, Somali (comma separated)"
              />

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setStep(0)}>Back</Button>
                <Button
                  type="button"
                  variant="gold"
                  disabled={categories.length === 0}
                  onClick={() => setStep(2)}
                >
                  Continue
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-syne text-ivory-mid mb-2">Country *</label>
                <select
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full bg-black-card border border-white/10 rounded-xl px-4 py-3 text-ivory text-sm focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20"
                  required
                >
                  <option value="">Select your country</option>
                  {AFRICAN_COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Diaspora">Diaspora (outside Africa)</option>
                </select>
              </div>

              <Input
                label="City (optional)"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Lagos, Cape Town, Nairobi"
              />

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setIsDiaspora(p => !p)}
                  className={cn(
                    'w-10 h-6 rounded-full transition-all relative',
                    isDiaspora ? 'bg-gold' : 'bg-white/20'
                  )}
                >
                  <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all', isDiaspora ? 'left-5' : 'left-1')} />
                </div>
                <span className="text-sm font-syne text-ivory-mid">
                  I am African diaspora (living outside Africa)
                </span>
              </label>

              {error && (
                <p className="text-sm text-terra-light font-mono">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button
                  type="submit"
                  variant="gold"
                  loading={loading}
                  disabled={!country}
                >
                  Create Profile
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
