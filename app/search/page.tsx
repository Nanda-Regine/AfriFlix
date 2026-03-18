import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { WorkCard } from '@/components/cards/work-card'
import { CreatorCard } from '@/components/cards/creator-card'
import type { Work, Creator } from '@/types'

async function search(q: string): Promise<{ works: Work[]; creators: Creator[] }> {
  if (!q.trim()) return { works: [], creators: [] }
  const supabase = await createClient()

  // Use Postgres full-text search (search_vector column from migration 005)
  // Falls back to ilike for short queries or when FTS returns no results
  const ftsQuery = q.trim().split(/\s+/).filter(Boolean).map(w => `${w}:*`).join(' & ')

  const [worksResult, creatorsResult] = await Promise.all([
    supabase
      .from('works')
      .select('*, creator:creators(display_name, username, avatar_url)')
      .eq('status', 'published')
      .textSearch('search_vector', ftsQuery, { type: 'websearch', config: 'english' })
      .order('view_count', { ascending: false })
      .limit(18),
    supabase
      .from('creators')
      .select('*')
      .textSearch('search_vector', ftsQuery, { type: 'websearch', config: 'english' })
      .order('follower_count', { ascending: false })
      .limit(6),
  ])

  // Fallback to ilike if FTS returns nothing (e.g., before migration 005 runs)
  if ((worksResult.data?.length ?? 0) === 0 && (creatorsResult.data?.length ?? 0) === 0) {
    const [wFallback, cFallback] = await Promise.all([
      supabase
        .from('works')
        .select('*, creator:creators(display_name, username, avatar_url)')
        .eq('status', 'published')
        .or(`title.ilike.%${q}%,description.ilike.%${q}%,ai_summary.ilike.%${q}%`)
        .order('view_count', { ascending: false })
        .limit(18),
      supabase
        .from('creators')
        .select('*')
        .or(`display_name.ilike.%${q}%,username.ilike.%${q}%,bio.ilike.%${q}%`)
        .order('follower_count', { ascending: false })
        .limit(6),
    ])
    return {
      works: (wFallback.data as Work[]) ?? [],
      creators: (cFallback.data as Creator[]) ?? [],
    }
  }

  return {
    works: (worksResult.data as Work[]) ?? [],
    creators: (creatorsResult.data as Creator[]) ?? [],
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q ?? ''
  const { works, creators } = await search(query)
  const total = works.length + creators.length

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          {query ? (
            <>
              <p className="text-xs font-mono text-gold uppercase tracking-wider mb-2">Search Results</p>
              <h1 className="font-syne font-bold text-3xl text-ivory">
                "{query}"
                <span className="text-ivory-dim text-xl ml-3 font-normal">{total} results</span>
              </h1>
            </>
          ) : (
            <>
              <h1 className="font-syne font-bold text-4xl text-ivory mb-4">Search AfriFlix</h1>
              <p className="text-ivory-dim">Find African films, music, poetry, creators and more.</p>
            </>
          )}
        </div>

        {!query && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            {['Film', 'Music', 'Poetry', 'Dance', 'Comedy', 'Theatre', 'Writing', 'Visual Art'].map(cat => (
              <Link
                key={cat}
                href={`/search?q=${cat.toLowerCase()}`}
                className="p-4 bg-black-card border border-white/5 rounded-xl hover:border-gold/20 transition-all text-center"
              >
                <p className="font-syne text-ivory-mid hover:text-gold transition-colors">{cat}</p>
              </Link>
            ))}
          </div>
        )}

        {/* Creator results */}
        {creators.length > 0 && (
          <div className="mb-12">
            <h2 className="font-syne font-semibold text-ivory mb-4">Creators</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {creators.map(creator => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          </div>
        )}

        {/* Work results */}
        {works.length > 0 && (
          <div>
            <h2 className="font-syne font-semibold text-ivory mb-4">Content</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {works.map((work, i) => (
                <WorkCard key={work.id} work={work} index={i} />
              ))}
            </div>
          </div>
        )}

        {query && total === 0 && (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-syne text-ivory mb-2">No results for "{query}"</p>
            <p className="text-ivory-dim text-sm">Try different keywords, or browse all content.</p>
            <Link href="/explore" className="inline-block mt-4 text-gold hover:text-gold-light transition-colors text-sm">
              Browse all content →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
