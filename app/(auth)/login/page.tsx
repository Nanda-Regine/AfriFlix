'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicSent, setMagicSent] = useState(false)
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(next)
      router.refresh()
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}` }
    })
    if (error) setError(error.message)
    else setMagicSent(true)
    setLoading(false)
  }

  if (magicSent) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-4">📬</div>
        <h2 className="font-syne font-bold text-xl text-ivory mb-2">Check your email</h2>
        <p className="text-ivory-dim text-sm">We sent a magic link to <strong className="text-ivory">{email}</strong>. Click it to sign in.</p>
      </div>
    )
  }

  return (
    <>
      <h1 className="font-syne font-bold text-2xl text-ivory mb-2">Welcome back</h1>
      <p className="text-ivory-dim text-sm mb-8">Sign in to your AfriFlix account</p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('password')}
          className={`flex-1 py-2 rounded-lg text-sm font-syne transition-colors ${mode === 'password' ? 'bg-gold/20 text-gold border border-gold/30' : 'text-ivory-dim hover:text-ivory'}`}
        >
          Password
        </button>
        <button
          onClick={() => setMode('magic')}
          className={`flex-1 py-2 rounded-lg text-sm font-syne transition-colors ${mode === 'magic' ? 'bg-gold/20 text-gold border border-gold/30' : 'text-ivory-dim hover:text-ivory'}`}
        >
          Magic Link
        </button>
      </div>

      <form onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
        />

        {mode === 'password' && (
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Your password"
            required
            autoComplete="current-password"
          />
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" variant="gold" className="w-full mt-2" loading={loading}>
          {mode === 'password' ? 'Sign in' : 'Send Magic Link'}
        </Button>
      </form>

      <p className="text-center text-sm text-ivory-dim mt-6">
        Don't have an account?{' '}
        <Link href="/signup" className="text-gold hover:text-gold-light transition-colors">
          Sign up free
        </Link>
      </p>
    </>
  )
}
