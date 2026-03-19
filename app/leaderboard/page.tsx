import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { formatCount } from '@/lib/utils'
import { CATEGORY_META } from '@/types'
import type { Creator, ContentCategory } from '@/types'

export const metadata: Metadata = {
  title: 'Creator Leaderboard · AfriFlix',
  description: 'Top African creators on AfriFlix ranked by views, hearts, and followers.',
}

export const revalidate = 3600 // refresh hourly

type LeaderboardPeriod = 'all' | 'month' | 'week'

interface Props {
  searchParams: Promise<{ by?: string; category?: string }>
}

async function getLeaderboard(by: string, category?: string): Promise<Creator[]> {
  const supabase = await createClient()
  let query = supabase
    .from('creators')
    .select('*')
    .eq('african_verified', true)
    .limit(50)

  if (category) query = query.contains('categories', [category])

  const orderCol = by === 'hearts' ? 'total_hearts' : by === 'views' ? 'total_views' : 'follower_count'
  query = query.order(orderCol, { ascending: false })

  const { data } = await query
  return (data as Creator[]) ?? []
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const params = await searchParams
  const by = params.by ?? 'followers'
  const category = params.category as ContentCategory | undefined

  const creators = await getLeaderboard(by, category)

  const tabs = [
    { key: 'followers', label: 'Followers' },
    { key: 'views', label: 'Views' },
    { key: 'hearts', label: 'Hearts' },
  ]

  const statValue = (c: Creator) => {
    if (by === 'hearts') return formatCount(c.total_hearts)
    if (by === 'views') return formatCount(c.total_views)
    return formatCount(c.follower_count)
  }

  const statLabel = by === 'hearts' ? 'hearts' : by === 'views' ? 'views' : 'followers'

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-xs font-mono text-gold uppercase tracking-wider mb-3">Hall of Fame</p>
          <h1 className="font-syne font-extrabold text-4xl sm:text-5xl text-ivory mb-3">
            Creator Leaderboard
          </h1>
          <p className="text-ivory-dim">Top African creators on AfriFlix</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-3 mb-4 justify-center">
          {tabs.map(tab => (
            <Link
              key={tab.key}
              href={`/leaderboard?by=${tab.key}${category ? `&category=${category}` : ''}`}
              className={`px-5 py-2 rounded-pill text-sm font-syne transition-all ${
                by === tab.key
                  ? 'bg-gold text-black font-semibold'
                  : 'border border-white/10 text-ivory-dim hover:text-ivory hover:border-white/20'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <Link
            href={`/leaderboard?by=${by}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-syne transition-all ${
              !category ? 'bg-gold/20 border border-gold/40 text-gold' : 'border border-white/5 text-ivory-dim hover:border-white/15'
            }`}
          >
            All
          </Link>
          {Object.entries(CATEGORY_META).map(([cat, meta]) => (
            <Link
              key={cat}
              href={`/leaderboard?by=${by}&category=${cat}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-syne transition-all ${
                category === cat ? 'bg-gold/20 border border-gold/40 text-gold' : 'border border-white/5 text-ivory-dim hover:border-white/15'
              }`}
            >
              {meta.label}
            </Link>
          ))}
        </div>

        {/* Leaderboard */}
        {creators.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🌍</p>
            <p className="text-ivory font-syne">No creators yet in this category</p>
          </div>
        ) : (
          <div className="space-y-3">
            {creators.map((creator, i) => {
              const rank = i + 1
              const isMedal = rank <= 3

              return (
                <Link key={creator.id} href={`/creator/${creator.username}`} className="group block">
                  <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    isMedal
                      ? 'border-gold/20 bg-gold/5 hover:border-gold/40 hover:bg-gold/10'
                      : 'border-white/5 bg-black-card hover:border-white/15 hover:bg-black-hover'
                  }`}>
                    {/* Rank */}
                    <div className={`w-10 flex-shrink-0 text-center font-syne font-bold ${
                      rank === 1 ? 'text-2xl' : rank === 2 ? 'text-xl' : rank === 3 ? 'text-lg' : 'text-sm text-ivory-dim'
                    }`}>
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                    </div>

                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gold/20 overflow-hidden flex-shrink-0">
                      {creator.avatar_url ? (
                        <Image
                          src={creator.avatar_url}
                          alt={creator.display_name}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-syne font-bold text-gold">
                          {creator.display_name[0]}
                        </div>
                      )}
                    </div>

                    {/* Name + info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-syne font-semibold text-ivory group-hover:text-gold transition-colors">
                          {creator.display_name}
                        </span>
                        {creator.african_verified && (
                          <Badge variant="gold" className="text-[10px] py-0 px-1.5">✓</Badge>
                        )}
                        {creator.is_rising && (
                          <Badge variant="terra" className="text-[10px] py-0 px-1.5">Rising</Badge>
                        )}
                      </div>
                      <p className="text-xs text-ivory-dim mt-0.5">
                        @{creator.username} · {creator.country}
                      </p>
                      {creator.categories.length > 0 && (
                        <p className="text-[11px] text-ivory-dim/60 mt-0.5">
                          {creator.categories.slice(0, 2).map(c => CATEGORY_META[c as ContentCategory]?.label ?? c).join(' · ')}
                        </p>
                      )}
                    </div>

                    {/* Stat */}
                    <div className="text-right flex-shrink-0">
                      <p className={`font-syne font-bold text-xl ${isMedal ? 'text-gold' : 'text-ivory'}`}>
                        {statValue(creator)}
                      </p>
                      <p className="text-xs text-ivory-dim font-mono">{statLabel}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
