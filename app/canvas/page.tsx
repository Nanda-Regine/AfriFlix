import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CanvasFeed } from '@/components/canvas/canvas-feed'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Canvas — Discover African Creativity',
  description: 'Swipe through the best of African film, music, poetry, dance and more on AfriFlix Canvas.',
}

export default async function CanvasPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('works')
    .select('*, creator:creators(id, display_name, username, avatar_url)')
    .eq('status', 'published')
    .order('view_count', { ascending: false })
    .limit(10)

  const works = data ?? []

  if (works.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-black">
        <p className="font-syne font-bold text-2xl text-ivory">Canvas</p>
        <p className="text-ivory-dim text-sm">No works yet. Be the first to upload.</p>
        <Link href="/dashboard/upload" className="px-6 py-2 bg-gold text-black rounded-pill font-syne font-semibold text-sm">
          Upload Now
        </Link>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Back button */}
      <Link
        href="/"
        className="absolute top-4 left-4 z-50 flex items-center gap-2 text-white/60 hover:text-white text-sm font-syne transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15,18 9,12 15,6" />
        </svg>
        AfriFlix
      </Link>

      {/* Canvas label */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
        <span className="font-syne font-bold text-sm text-white/40 tracking-widest uppercase">Canvas</span>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <CanvasFeed initialWorks={works as any} />
    </div>
  )
}
