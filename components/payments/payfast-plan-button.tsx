'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

type PlanKey = 'creator_pro' | 'label'

interface Props {
  plan: PlanKey
  variant?: 'gold' | 'outline'
  label?: string
}

export function PayfastPlanButton({ plan, variant = 'gold', label }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleUpgrade() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/payments/payfast/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl
    } else {
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button variant={variant} size="sm" className="w-full" loading={loading} onClick={handleUpgrade}>
        {label ?? 'Upgrade'}
      </Button>
      {error && <p className="text-xs text-terra-light font-mono text-center">{error}</p>}
    </div>
  )
}
