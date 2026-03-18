import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Creator, TasteProfile } from '@/types'

interface AuthState {
  user: User | null
  creator: Creator | null
  tasteProfile: TasteProfile | null
  isLoading: boolean

  setUser: (user: User | null) => void
  setCreator: (creator: Creator | null) => void
  setTasteProfile: (profile: TasteProfile | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  creator: null,
  tasteProfile: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setCreator: (creator) => set({ creator }),
  setTasteProfile: (tasteProfile) => set({ tasteProfile }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, creator: null, tasteProfile: null, isLoading: false }),
}))
