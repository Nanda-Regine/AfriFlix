import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Work } from '@/types'

interface AudioPlayerState {
  currentWork: Work | null
  queue: Work[]
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isShuffled: boolean
  repeatMode: 'none' | 'one' | 'all'
  isExpanded: boolean

  // Actions
  play: (work: Work, queue?: Work[]) => void
  pause: () => void
  resume: () => void
  togglePlay: () => void
  next: () => void
  previous: () => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  addToQueue: (work: Work) => void
  removeFromQueue: (workId: string) => void
  clearQueue: () => void
  setExpanded: (expanded: boolean) => void
  close: () => void
}

export const useAudioPlayer = create<AudioPlayerState>()(
  persist(
    (set, get) => ({
      currentWork: null,
      queue: [],
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      isMuted: false,
      isShuffled: false,
      repeatMode: 'none',
      isExpanded: false,

      play: (work, queue = []) => {
        set({ currentWork: work, queue, isPlaying: true, currentTime: 0 })
      },

      pause: () => set({ isPlaying: false }),

      resume: () => set({ isPlaying: true }),

      togglePlay: () => set(s => ({ isPlaying: !s.isPlaying })),

      next: () => {
        const { queue, currentWork, isShuffled, repeatMode } = get()
        if (!currentWork) return
        const idx = queue.findIndex(w => w.id === currentWork.id)
        if (repeatMode === 'one') {
          set({ currentTime: 0, isPlaying: true })
          return
        }
        let nextIdx: number
        if (isShuffled) {
          nextIdx = Math.floor(Math.random() * queue.length)
        } else {
          nextIdx = idx + 1
        }
        if (nextIdx >= queue.length) {
          if (repeatMode === 'all') nextIdx = 0
          else { set({ isPlaying: false }); return }
        }
        set({ currentWork: queue[nextIdx], currentTime: 0, isPlaying: true })
      },

      previous: () => {
        const { queue, currentWork, currentTime } = get()
        if (!currentWork) return
        if (currentTime > 3) { set({ currentTime: 0 }); return }
        const idx = queue.findIndex(w => w.id === currentWork.id)
        const prevIdx = Math.max(0, idx - 1)
        set({ currentWork: queue[prevIdx], currentTime: 0, isPlaying: true })
      },

      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      setVolume: (volume) => set({ volume, isMuted: false }),
      toggleMute: () => set(s => ({ isMuted: !s.isMuted })),
      toggleShuffle: () => set(s => ({ isShuffled: !s.isShuffled })),
      cycleRepeat: () => set(s => ({
        repeatMode: s.repeatMode === 'none' ? 'all' : s.repeatMode === 'all' ? 'one' : 'none'
      })),

      addToQueue: (work) => set(s => ({ queue: [...s.queue, work] })),
      removeFromQueue: (workId) => set(s => ({ queue: s.queue.filter(w => w.id !== workId) })),
      clearQueue: () => set({ queue: [] }),
      setExpanded: (expanded) => set({ isExpanded: expanded }),
      close: () => set({ currentWork: null, isPlaying: false, queue: [], currentTime: 0 }),
    }),
    {
      name: 'afriflix-audio-player',
      partialize: (state) => ({
        volume: state.volume,
        isMuted: state.isMuted,
        isShuffled: state.isShuffled,
        repeatMode: state.repeatMode,
        queue: state.queue,
      }),
    }
  )
)
