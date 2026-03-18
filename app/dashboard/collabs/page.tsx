import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CollabsManager } from './collabs-manager'
import { Button } from '@/components/ui/button'
import type { Collab, CollabApplication } from '@/types'

export const metadata: Metadata = {
  title: 'My Collabs | Creator Hub',
  description: 'Manage your collab listings and review applications.',
  robots: { index: false },
}

async function getCollabsWithApplications(
  creatorId: string
): Promise<(Collab & { applications: CollabApplication[] })[]> {
  const supabase = await createClient()

  const { data: collabs } = await supabase
    .from('collabs')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!collabs || collabs.length === 0) return []

  const collabIds = (collabs as Collab[]).map(c => c.id)

  const { data: applications } = await supabase
    .from('collab_applications')
    .select('*, applicant:creators(display_name, username, avatar_url, categories)')
    .in('collab_id', collabIds)
    .order('created_at', { ascending: false })

  const appMap = new Map<string, CollabApplication[]>()
  for (const app of (applications as CollabApplication[]) ?? []) {
    const list = appMap.get(app.collab_id) ?? []
    list.push(app)
    appMap.set(app.collab_id, list)
  }

  return (collabs as Collab[]).map(c => ({
    ...c,
    applications: appMap.get(c.id) ?? [],
  }))
}

export default async function DashboardCollabsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/collabs')

  const { data: creator } = await supabase
    .from('creators')
    .select('id, display_name')
    .eq('user_id', user.id)
    .single()

  if (!creator) redirect('/dashboard')

  const collabs = await getCollabsWithApplications(creator.id)
  const openCount = collabs.filter(c => c.status === 'open').length

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-syne font-bold text-2xl text-ivory">My Collabs</h1>
          <p className="text-ivory-dim mt-0.5 text-sm">
            {openCount} open listing{openCount !== 1 ? 's' : ''} · {collabs.length} total
          </p>
        </div>
        <Link href="/dashboard/collabs/new">
          <Button variant="gold">Post a Listing</Button>
        </Link>
      </div>

      {collabs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-white/5 rounded-2xl bg-black-card">
          <p className="text-5xl mb-4">🤝</p>
          <p className="font-syne font-semibold text-ivory mb-2">No collab listings yet</p>
          <p className="text-ivory-dim text-sm mb-6 max-w-sm">
            Post a collab, commission, gig, casting call, or mentorship offer — and let Africa's
            creative talent find you.
          </p>
          <Link href="/dashboard/collabs/new">
            <Button variant="gold">Post Your First Listing</Button>
          </Link>
        </div>
      ) : (
        <CollabsManager collabs={collabs} />
      )}
    </div>
  )
}
