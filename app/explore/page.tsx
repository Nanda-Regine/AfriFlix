import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { WorkCard } from '@/components/cards/work-card'
import { CreatorCard } from '@/components/cards/creator-card'
import { WorkCardSkeleton } from '@/components/ui/shimmer'
import { Badge } from '@/components/ui/badge'
import { CATEGORY_META, MOOD_CONFIG } from '@/types'
import type { Work, Creator, ContentCategory } from '@/types'

interface SearchParams { category?: string; mood?: string; country?: string; genre?: string }

async function getWorks(filters: SearchParams): Promise<Work[]> {
  const supabase = await createClient()
  let query = supabase
    .from('works')
    .select('*, creator:creators(display_name, username, avatar_url)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(24)

  if (filters.category) query = query.eq('category', filters.category)
  if (filters.mood) query = query.contains('mood_tags', [filters.mood])
  if (filters.country) query = query.eq('country_of_origin', filters.country)
  if (filters.genre) query = query.contains('genres', [filters.genre])

  const { data } = await query
  return (data as Work[]) ?? []
}

async function getRisingCreators(): Promise<Creator[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('creators')
    .select('*')
    .eq('is_rising', true)
    .order('follower_count', { ascending: false })
    .limit(6)
  return (data as Creator[]) ?? []
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const filters = await searchParams
  const [works, risingCreators] = await Promise.all([
    getWorks(filters),
    getRisingCreators(),
  ])

  const activeCategory = filters.category as ContentCategory | undefined
  const activeMood = filters.mood
  const hasFilters = activeCategory || activeMood || filters.country

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-mono text-gold uppercase tracking-wider mb-2">Discovery Hub</p>
          <h1 className="font-syne font-bold text-4xl text-ivory">Browse AfriFlix</h1>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link href="/explore">
            <Badge variant={!activeCategory ? 'gold' : 'dark'}>All</Badge>
          </Link>
          {Object.entries(CATEGORY_META).map(([cat, meta]) => (
            <Link
              key={cat}
              href={`/explore?category=${cat}`}
            >
              <Badge variant={activeCategory === cat ? 'gold' : 'dark'}>
                {meta.label}
              </Badge>
            </Link>
          ))}
        </div>

        {/* Mood filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {Object.entries(MOOD_CONFIG).map(([mood, cfg]) => (
            <Link key={mood} href={`/explore?${activeCategory ? `category=${activeCategory}&` : ''}mood=${mood}`} prefetch={false}>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-syne border transition-all"
                style={activeMood === mood ? {
                  background: cfg.bg,
                  borderColor: cfg.border,
                  color: cfg.text,
                } : {
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: '#C8BFA8',
                }}
              >
                {cfg.emoji} {cfg.label}
              </button>
            </Link>
          ))}
          {hasFilters && (
            <Link href="/explore">
              <button className="px-3 py-1.5 rounded-pill text-xs font-syne border border-white/10 text-ivory-dim hover:text-ivory transition-colors">
                Clear filters
              </button>
            </Link>
          )}
        </div>

        {/* Rising creators strip */}
        {risingCreators.length > 0 && !hasFilters && (
          <div className="mb-12">
            <h2 className="font-syne font-semibold text-ivory mb-4">Rising Creators</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {risingCreators.map(creator => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          </div>
        )}

        {/* Works grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-syne font-semibold text-ivory">
              {activeCategory ? CATEGORY_META[activeCategory]?.label : 'All Content'}
              {activeMood && <span className="text-gold ml-2">· {MOOD_CONFIG[activeMood]?.emoji} {MOOD_CONFIG[activeMood]?.label}</span>}
            </h2>
            <span className="text-sm text-ivory-dim font-mono">{works.length} results</span>
          </div>

          {works.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-4xl mb-4">🌍</p>
              <p className="font-syne text-ivory mb-2">No content found</p>
              <p className="text-ivory-dim text-sm">Try different filters or come back soon as creators upload more.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {works.map((work, i) => (
                <WorkCard key={work.id} work={work} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
