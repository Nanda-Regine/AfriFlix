import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { formatCount } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Live Now · AfriFlix',
  description: 'Watch African creators streaming live — performances, Q&As, studio sessions and more.',
}

export const revalidate = 30 // refresh every 30s

interface LiveStream {
  id: string
  title: string
  description: string | null
  category: string | null
  status: string
  viewer_count: number
  thumbnail_url: string | null
  creator: {
    id: string
    display_name: string
    username: string
    avatar_url: string | null
    country: string
  }
}

async function getLiveStreams(): Promise<LiveStream[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('live_streams')
    .select('*, creator:creators(id, display_name, username, avatar_url, country)')
    .eq('status', 'live')
    .order('viewer_count', { ascending: false })
    .limit(20)
  return (data as LiveStream[]) ?? []
}

async function getUpcoming(): Promise<LiveStream[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('live_streams')
    .select('*, creator:creators(id, display_name, username, avatar_url, country)')
    .eq('status', 'idle')
    .order('created_at', { ascending: false })
    .limit(8)
  return (data as LiveStream[]) ?? []
}

export default async function LivePage() {
  const [live, upcoming] = await Promise.all([getLiveStreams(), getUpcoming()])

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-terra-light animate-pulse" />
            <p className="text-xs font-mono text-terra-light uppercase tracking-wider">Streaming Now</p>
          </div>
          <h1 className="font-syne font-extrabold text-4xl text-ivory">Live on AfriFlix</h1>
          {live.length > 0 && (
            <p className="text-ivory-dim mt-2">{live.length} stream{live.length !== 1 ? 's' : ''} happening now</p>
          )}
        </div>

        {/* Live streams */}
        {live.length === 0 ? (
          <div className="text-center py-20 mb-12">
            <p className="text-5xl mb-4">📡</p>
            <p className="font-syne text-xl text-ivory mb-2">No streams live right now</p>
            <p className="text-ivory-dim text-sm max-w-md mx-auto mb-6">
              Check back soon — creators go live for performances, Q&As, studio sessions and more.
            </p>
            <Link
              href="/dashboard/live"
              className="inline-block px-5 py-2.5 bg-gold text-black font-syne font-semibold rounded-xl hover:bg-gold-light transition-colors text-sm"
            >
              Go Live as Creator
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {live.map(stream => (
              <Link key={stream.id} href={`/live/${stream.id}`} className="group">
                <div className="bg-black-card border border-white/5 rounded-2xl overflow-hidden hover:border-terra/30 transition-all hover:shadow-lg">
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-black-mid">
                    {stream.thumbnail_url ? (
                      <Image
                        src={stream.thumbnail_url}
                        alt={stream.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-terra/20 to-gold/10 flex items-center justify-center">
                        <span className="text-4xl">📡</span>
                      </div>
                    )}
                    {/* LIVE badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-terra rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">Live</span>
                    </div>
                    {/* Viewer count */}
                    {stream.viewer_count > 0 && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 rounded-full">
                        <span className="text-[10px] font-mono text-ivory">{formatCount(stream.viewer_count)} watching</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gold/20 overflow-hidden flex-shrink-0">
                        {stream.creator.avatar_url ? (
                          <Image
                            src={stream.creator.avatar_url}
                            alt={stream.creator.display_name}
                            width={36}
                            height={36}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-syne font-bold text-gold text-sm">
                            {stream.creator.display_name[0]}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-syne font-semibold text-ivory text-sm group-hover:text-gold transition-colors line-clamp-1">
                          {stream.title}
                        </p>
                        <p className="text-xs text-ivory-dim mt-0.5">
                          {stream.creator.display_name} · {stream.creator.country}
                        </p>
                        {stream.category && (
                          <Badge variant="dark" className="mt-2 text-[10px] capitalize">
                            {stream.category.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Upcoming / idle streams */}
        {upcoming.length > 0 && (
          <div>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-5">Starting Soon</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {upcoming.map(stream => (
                <Link key={stream.id} href={`/live/${stream.id}`} className="group">
                  <div className="bg-black-card border border-white/5 rounded-xl overflow-hidden hover:border-white/15 transition-all">
                    <div className="aspect-video bg-black-mid flex items-center justify-center">
                      <span className="text-2xl">📡</span>
                    </div>
                    <div className="p-3">
                      <p className="font-syne font-semibold text-ivory text-xs line-clamp-1 group-hover:text-gold transition-colors">
                        {stream.title}
                      </p>
                      <p className="text-[11px] text-ivory-dim mt-1">{stream.creator.display_name}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
