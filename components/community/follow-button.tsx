'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface FollowButtonProps {
  creatorId: string
  initialFollowing?: boolean
  initialCount?: number
  className?: string
}

export function FollowButton({ creatorId, initialFollowing = false, initialCount = 0, className }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [hovered, setHovered] = useState(false)

  async function toggle() {
    if (loading) return
    setFollowing(f => !f)
    setCount(c => following ? c - 1 : c + 1)
    setLoading(true)

    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_id: creatorId }),
      })
      if (res.ok) {
        const data = await res.json()
        setFollowing(data.following)
        setCount(data.count)
      } else if (res.status === 401) {
        setFollowing(f => !f)
        setCount(c => following ? c + 1 : c - 1)
        // Could redirect to login here
      }
    } catch {
      setFollowing(f => !f)
      setCount(c => following ? c + 1 : c - 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'px-5 py-2 rounded-pill text-sm font-syne font-semibold transition-all',
        following
          ? hovered
            ? 'bg-transparent border border-red-500/40 text-red-400'
            : 'bg-gold/10 border border-gold/30 text-gold'
          : 'bg-gold text-black hover:bg-gold-light',
        className
      )}
    >
      {following ? (hovered ? 'Unfollow' : 'Following') : 'Follow'}
    </button>
  )
}
