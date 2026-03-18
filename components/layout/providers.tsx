'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { MiniPlayer } from '@/components/players/mini-player'

export function Providers({ children }: { children: React.ReactNode }) {
  const { setUser, setCreator, setLoading, reset } = useAuthStore()

  // Register service worker for PWA / offline support
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
      if (user) fetchCreatorProfile(supabase, user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchCreatorProfile(supabase, session.user.id)
      } else {
        reset()
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser, setCreator, setLoading, reset])

  async function fetchCreatorProfile(supabase: ReturnType<typeof createClient>, userId: string) {
    const { data } = await supabase
      .from('creators')
      .select('*')
      .eq('user_id', userId)
      .single()
    setCreator(data)
  }

  return (
    <>
      {children}
      <MiniPlayer />
    </>
  )
}
