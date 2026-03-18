import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { FilmPlayer } from '@/components/players/film-player'
import { WritingReader } from '@/components/players/writing-reader'
import { Badge } from '@/components/ui/badge'
import { WorkCard } from '@/components/cards/work-card'
import { HeartButton } from '@/components/community/heart-button'
import { FollowButton } from '@/components/community/follow-button'
import { Comments } from '@/components/community/comments'
import { formatCount, timeAgo, formatDuration } from '@/lib/utils'
import { CATEGORY_META } from '@/types'
import type { Work } from '@/types'

async function getWork(id: string): Promise<Work | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('works')
    .select('*, creator:creators(*)')
    .eq('id', id)
    .eq('status', 'published')
    .single()
  return data as Work | null
}

async function getRelated(work: Work): Promise<Work[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('works')
    .select('*, creator:creators(display_name, username, avatar_url)')
    .eq('status', 'published')
    .eq('category', work.category)
    .neq('id', work.id)
    .order('view_count', { ascending: false })
    .limit(6)
  return (data as Work[]) ?? []
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const work = await getWork(id)
  if (!work) return {}
  const image = work.video_thumbnail || work.cover_art_url
  const description = work.ai_summary ?? work.description ?? `${work.category} by ${work.creator?.display_name} on AfriFlix`
  return {
    title: work.title,
    description,
    keywords: [work.category, ...(work.genres ?? []), ...(work.theme_tags ?? []), 'African', work.country_of_origin ?? ''].filter(Boolean),
    openGraph: {
      type: 'video.other',
      title: work.title,
      description,
      images: image ? [{ url: image, width: 1280, height: 720, alt: work.title }] : [],
      siteName: 'AfriFlix',
    },
    twitter: {
      card: 'summary_large_image',
      title: work.title,
      description,
      images: image ? [image] : [],
    },
  }
}

export default async function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const work = await getWork(id)
  if (!work) notFound()

  const related = await getRelated(work)
  const meta = work.category ? CATEGORY_META[work.category] : null
  const isVideo = ['film', 'dance', 'comedy', 'theatre'].includes(work.category)
  const isAudio = work.category === 'music'
  const isText = work.category === 'writing'

  const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://afriflix.co.za'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': isVideo ? 'VideoObject' : isAudio ? 'MusicRecording' : 'CreativeWork',
    name: work.title,
    description: work.ai_summary ?? work.description ?? undefined,
    thumbnailUrl: work.video_thumbnail ?? work.cover_art_url ?? undefined,
    uploadDate: work.published_at,
    creator: work.creator ? {
      '@type': 'Person',
      name: work.creator.display_name,
      url: `${BASE}/creator/${work.creator.username}`,
    } : undefined,
    inLanguage: work.languages?.[0] ?? 'en',
    url: `${BASE}/work/${work.id}`,
    countryOfOrigin: work.country_of_origin ?? undefined,
    genre: work.genres?.[0] ?? undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
          {/* Main content */}
          <div>
            {/* Player */}
            {isVideo && <FilmPlayer work={work} />}

            {isAudio && (
              <div className="w-full aspect-square max-w-sm mx-auto bg-gradient-to-br from-gold/20 to-terra/20 rounded-2xl flex items-center justify-center mb-6 shadow-gold">
                {work.cover_art_url ? (
                  <Image src={work.cover_art_url} alt={work.title} width={400} height={400} className="rounded-2xl object-cover" />
                ) : (
                  <span className="text-8xl font-syne font-bold text-gold/20">{work.title[0]}</span>
                )}
              </div>
            )}

            {isText && work.written_content && (
              <WritingReader work={work} />
            )}

            {/* Title & meta */}
            <div className="mt-6">
              <div className="flex flex-wrap gap-2 mb-3">
                {meta && <Badge variant="dark">{meta.label}</Badge>}
                {work.genres.slice(0, 3).map(g => (
                  <Badge key={g} variant="dark">{g}</Badge>
                ))}
                {work.is_trending && <Badge variant="terra">Trending</Badge>}
              </div>

              <h1 className="font-syne font-bold text-3xl text-ivory mb-3">{work.title}</h1>

              {work.ai_summary && (
                <p className="text-ivory-mid text-base leading-relaxed mb-4">{work.ai_summary}</p>
              )}

              {work.description && !work.ai_summary && (
                <p className="text-ivory-mid text-base leading-relaxed mb-4">{work.description}</p>
              )}

              {/* Stats + actions */}
              <div className="flex items-center gap-5 text-sm text-ivory-dim font-mono">
                <span>{formatCount(work.view_count)} views</span>
                <HeartButton workId={work.id} initialCount={work.heart_count} />
                {work.video_duration_seconds && <span>{formatDuration(work.video_duration_seconds)}</span>}
                <span>{timeAgo(work.published_at)}</span>
              </div>
            </div>

            {/* Comments */}
            <Comments workId={work.id} initialCount={work.comment_count} />
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Creator */}
            {work.creator && (
              <div className="bg-black-card border border-white/5 rounded-xl p-5">
                <Link
                  href={`/creator/${work.creator.username}`}
                  className="flex items-center gap-3 mb-4 group"
                >
                  <div className="w-12 h-12 rounded-full bg-gold/20 overflow-hidden flex-shrink-0">
                    {work.creator.avatar_url ? (
                      <Image src={work.creator.avatar_url} alt={work.creator.display_name} width={48} height={48} className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-syne font-bold text-gold">
                        {work.creator.display_name[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-syne font-semibold text-ivory group-hover:text-gold transition-colors">
                      {work.creator.display_name}
                    </p>
                    <p className="text-xs text-ivory-dim">@{work.creator.username}</p>
                  </div>
                </Link>

                {work.creator.bio && (
                  <p className="text-sm text-ivory-dim leading-relaxed mb-4 line-clamp-3">
                    {work.creator.bio}
                  </p>
                )}

                <div className="flex gap-3">
                  <Link
                    href={`/creator/${work.creator.username}`}
                    className="flex-1 text-center py-2 border border-white/10 rounded-lg text-sm text-ivory-mid hover:text-ivory hover:border-gold/30 transition-colors font-syne"
                  >
                    View Profile
                  </Link>
                  <FollowButton creatorId={work.creator.id} className="flex-1" />
                </div>
                {work.creator.tips_enabled && (
                  <button className="w-full mt-2 py-2 bg-gold/20 border border-gold/30 rounded-lg text-sm text-gold hover:bg-gold/30 transition-colors font-syne">
                    Tip Creator
                  </button>
                )}
              </div>
            )}

            {/* Mood & theme tags */}
            {(work.mood_tags.length > 0 || work.theme_tags.length > 0) && (
              <div className="bg-black-card border border-white/5 rounded-xl p-5">
                {work.mood_tags.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-2">Mood</p>
                    <div className="flex flex-wrap gap-2">
                      {work.mood_tags.map(tag => (
                        <Badge key={tag} variant="dark">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {work.theme_tags.length > 0 && (
                  <div>
                    <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-2">Themes</p>
                    <div className="flex flex-wrap gap-2">
                      {work.theme_tags.map(tag => (
                        <Badge key={tag} variant="dark">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related works */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-syne font-semibold text-xl text-ivory mb-6">More like this</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {related.map((w, i) => <WorkCard key={w.id} work={w} index={i} />)}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
