'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * useRealtimeCount — subscribes to a Supabase table via Realtime and keeps
 * a count in sync with live INSERT/DELETE events.
 *
 * Usage:
 *   const heartCount = useRealtimeCount('hearts', 'work_id', workId, initialCount)
 *   const followerCount = useRealtimeCount('follows', 'following_creator_id', creatorId, initial)
 */
export function useRealtimeCount(
  table: string,
  filterColumn: string,
  filterValue: string,
  initialCount: number
): number {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`${table}_${filterColumn}_${filterValue}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table,
          filter: `${filterColumn}=eq.${filterValue}`,
        },
        () => setCount(c => c + 1)
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table,
          filter: `${filterColumn}=eq.${filterValue}`,
        },
        () => setCount(c => Math.max(0, c - 1))
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [table, filterColumn, filterValue])

  return count
}
