'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Creator, ContentCategory } from '@/types'
import { AFRICAN_COUNTRIES } from '@/types'

const TABS = ['Profile', 'Notifications', 'Plan'] as const
type Tab = typeof TABS[number]

const CATEGORY_OPTIONS: { value: ContentCategory; label: string }[] = [
  { value: 'film', label: 'Film & Series' },
  { value: 'music', label: 'Music' },
  { value: 'dance', label: 'Dance' },
  { value: 'writing', label: 'Writing' },
  { value: 'poetry', label: 'Poetry' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'theatre', label: 'Theatre' },
  { value: 'visual_art', label: 'Visual Art' },
]

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('Profile')
  const [creator, setCreator] = useState<Creator | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Profile fields
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [categories, setCategories] = useState<ContentCategory[]>([])
  const [languages, setLanguages] = useState('')
  const [culturalRoots, setCulturalRoots] = useState('')
  const [isDiaspora, setIsDiaspora] = useState(false)

  // Notification prefs
  const [notifNewFollower, setNotifNewFollower] = useState(true)
  const [notifNewComment, setNotifNewComment] = useState(true)
  const [notifNewApplication, setNotifNewApplication] = useState(true)
  const [notifTips, setNotifTips] = useState(true)
  const [notifWeeklyDigest, setNotifWeeklyDigest] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        const c = data as Creator
        setCreator(c)
        setDisplayName(c.display_name)
        setBio(c.bio ?? '')
        setCountry(c.country ?? '')
        setCity(c.city ?? '')
        setCategories(c.categories ?? [])
        setLanguages((c.languages ?? []).join(', '))
        setCulturalRoots((c.cultural_roots ?? []).join(', '))
        setIsDiaspora(c.is_diaspora ?? false)
      }

      setLoading(false)
    }
    load()
  }, [])

  async function saveProfile() {
    if (!creator) return
    setSaving(true)
    setSaved(false)
    const supabase = createClient()

    await supabase.from('creators').update({
      display_name: displayName.trim(),
      bio: bio.trim() || null,
      country,
      city: city.trim() || null,
      categories,
      languages: languages.split(',').map(l => l.trim()).filter(Boolean),
      cultural_roots: culturalRoots.split(',').map(r => r.trim()).filter(Boolean),
      is_diaspora: isDiaspora,
    }).eq('id', creator.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function toggleCategory(cat: ContentCategory) {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-syne font-bold text-2xl text-ivory mb-8">Settings</h1>

        {/* Tab nav */}
        <div className="flex gap-1 mb-8 border-b border-white/5 pb-0">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2.5 text-sm font-syne transition-colors border-b-2 -mb-px',
                tab === t
                  ? 'border-gold text-gold'
                  : 'border-transparent text-ivory-dim hover:text-ivory'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {tab === 'Profile' && (
          <div className="flex flex-col gap-5">
            {!creator && (
              <div className="bg-gold/10 border border-gold/20 rounded-xl p-4 text-sm text-ivory-mid">
                You don't have a creator profile yet.{' '}
                <a href="/dashboard" className="text-gold underline">Create one in your dashboard.</a>
              </div>
            )}

            <Input
              label="Display name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name as it appears on AfriFlix"
            />

            <Textarea
              label="Bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell the world who you are and what you create..."
              rows={4}
            />

            <div>
              <label className="block text-sm font-syne text-ivory-mid mb-2">Country</label>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full bg-black-card border border-white/10 rounded-lg px-4 py-3 text-sm text-ivory focus:border-gold/50 focus:outline-none transition-colors"
              >
                <option value="">Select your country</option>
                {AFRICAN_COUNTRIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="Diaspora — UK">Diaspora — UK</option>
                <option value="Diaspora — USA">Diaspora — USA</option>
                <option value="Diaspora — Europe">Diaspora — Europe</option>
                <option value="Diaspora — Other">Diaspora — Other</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={isDiaspora}
                onClick={() => setIsDiaspora(p => !p)}
                className={cn(
                  'relative w-10 h-5 rounded-full transition-colors',
                  isDiaspora ? 'bg-gold' : 'bg-white/20'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                    isDiaspora && 'translate-x-5'
                  )}
                />
              </button>
              <span className="text-sm text-ivory-mid">I'm African diaspora</span>
            </div>

            <Input
              label="City (optional)"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Cape Town, Lagos, Nairobi..."
            />

            <div>
              <p className="text-sm font-syne text-ivory-mid mb-3">
                What do you create? (select all that apply)
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => toggleCategory(cat.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-full border text-sm transition-all',
                      categories.includes(cat.value)
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-white/10 text-ivory-dim hover:border-white/20'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Languages you create in (comma separated)"
              value={languages}
              onChange={e => setLanguages(e.target.value)}
              placeholder="English, isiZulu, Yoruba, Swahili..."
            />

            <Input
              label="Cultural roots (comma separated)"
              value={culturalRoots}
              onChange={e => setCulturalRoots(e.target.value)}
              placeholder="Zulu, Yoruba, Akan, Somali..."
            />

            <div className="flex items-center gap-4 pt-2">
              <Button variant="gold" loading={saving} onClick={saveProfile} disabled={!creator}>
                Save Changes
              </Button>
              {saved && (
                <span className="text-sm text-emerald-400">Saved!</span>
              )}
            </div>
          </div>
        )}

        {/* Notifications tab */}
        {tab === 'Notifications' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ivory-dim mb-2">Control which email notifications you receive.</p>

            {[
              { label: 'New follower', desc: 'When someone follows you', state: notifNewFollower, set: setNotifNewFollower },
              { label: 'New comment', desc: 'When someone comments on your work', state: notifNewComment, set: setNotifNewComment },
              { label: 'Collab application', desc: 'When someone applies to your listing', state: notifNewApplication, set: setNotifNewApplication },
              { label: 'Tips received', desc: 'When a fan sends you a tip', state: notifTips, set: setNotifTips },
              { label: 'Weekly digest', desc: 'Your weekly performance summary', state: notifWeeklyDigest, set: setNotifWeeklyDigest },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-black-card border border-white/5 rounded-xl">
                <div>
                  <p className="text-sm font-syne text-ivory">{item.label}</p>
                  <p className="text-xs text-ivory-dim mt-0.5">{item.desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={item.state}
                  onClick={() => item.set(p => !p)}
                  className={cn(
                    'relative w-10 h-5 rounded-full transition-colors flex-shrink-0',
                    item.state ? 'bg-gold' : 'bg-white/20'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                      item.state && 'translate-x-5'
                    )}
                  />
                </button>
              </div>
            ))}

            <p className="text-xs text-ivory-dim mt-2">
              Notification preferences are saved to your browser. Server-side email preferences coming soon.
            </p>
          </div>
        )}

        {/* Plan tab */}
        {tab === 'Plan' && (
          <div className="flex flex-col gap-4">
            <div className="bg-black-card border border-white/5 rounded-2xl p-6">
              <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-3">Current Plan</p>
              <p className="font-syne font-bold text-2xl text-ivory mb-1 capitalize">
                {creator?.plan?.replace('_', ' ') ?? 'Free'}
              </p>
              <p className="text-sm text-ivory-dim mb-6">
                {creator?.plan === 'creator_pro'
                  ? 'You have full access to all Creator Pro features.'
                  : 'Upgrade to unlock tips, priority placement, unlimited AI, and more.'}
              </p>

              {creator?.plan !== 'creator_pro' && (
                <div className="bg-gold/5 border border-gold/20 rounded-xl p-5">
                  <p className="font-syne font-semibold text-ivory mb-3">Creator Pro — R99/month</p>
                  <ul className="text-sm text-ivory-dim space-y-2 mb-5">
                    {[
                      'Unlimited storage',
                      'Priority discovery placement',
                      'Unlimited Claude AI assistant',
                      'Tips from fans enabled',
                      'Advanced analytics dashboard',
                      'Content scheduling',
                      'Verified creator badge',
                    ].map(feat => (
                      <li key={feat} className="flex items-center gap-2">
                        <span className="text-gold">✓</span> {feat}
                      </li>
                    ))}
                  </ul>
                  <Button variant="gold" onClick={() => alert('Stripe integration coming soon')}>
                    Upgrade to Creator Pro
                  </Button>
                </div>
              )}
            </div>

            {creator?.plan === 'creator_pro' && (
              <p className="text-xs text-ivory-dim text-center">
                To cancel or modify your subscription, contact{' '}
                <a href="mailto:hello@afriflix.co.za" className="text-gold hover:text-gold-light">
                  hello@afriflix.co.za
                </a>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
