'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AFRICAN_COUNTRIES } from '@/types'

type AccountType = 'fan' | 'creator'

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('fan')
  const [country, setCountry] = useState('')
  const [isDiaspora, setIsDiaspora] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step < 2) { setStep(2); return }

    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, account_type: accountType },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user && accountType === 'creator') {
      const username = displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now().toString(36)
      await supabase.from('creators').insert({
        user_id: data.user.id,
        display_name: displayName,
        username,
        country: country || 'South Africa',
        is_diaspora: isDiaspora,
        categories: [],
        languages: [],
        cultural_roots: [],
      })
    }

    router.push('/onboarding')
  }

  return (
    <>
      <h1 className="font-syne font-bold text-2xl text-ivory mb-2">
        {step === 1 ? 'Join AfriFlix' : 'Tell us about you'}
      </h1>
      <p className="text-ivory-dim text-sm mb-8">
        {step === 1 ? 'African Stories. Global Stage.' : 'Help us personalize your experience'}
      </p>

      {/* Step indicator */}
      <div className="flex gap-2 mb-6">
        {[1, 2].map(s => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-gold' : 'bg-white/10'}`}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {step === 1 ? (
          <>
            <Input
              label="Display name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name or creative alias"
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </>
        ) : (
          <>
            {/* Account type */}
            <div>
              <p className="text-sm font-syne text-ivory-mid mb-2">I'm joining as a...</p>
              <div className="grid grid-cols-2 gap-3">
                {(['fan', 'creator'] as AccountType[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccountType(type)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      accountType === type
                        ? 'border-gold bg-gold/10 text-ivory'
                        : 'border-white/10 text-ivory-dim hover:border-white/20'
                    }`}
                  >
                    <p className="font-syne font-semibold text-sm mb-1">
                      {type === 'fan' ? '🎬 Fan' : '🎨 Creator'}
                    </p>
                    <p className="text-xs opacity-70">
                      {type === 'fan' ? 'Discover & enjoy African content' : 'Upload & monetise your work'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Country */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-syne text-ivory-mid">Where are you based / connected to?</label>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full px-4 py-3 bg-black-card border border-white/10 rounded-lg text-ivory font-syne text-sm focus:outline-none focus:border-gold/50 transition-colors"
              >
                <option value="">Select a country</option>
                {AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="Diaspora - Europe">Diaspora — Europe</option>
                <option value="Diaspora - Americas">Diaspora — Americas</option>
                <option value="Diaspora - Other">Diaspora — Other</option>
              </select>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isDiaspora}
                onChange={e => setIsDiaspora(e.target.checked)}
                className="w-4 h-4 accent-gold rounded"
              />
              <span className="text-sm text-ivory-dim">I'm African diaspora (living outside Africa)</span>
            </label>
          </>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" variant="gold" className="w-full mt-2" loading={loading}>
          {step === 1 ? 'Continue' : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-sm text-ivory-dim mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-gold hover:text-gold-light transition-colors">
          Sign in
        </Link>
      </p>
    </>
  )
}
