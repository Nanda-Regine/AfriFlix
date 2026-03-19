import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { BrowseRow } from '@/components/cards/browse-row'
import { slugToCategory } from '@/lib/utils'
import { CATEGORY_META } from '@/types'
import type { Work, ContentCategory } from '@/types'

const CATEGORY_EMOJIS: Record<ContentCategory, string> = {
  film: '🎬', music: '🎵', dance: '💃', writing: '✍️',
  poetry: '🎤', comedy: '😂', theatre: '🎭', visual_art: '🎨',
}

async function getCategoryWorks(category: ContentCategory): Promise<{
  featured: Work[]
  trending: Work[]
  recent: Work[]
}> {
  const supabase = await createClient()
  const base = supabase
    .from('works')
    .select('*, creator:creators(display_name, username, avatar_url)')
    .eq('status', 'published')
    .eq('category', category)

  const [featured, trending, recent] = await Promise.all([
    base.eq('is_featured', true).order('heart_count', { ascending: false }).limit(6),
    base.eq('is_trending', true).order('view_count', { ascending: false }).limit(6),
    base.order('published_at', { ascending: false }).limit(8),
  ])

  return {
    featured: (featured.data as Work[]) ?? [],
    trending: (trending.data as Work[]) ?? [],
    recent: (recent.data as Work[]) ?? [],
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const category = slugToCategory(slug)
  const meta = CATEGORY_META[category]
  if (!meta) return {}
  return {
    title: meta.label,
    description: `${meta.description} — African creators on AfriFlix`,
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = slugToCategory(slug)
  const meta = CATEGORY_META[category]
  if (!meta) notFound()

  const { featured, trending, recent } = await getCategoryWorks(category)

  return (
    <div className="min-h-screen pt-20">
      {/* Category hero */}
      <div className="px-4 sm:px-6 py-12 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-5xl mb-4">{CATEGORY_EMOJIS[category]}</div>
          <h1 className="font-syne font-extrabold text-4xl sm:text-5xl text-ivory mb-3">
            {meta.label}
          </h1>
          <p className="text-ivory-mid text-lg">{meta.description}</p>
        </div>
      </div>

      <div className="py-8">
        {featured.length > 0 && (
          <BrowseRow
            title={`Featured ${meta.label}`}
            works={featured}
            badge={() => ({ text: 'Featured', variant: 'gold' })}
          />
        )}

        {trending.length > 0 && (
          <BrowseRow
            title="Trending Now"
            works={trending}
            badge={(_, i) => i === 0 ? { text: 'Hot', variant: 'terra' } : undefined}
          />
        )}

        {recent.length > 0 && (
          <BrowseRow title="Recently Added" works={recent} />
        )}

        {/* Visual Art masonry gallery */}
        {category === 'visual_art' && recent.length > 0 && (
          <div className="px-4 sm:px-6 mb-12">
            <div className="max-w-7xl mx-auto">
              <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-4">Gallery</p>
              <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
                {recent.map(work => (
                  <Link
                    key={work.id}
                    href={`/work/${work.id}`}
                    className="block break-inside-avoid rounded-xl overflow-hidden border border-white/5 hover:border-gold/30 transition-all group relative"
                  >
                    {(work.cover_art_url || work.video_thumbnail) ? (
                      <Image
                        src={(work.cover_art_url || work.video_thumbnail)!}
                        alt={work.title}
                        width={400}
                        height={600}
                        className="w-full object-cover"
                      />
                    ) : (
                      <div className="aspect-square bg-gradient-to-br from-gold/10 to-terra/10 flex items-center justify-center">
                        <span className="text-3xl font-syne font-bold text-gold/30">{work.title[0]}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      <p className="font-syne font-semibold text-sm text-ivory line-clamp-1">{work.title}</p>
                      {work.creator && (
                        <p className="text-xs text-ivory-dim">{work.creator.display_name}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {featured.length === 0 && trending.length === 0 && recent.length === 0 && (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">{CATEGORY_EMOJIS[category]}</p>
            <p className="font-syne text-ivory mb-2">Coming Soon</p>
            <p className="text-ivory-dim text-sm max-w-md mx-auto">
              African {meta.label.toLowerCase()} creators are uploading. Check back soon or join as a creator to be the first.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
