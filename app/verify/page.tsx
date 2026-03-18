'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const METHODS = [
  {
    id: 'social_link',
    title: 'Social Media Link',
    desc: 'Link to your African social media profile or website that shows your location/identity.',
    icon: '🔗',
  },
  {
    id: 'community_voucher',
    title: 'Community Voucher',
    desc: 'Get vouched by an existing verified African creator on AfriFlix.',
    icon: '🤝',
  },
  {
    id: 'id_document',
    title: 'ID Document',
    desc: 'Upload a government-issued ID (handled securely — not stored publicly).',
    icon: '🪪',
  },
]

export default function VerifyPage() {
  const [method, setMethod]             = useState('')
  const [socialUrl, setSocialUrl]       = useState('')
  const [voucherUsername, setVoucherUsername] = useState('')
  const [notes, setNotes]               = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [submitted, setSubmitted]       = useState(false)
  const [error, setError]               = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!method) { setError('Select a verification method.'); return }
    setSubmitting(true)
    setError('')

    const payload: Record<string, string> = { method, notes }
    if (method === 'social_link') payload.social_proof_url = socialUrl
    if (method === 'community_voucher') payload.voucher_username = voucherUsername

    const res = await fetch('/api/verify/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Submission failed')
    } else {
      setSubmitted(true)
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <p className="text-5xl mb-6">✅</p>
        <h1 className="font-syne font-bold text-3xl text-ivory mb-3">Application submitted</h1>
        <p className="text-ivory-dim max-w-md leading-relaxed">
          We'll review your verification request within 48–72 hours. You'll see the verified badge
          on your profile once approved.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-mono text-gold uppercase tracking-wider mb-2">African Creator Verification</p>
          <h1 className="font-syne font-bold text-3xl text-ivory mb-3">Get Verified</h1>
          <p className="text-ivory-dim leading-relaxed">
            AfriFlix is built for African creators. Verification confirms your African identity and
            unlocks the verified badge, trust signals, and priority discovery.
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-6">
          {/* Method selection */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-syne text-ivory-mid">Choose your verification method</p>
            {METHODS.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-xl border text-left transition-all',
                  method === m.id
                    ? 'border-gold bg-gold/10'
                    : 'border-white/10 bg-black-card hover:border-white/20'
                )}
              >
                <span className="text-2xl flex-shrink-0">{m.icon}</span>
                <div>
                  <p className="font-syne font-semibold text-ivory text-sm">{m.title}</p>
                  <p className="text-xs text-ivory-dim mt-0.5 leading-relaxed">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Method-specific fields */}
          {method === 'social_link' && (
            <Input
              label="Your African social profile or website URL"
              value={socialUrl}
              onChange={e => setSocialUrl(e.target.value)}
              placeholder="https://instagram.com/yourhandle or https://yoursite.co.za"
              required
            />
          )}
          {method === 'community_voucher' && (
            <Input
              label="Username of verified creator vouching for you"
              value={voucherUsername}
              onChange={e => setVoucherUsername(e.target.value)}
              placeholder="@creatorusername"
              required
            />
          )}
          {method === 'id_document' && (
            <div className="p-4 bg-black-card border border-white/10 rounded-xl text-sm text-ivory-dim">
              Our team will contact you via email to securely collect your ID document.
              Please add a note below with the best way to reach you.
            </div>
          )}

          <Textarea
            label="Additional notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any additional context about your African identity or creative work..."
            rows={3}
          />

          {error && <p className="text-sm text-terra-light font-mono">{error}</p>}

          <Button type="submit" variant="gold" loading={submitting} disabled={!method}>
            Submit Verification Request
          </Button>
        </form>
      </div>
    </div>
  )
}
