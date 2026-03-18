'use client'

import { useState } from 'react'
import { cn, formatCount } from '@/lib/utils'

interface HeartButtonProps {
  workId: string
  initialCount: number
  initialHearted?: boolean
  size?: 'sm' | 'md'
  showCount?: boolean
}

export function HeartButton({ workId, initialCount, initialHearted = false, size = 'md', showCount = true }: HeartButtonProps) {
  const [hearted, setHearted] = useState(initialHearted)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (loading) return
    // Optimistic update
    setHearted(h => !h)
    setCount(c => hearted ? c - 1 : c + 1)
    setLoading(true)

    try {
      const res = await fetch('/api/hearts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ work_id: workId }),
      })
      if (res.ok) {
        const data = await res.json()
        setHearted(data.hearted)
        setCount(data.count)
      } else if (res.status === 401) {
        // Revert if not authed
        setHearted(h => !h)
        setCount(c => hearted ? c + 1 : c - 1)
      }
    } catch {
      setHearted(h => !h)
      setCount(c => hearted ? c + 1 : c - 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        'flex items-center gap-1.5 transition-colors group',
        size === 'sm' ? 'text-xs' : 'text-sm',
        hearted ? 'text-terra-light' : 'text-ivory-dim hover:text-terra-light'
      )}
      aria-label={hearted ? 'Remove heart' : 'Heart this'}
    >
      <svg
        width={size === 'sm' ? 14 : 18}
        height={size === 'sm' ? 14 : 18}
        viewBox="0 0 24 24"
        fill={hearted ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn('transition-transform', hearted && 'scale-110')}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {showCount && (
        <span className="font-mono">{formatCount(count)}</span>
      )}
    </button>
  )
}
