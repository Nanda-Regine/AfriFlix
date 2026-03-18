import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { BrowseRow } from '@/components/cards/browse-row'
import { slugToCategory, categoryToSlug } from '@/lib/utils'
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

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = slugToCategory(params.slug)
  const meta = CATEGORY_META[category]
  if (!meta) return {}
  return {
    title: meta.label,
    description: `${meta.description} — African creators on AfriFlix`,
  }
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = slugToCategory(params.slug)
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
