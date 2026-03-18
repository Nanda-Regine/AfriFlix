'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Comment } from '@/types'

/**
 * useRealtimeComments — subscribes to new comments for a work via Supabase Realtime.
 * New comments appear instantly without page reload.
 */
export function useRealtimeComments(workId: string, initial: Comment[] = []): Comment[] {
  const [comments, setComments] = useState<Comment[]>(initial)

  useEffect(() => {
    setComments(initial)
  }, [workId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`comments_${workId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `work_id=eq.${workId}`,
        },
        (payload) => {
          const newComment = payload.new as Comment
          setComments(prev => {
            if (prev.some(c => c.id === newComment.id)) return prev
            return [...prev, newComment]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `work_id=eq.${workId}`,
        },
        (payload) => {
          setComments(prev => prev.filter(c => c.id !== (payload.old as { id: string }).id))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [workId])

  return comments
}
