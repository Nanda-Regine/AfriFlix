import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { getLiveInput } from '@/lib/cloudflare'
import { Comments } from '@/components/community/comments'

interface LiveStreamRow {
  id: string
  title: string
  description: string | null
  category: string | null
  cloudflare_live_uid: string
  status: string
  viewer_count: number
  creator: {
    display_name: string
    username: string
    avatar_url: string | null
  }
}

async function getStream(id: string): Promise<LiveStreamRow | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('live_streams')
    .select('*, creator:creators(display_name, username, avatar_url)')
    .eq('id', id)
    .in('status', ['live', 'idle'])
    .single()
  return data as LiveStreamRow | null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const stream = await getStream(id)
  if (!stream) return {}
  return {
    title: `${stream.title} — Live on AfriFlix`,
    description: stream.description ?? `Watch ${stream.creator.display_name} live on AfriFlix`,
  }
}

export default async function LiveStreamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const stream = await getStream(id)
  if (!stream) notFound()

  // Get live status from Cloudflare
  let cfStatus = stream.status
  try {
    const cf = await getLiveInput(stream.cloudflare_live_uid)
    cfStatus = cf.status
  } catch {
    // Keep DB status as fallback
  }

  const isLive   = cfStatus === 'live' || cfStatus === 'connected'
  const cfAccount = process.env.CLOUDFLARE_ACCOUNT_ID ?? ''

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
          {/* Player */}
          <div>
            <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative">
              {isLive && cfAccount ? (
                <iframe
                  src={`https://customer-${cfAccount}.cloudflarestream.com/${stream.cloudflare_live_uid}/iframe?autoplay=true&muted=true`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-black-card">
                  <p className="text-5xl mb-4">📡</p>
                  <p className="font-syne font-semibold text-ivory mb-2">Stream not live yet</p>
                  <p className="text-ivory-dim text-sm">The creator will go live soon. Refresh to check.</p>
                </div>
              )}
            </div>

            <div className="mt-5">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant={isLive ? 'terra' : 'dark'}>
                  {isLive ? '● LIVE' : 'Offline'}
                </Badge>
                {stream.category && (
                  <Badge variant="dark" className="capitalize">{stream.category.replace('_', ' ')}</Badge>
                )}
              </div>
              <h1 className="font-syne font-bold text-2xl text-ivory mb-1">{stream.title}</h1>
              {stream.description && (
                <p className="text-ivory-dim text-sm mt-2">{stream.description}</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            <div className="bg-black-card border border-white/5 rounded-xl p-5">
              <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-3">Creator</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center font-syne font-bold text-gold">
                  {stream.creator.display_name[0]}
                </div>
                <div>
                  <p className="font-syne font-semibold text-ivory">{stream.creator.display_name}</p>
                  <p className="text-xs text-ivory-dim">@{stream.creator.username}</p>
                </div>
              </div>
            </div>

            {/* Live chat — reuse Comments component */}
            <div className="bg-black-card border border-white/5 rounded-xl p-5 flex-1">
              <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-3">Live Chat</p>
              <p className="text-xs text-ivory-dim">(Comments during stream)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
