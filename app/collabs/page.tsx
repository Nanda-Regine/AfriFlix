import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CollabCard } from '@/components/cards/collab-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Collab, CollabType } from '@/types'

const COLLAB_TYPES: CollabType[] = ['collab', 'commission', 'casting', 'gig', 'mentorship']

async function getCollabs(type?: CollabType): Promise<Collab[]> {
  const supabase = await createClient()
  let query = supabase
    .from('collabs')
    .select('*, creator:creators(display_name, username, avatar_url)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(24)

  if (type) query = query.eq('type', type)

  const { data } = await query
  return (data as Collab[]) ?? []
}

export default async function CollabsPage({
  searchParams,
}: {
  searchParams: { type?: CollabType; location?: string }
}) {
  const collabs = await getCollabs(searchParams.type)

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-mono text-gold uppercase tracking-wider mb-2">Collab Board</p>
            <h1 className="font-syne font-bold text-4xl text-ivory">Find & Post Collabs</h1>
            <p className="text-ivory-dim mt-2">The job market for African creative talent.</p>
          </div>
          <Link href="/dashboard/collabs/new">
            <Button variant="gold">Post a Listing</Button>
          </Link>
        </div>

        {/* Type filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link href="/collabs">
            <Badge variant={!searchParams.type ? 'gold' : 'dark'}>All</Badge>
          </Link>
          {COLLAB_TYPES.map(type => (
            <Link key={type} href={`/collabs?type=${type}`}>
              <Badge variant={searchParams.type === type ? 'gold' : 'dark'}>
                {type[0].toUpperCase() + type.slice(1)}
              </Badge>
            </Link>
          ))}
        </div>

        {/* Grid */}
        {collabs.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">🤝</p>
            <p className="font-syne text-ivory mb-2">No open listings yet</p>
            <p className="text-ivory-dim text-sm">Be the first to post a collab opportunity.</p>
            <div className="mt-6">
              <Link href="/dashboard/collabs/new">
                <Button variant="gold">Post a Listing</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collabs.map(collab => (
              <CollabCard key={collab.id} collab={collab} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
