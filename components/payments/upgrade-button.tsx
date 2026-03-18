'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { PlanKey } from '@/lib/stripe'

interface Props {
  plan?: PlanKey
  variant?: 'gold' | 'outline' | 'portal'
  label?: string
}

export function UpgradeButton({ plan, variant = 'gold', label }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      if (variant === 'portal') {
        const res = await fetch('/api/payments/stripe/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
        const data = await res.json()
        if (data.portalUrl) window.location.href = data.portalUrl
      } else {
        const res = await fetch('/api/payments/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan }),
        })
        const data = await res.json()
        if (data.checkoutUrl) window.location.href = data.checkoutUrl
      }
    } catch {
      // Let UI recover naturally
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant === 'portal' ? 'ghost' : variant as 'gold' | 'outline'}
      size="sm"
      className="w-full"
      loading={loading}
      onClick={handleClick}
    >
      {label ?? 'Upgrade'}
    </Button>
  )
}
