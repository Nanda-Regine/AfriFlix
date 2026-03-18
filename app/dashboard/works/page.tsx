import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { WorksManager } from './works-manager'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Work, ContentCategory, WorkStatus } from '@/types'

export const metadata: Metadata = {
  title: 'My Works | Creator Hub',
  description: 'Manage all your uploaded works on AfriFlix.',
  robots: { index: false },
}

const STATUS_TABS: { value: WorkStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
  { value: 'scheduled', label: 'Scheduled' },
]

async function getWorks(creatorId: string, status?: string, category?: string): Promise<Work[]> {
  const supabase = await createClient()

  let query = supabase
    .from('works')
    .select('id, title, category, status, view_count, heart_count, comment_count, published_at, scheduled_at, created_at, cover_art_url, video_thumbnail, is_featured, is_trending')
    .eq('creator_id', creatorId)
    .neq('status', 'removed')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status && status !== 'all') query = query.eq('status', status as WorkStatus)
  if (category) query = query.eq('category', category)

  const { data } = await query
  return (data as Work[]) ?? []
}

export default async function WorksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: ContentCategory }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/works')

  const { data: creator } = await supabase
    .from('creators')
    .select('id, display_name, works_count')
    .eq('user_id', user.id)
    .single()

  if (!creator) redirect('/dashboard')

  const works = await getWorks(creator.id, params.status, params.category)

  const buildHref = (status: string, category?: string) => {
    const p = new URLSearchParams()
    if (status !== 'all') p.set('status', status)
    if (category) p.set('category', category)
    const qs = p.toString()
    return `/dashboard/works${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-syne font-bold text-2xl text-ivory">My Works</h1>
          <p className="text-ivory-dim mt-0.5 text-sm">
            {works.length} work{works.length !== 1 ? 's' : ''}
            {params.status && params.status !== 'all' ? ` · ${params.status}` : ''}
          </p>
        </div>
        <Link href="/dashboard/upload">
          <Button variant="gold">Upload New Work</Button>
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_TABS.map(tab => {
          const active = (!params.status && tab.value === 'all') || params.status === tab.value
          return (
            <Link key={tab.value} href={buildHref(tab.value, params.category)}>
              <Badge variant={active ? 'gold' : 'dark'}>{tab.label}</Badge>
            </Link>
          )
        })}
      </div>

      {works.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-white/5 rounded-2xl bg-black-card">
          <p className="text-5xl mb-4">🎬</p>
          <p className="font-syne font-semibold text-ivory mb-2">
            {params.status && params.status !== 'all' ? `No ${params.status} works` : 'No works yet'}
          </p>
          <p className="text-ivory-dim text-sm mb-6">
            {params.status === 'draft'
              ? 'Works saved as drafts will appear here.'
              : 'Start uploading your creative work to share with the world.'}
          </p>
          <Link href="/dashboard/upload">
            <Button variant="gold">Upload Your First Work</Button>
          </Link>
        </div>
      ) : (
        <WorksManager works={works} />
      )}
    </div>
  )
}
