'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Creator } from '@/types'

interface TipButtonProps {
  creator: Creator
  workId?: string
}

const PRESET_AMOUNTS = [10, 20, 50, 100, 200]
type Provider = 'payfast' | 'flutterwave'

export function TipButton({ creator, workId }: TipButtonProps) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState<number | null>(50)
  const [customAmount, setCustomAmount] = useState('')
  const [message, setMessage] = useState('')
  const [provider, setProvider] = useState<Provider>('payfast')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!creator.tips_enabled) return null

  const selectedAmount = customAmount ? parseFloat(customAmount) : amount

  async function sendTip() {
    if (!selectedAmount || selectedAmount < 10) {
      setError('Minimum tip is R10')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/payments/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: creator.id,
          workId: workId ?? null,
          amount: selectedAmount,
          currency: 'ZAR',
          message: message.trim() || null,
          provider,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Payment failed. Please try again.')
        return
      }

      // Redirect to payment gateway
      window.location.href = data.checkoutUrl
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="gold"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={`Tip ${creator.display_name}`}
      >
        💛 Send a Tip
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 px-4"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-black-card border border-white/10 rounded-2xl p-6 w-full max-w-md animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-syne font-bold text-ivory">Support {creator.display_name}</h2>
                <p className="text-xs text-ivory-dim mt-0.5">100% goes to the creator (minus 10% AfriFlix fee)</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-ivory-dim hover:text-ivory transition-colors"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Preset amounts */}
            <div className="mb-4">
              <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-2">Amount (ZAR)</p>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_AMOUNTS.map(preset => (
                  <button
                    key={preset}
                    onClick={() => { setAmount(preset); setCustomAmount('') }}
                    className={cn(
                      'py-2 rounded-lg border text-sm font-syne transition-all',
                      amount === preset && !customAmount
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-white/10 text-ivory-dim hover:border-white/20'
                    )}
                  >
                    R{preset}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="10"
                placeholder="Custom amount"
                value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setAmount(null) }}
                className="w-full mt-2 bg-black border border-white/10 rounded-lg px-4 py-2.5 text-sm text-ivory placeholder-ivory-dim focus:border-gold/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Message */}
            <div className="mb-4">
              <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-2">Message (optional)</p>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Leave a note of appreciation..."
                rows={2}
                maxLength={200}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-sm text-ivory placeholder-ivory-dim focus:border-gold/50 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Payment provider */}
            <div className="mb-5">
              <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-2">Pay via</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'payfast', label: 'PayFast', sub: 'South Africa' },
                  { value: 'flutterwave', label: 'Flutterwave', sub: 'Pan-Africa' },
                ] as { value: Provider; label: string; sub: string }[]).map(p => (
                  <button
                    key={p.value}
                    onClick={() => setProvider(p.value)}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all',
                      provider === p.value
                        ? 'border-gold bg-gold/10'
                        : 'border-white/10 hover:border-white/20 bg-black'
                    )}
                  >
                    <p className="font-syne text-sm text-ivory">{p.label}</p>
                    <p className="text-xs text-ivory-dim">{p.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 mb-4 bg-red-900/10 border border-red-900/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              variant="gold"
              className="w-full"
              loading={loading}
              onClick={sendTip}
              disabled={!selectedAmount || selectedAmount < 10}
            >
              Send R{selectedAmount ?? 0} Tip
            </Button>

            <p className="text-xs text-center text-ivory-dim mt-3">
              Secure payment via {provider === 'payfast' ? 'PayFast' : 'Flutterwave'}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
