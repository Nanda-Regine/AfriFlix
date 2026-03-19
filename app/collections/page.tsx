import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { timeAgo } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'My Collections · AfriFlix',
}

interface Collection {
  id: string
  title: string
  description: string | null
  is_public: boolean
  work_count: number
  created_at: string
  cover_url: string | null
}

export default async function CollectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('collections')
    .select('id, title, description, is_public, work_count, created_at, cover_url')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const collections = (data as Collection[]) ?? []

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-mono text-gold uppercase tracking-wider mb-2">Your Library</p>
            <h1 className="font-syne font-bold text-3xl text-ivory">Collections</h1>
          </div>
        </div>

        {collections.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🔖</p>
            <p className="font-syne text-xl text-ivory mb-2">No collections yet</p>
            <p className="text-ivory-dim text-sm max-w-md mx-auto mb-6">
              Save works to collections as you browse. Hit the bookmark icon on any work to get started.
            </p>
            <Link
              href="/explore"
              className="inline-block px-6 py-3 bg-gold text-black font-syne font-semibold rounded-xl hover:bg-gold-light transition-colors"
            >
              Explore Content
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {collections.map(col => (
              <Link key={col.id} href={`/collections/${col.id}`} className="group">
                <div className="bg-black-card border border-white/5 rounded-2xl overflow-hidden hover:border-gold/20 transition-all">
                  {/* Cover / placeholder */}
                  <div className="aspect-video bg-black-mid relative">
                    {col.cover_url ? (
                      <Image src={col.cover_url} alt={col.title} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-terra/10 flex items-center justify-center">
                        <span className="text-5xl font-syne font-bold text-gold/20">
                          {col.title[0]}
                        </span>
                      </div>
                    )}
                    {!col.is_public && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 bg-black/70 rounded-full text-[10px] font-mono text-ivory-dim">
                        Private
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-syne font-semibold text-ivory group-hover:text-gold transition-colors mb-1 line-clamp-1">
                      {col.title}
                    </p>
                    {col.description && (
                      <p className="text-xs text-ivory-dim line-clamp-2 mb-2">{col.description}</p>
                    )}
                    <p className="text-[11px] font-mono text-ivory-dim">
                      {col.work_count} work{col.work_count !== 1 ? 's' : ''} · {timeAgo(col.created_at)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
