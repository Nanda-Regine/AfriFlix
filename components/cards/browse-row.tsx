'use client'

import { useRef } from 'react'
import { WorkCard } from '@/components/cards/work-card'
import { WorkCardSkeleton } from '@/components/ui/shimmer'
import type { Work } from '@/types'

interface BrowseRowProps {
  title: string
  works: Work[]
  loading?: boolean
  badge?: (work: Work, index: number) => { text: string; variant: 'gold' | 'terra' | 'dark' | 'trophy' } | undefined
}

export function BrowseRow({ title, works, loading, badge }: BrowseRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    if (!rowRef.current) return
    rowRef.current.scrollBy({ left: dir === 'right' ? 600 : -600, behavior: 'smooth' })
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6">
        <h2 className="font-syne font-bold text-xl text-ivory">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full bg-black-card border border-white/10 flex items-center justify-center text-ivory-mid hover:text-ivory hover:border-gold/30 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full bg-black-card border border-white/10 flex items-center justify-center text-ivory-mid hover:text-ivory hover:border-gold/30 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      <div
        ref={rowRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-6 pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <WorkCardSkeleton key={i} />)
          : works.map((work, i) => {
              const b = badge?.(work, i)
              return (
                <WorkCard
                  key={work.id}
                  work={work}
                  index={i}
                  badge={b?.text}
                  badgeVariant={b?.variant}
                />
              )
            })}
      </div>
    </section>
  )
}

function ChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
