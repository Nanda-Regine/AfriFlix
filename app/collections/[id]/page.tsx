import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BrowseRow } from '@/components/cards/browse-row'
import type { Collection, Work, Creator } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

async function getCollection(id: string) {
  const supabase = await createClient()

  const { data: collection } = await supabase
    .from('collections')
    .select('*, owner:auth.users(email)')
    .eq('id', id)
    .eq('is_public', true)
    .single()

  if (!collection) return null

  const { data: collectionWorks } = await supabase
    .from('collection_works')
    .select('work_id, position')
    .eq('collection_id', id)
    .order('position', { ascending: true })
    .limit(50)

  const workIds = ((collectionWorks ?? []) as { work_id: string }[]).map(cw => cw.work_id)
  if (workIds.length === 0) return { collection: collection as Collection, works: [], creator: null }

  const { data: works } = await supabase
    .from('works')
    .select('*, creator:creators(display_name, username, avatar_url)')
    .in('id', workIds)
    .eq('status', 'published')

  const workMap = new Map<string, Work>()
  for (const w of (works as Work[]) ?? []) {
    workMap.set(w.id, w)
  }
  const orderedWorks = workIds.map(id => workMap.get(id)).filter(Boolean) as Work[]

  return { collection: collection as Collection, works: orderedWorks, creator: null }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const data = await getCollection(id)
  if (!data) return { title: 'Collection Not Found' }

  const { collection } = data
  return {
    title: `${collection.title} | AfriFlix`,
    description: collection.description ?? `A curated AfriFlix collection of African creative works.`,
    openGraph: {
      title: collection.title,
      description: collection.description ?? 'Curated African creative content',
      images: collection.cover_url ? [collection.cover_url] : undefined,
    },
  }
}

export default async function CollectionPage({ params }: Props) {
  const { id } = await params
  const data = await getCollection(id)
  if (!data) notFound()

  const { collection, works } = data

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          {collection.category_filter && (
            <p className="text-xs font-mono text-gold uppercase tracking-wider mb-2 capitalize">
              {collection.category_filter.replace('_', ' ')} Collection
            </p>
          )}
          <h1 className="font-syne font-bold text-4xl sm:text-5xl text-ivory mb-3">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="text-ivory-dim text-lg max-w-2xl">{collection.description}</p>
          )}
          <p className="text-xs text-ivory-dim mt-3 font-mono">
            {works.length} work{works.length !== 1 ? 's' : ''}
            {!collection.is_public && ' · Private'}
          </p>
        </div>

        {/* Works */}
        {works.length === 0 ? (
          <div className="text-center py-24 border border-white/5 rounded-2xl bg-black-card">
            <p className="text-4xl mb-4">📁</p>
            <p className="font-syne text-ivory mb-2">This collection is empty</p>
            <p className="text-ivory-dim text-sm">Works will appear here as they're added.</p>
          </div>
        ) : (
          <>
            <BrowseRow title="In This Collection" works={works} />

            {/* Category breakdown if mixed */}
            {!collection.category_filter && (
              <div className="mt-12">
                {Array.from(new Set(works.map(w => w.category))).map(cat => {
                  const catWorks = works.filter(w => w.category === cat)
                  if (catWorks.length < 2) return null
                  return (
                    <BrowseRow
                      key={cat}
                      title={cat.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      works={catWorks}
                    />
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Share */}
        <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-ivory-dim">Share this collection</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="text-xs px-3 py-1.5 rounded border border-white/10 text-ivory-dim hover:text-ivory hover:border-white/20 transition-colors"
            >
              Copy link
            </button>
            <Link
              href="/explore"
              className="text-xs px-3 py-1.5 rounded border border-gold/20 text-gold hover:bg-gold/10 transition-colors"
            >
              Discover more
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
