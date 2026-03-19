'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function CancelSubscriptionButton() {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState('')

  async function cancel() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/payments/payfast/cancel-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    if (data.ok) {
      setDone(true)
    } else {
      setError(data.error ?? 'Failed to cancel')
      setConfirming(false)
    }
    setLoading(false)
  }

  if (done) {
    return <p className="text-xs text-ivory-dim text-center font-mono">Subscription cancelled. Reverts to Free at end of billing period.</p>
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-ivory-dim text-center">Are you sure? You'll lose Pro access.</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1" onClick={() => setConfirming(false)}>Keep plan</Button>
          <Button variant="outline" size="sm" className="flex-1 border-terra text-terra-light" loading={loading} onClick={cancel}>Cancel subscription</Button>
        </div>
        {error && <p className="text-xs text-terra-light font-mono">{error}</p>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-ivory-dim hover:text-terra-light transition-colors font-mono text-center w-full"
    >
      Cancel subscription
    </button>
  )
}
