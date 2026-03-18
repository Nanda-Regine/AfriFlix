import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { formatCount, formatDuration } from '@/lib/utils'
import { CATEGORY_META } from '@/types'
import type { Series, Work } from '@/types'
import { SeriesEpisodeList } from './episode-list'

async function getSeries(id: string): Promise<Series | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('series')
    .select('*, creator:creators(*)')
    .eq('id', id)
    .single()
  return data as Series | null
}

async function getEpisodes(seriesId: string): Promise<Work[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('works')
    .select('*, creator:creators(display_name, username, avatar_url)')
    .eq('series_id', seriesId)
    .eq('status', 'published')
    .order('episode_number', { ascending: true })
  return (data as Work[]) ?? []
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const series = await getSeries(params.id)
  if (!series) return {}
  return {
    title: series.title,
    description: series.description ?? undefined,
    openGraph: {
      title: series.title,
      description: series.description ?? undefined,
      images: series.cover_url ? [{ url: series.cover_url }] : [],
    },
  }
}

export default async function SeriesPage({ params }: { params: { id: string } }) {
  const [series, episodes] = await Promise.all([
    getSeries(params.id),
    getEpisodes(params.id),
  ])

  if (!series) notFound()

  const totalViews = episodes.reduce((s, e) => s + e.view_count, 0)
  const totalDuration = episodes.reduce((s, e) => s + (e.video_duration_seconds ?? 0), 0)
  const categoryMeta = series.category ? CATEGORY_META[series.category as keyof typeof CATEGORY_META] : null

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative">
        {/* Banner / cover */}
        <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
          {series.cover_url ? (
            <Image
              src={series.cover_url}
              alt={series.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-black to-terra/20 kente-bg" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
        </div>

        {/* Content over banner */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 pb-8 max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2 mb-3">
            {categoryMeta && <Badge variant="dark">{categoryMeta.label}</Badge>}
            <Badge
              variant={series.status === 'ongoing' ? 'gold' : series.status === 'completed' ? 'dark' : 'terra'}
            >
              {series.status}
            </Badge>
          </div>

          <h1 className="font-syne font-extrabold text-3xl sm:text-4xl lg:text-5xl text-ivory mb-3 drop-shadow-lg">
            {series.title}
          </h1>

          {series.description && (
            <p className="text-ivory-mid max-w-2xl text-base leading-relaxed line-clamp-2 drop-shadow">
              {series.description}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          {/* Episodes */}
          <div>
            {/* Stats bar */}
            <div className="flex flex-wrap items-center gap-6 py-4 mb-6 border-b border-white/10 text-sm font-mono text-ivory-dim">
              <span>{episodes.length} episode{episodes.length !== 1 ? 's' : ''}</span>
              {series.season_count > 1 && <span>{series.season_count} seasons</span>}
              {totalViews > 0 && <span>{formatCount(totalViews)} total views</span>}
              {totalDuration > 0 && <span>{formatDuration(totalDuration)} total runtime</span>}
            </div>

            {/* Episode list (client component for active episode state) */}
            {episodes.length > 0 ? (
              <SeriesEpisodeList episodes={episodes} />
            ) : (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">🎬</p>
                <p className="font-syne text-ivory mb-2">No episodes yet</p>
                <p className="text-ivory-dim text-sm">The creator is still uploading episodes. Check back soon.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Creator card */}
            {series.creator && (
              <div className="bg-black-card border border-white/5 rounded-xl p-5">
                <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-4">Created by</p>
                <Link
                  href={`/creator/${series.creator.username}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-12 h-12 rounded-full bg-gold/20 overflow-hidden flex-shrink-0">
                    {series.creator.avatar_url ? (
                      <Image
                        src={series.creator.avatar_url}
                        alt={series.creator.display_name}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-syne font-bold text-gold">
                        {series.creator.display_name[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-syne font-semibold text-ivory group-hover:text-gold transition-colors">
                      {series.creator.display_name}
                    </p>
                    <p className="text-xs text-ivory-dim">@{series.creator.username}</p>
                  </div>
                </Link>

                {series.creator.bio && (
                  <p className="text-sm text-ivory-dim mt-3 leading-relaxed line-clamp-3">
                    {series.creator.bio}
                  </p>
                )}

                <div className="flex gap-3 mt-4">
                  <Link
                    href={`/creator/${series.creator.username}`}
                    className="flex-1 text-center py-2 border border-white/10 rounded-lg text-sm text-ivory-mid hover:text-ivory hover:border-gold/30 transition-colors font-syne"
                  >
                    View Profile
                  </Link>
                  {series.creator.tips_enabled && (
                    <button className="flex-1 py-2 bg-gold/20 border border-gold/30 rounded-lg text-sm text-gold hover:bg-gold/30 transition-colors font-syne">
                      Tip Creator
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Series details */}
            <div className="bg-black-card border border-white/5 rounded-xl p-5">
              <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-4">Series Info</p>
              <dl className="flex flex-col gap-3 text-sm">
                {series.season_count > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-ivory-dim">Seasons</dt>
                    <dd className="text-ivory font-mono">{series.season_count}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-ivory-dim">Episodes</dt>
                  <dd className="text-ivory font-mono">{episodes.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ivory-dim">Status</dt>
                  <dd className="text-ivory capitalize">{series.status}</dd>
                </div>
                {categoryMeta && (
                  <div className="flex justify-between">
                    <dt className="text-ivory-dim">Category</dt>
                    <dd className="text-ivory">{categoryMeta.label}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
