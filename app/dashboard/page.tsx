import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { WorkCard } from '@/components/cards/work-card'
import { DashboardQuickNote } from '@/components/dashboard/quick-note'
import { formatCount, formatCurrency } from '@/lib/utils'
import type { Creator, Work } from '@/types'

async function getDashboardData(userId: string) {
  const supabase = await createClient()

  const creatorResult = await supabase.from('creators').select('*').eq('user_id', userId).single()
  const creator = creatorResult.data as Creator | null
  if (!creator) return { creator: null, recentWorks: [], totalEarnings: 0, pendingPayout: 0 }

  const [worksResult, tipsResult, pendingResult] = await Promise.all([
    supabase
      .from('works')
      .select('*')
      .eq('creator_id', creator.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(6),
    supabase
      .from('tips')
      .select('amount')
      .eq('creator_id', creator.id)
      .eq('status', 'completed'),
    supabase
      .from('tips')
      .select('net_amount')
      .eq('creator_id', creator.id)
      .eq('status', 'completed')
      .eq('is_paid', false),
  ])

  const worksWithCreator = ((worksResult.data as Work[]) ?? []).map(w => ({ ...w, creator }))
  const totalEarnings = ((tipsResult.data ?? []) as { amount: number }[]).reduce((sum, t) => sum + t.amount * 0.9, 0)
  const pendingPayout = ((pendingResult.data ?? []) as { net_amount: number | null }[])
    .reduce((sum, t) => sum + (t.net_amount ?? 0), 0)

  return { creator, recentWorks: worksWithCreator, totalEarnings, pendingPayout }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { creator, recentWorks, totalEarnings, pendingPayout } = await getDashboardData(user!.id)

  if (!creator) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-4xl mb-4">🎨</p>
        <h2 className="font-syne font-bold text-2xl text-ivory mb-3">Set up your creator profile</h2>
        <p className="text-ivory-dim mb-6">Join the AfriFlix creator community and start sharing your work.</p>
        <Link href="/dashboard/profile/setup">
          <Button variant="gold">Create Profile</Button>
        </Link>
      </div>
    )
  }

  const stats = [
    { label: 'Total Views', value: formatCount(creator.total_views), icon: '👁️' },
    { label: 'Hearts', value: formatCount(creator.total_hearts), icon: '❤️' },
    { label: 'Followers', value: formatCount(creator.follower_count), icon: '👥' },
    { label: 'All-Time Tips', value: formatCurrency(totalEarnings), icon: '💰' },
    { label: 'Published Works', value: creator.works_count, icon: '🎬' },
  ]

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-syne font-bold text-2xl text-ivory">
            Sawubona, {creator.display_name} 👋
          </h1>
          <p className="text-ivory-dim mt-1">Here's how your content is doing.</p>
        </div>
        <Link href="/dashboard/upload">
          <Button variant="gold">Upload New Work</Button>
        </Link>
      </div>

      {/* Pending payout banner */}
      {pendingPayout >= 50 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-syne font-semibold text-green-400 text-sm">Payout ready — {formatCurrency(pendingPayout)}</p>
            <p className="text-xs text-ivory-dim">Processes on the 1st of next month via your bank account.</p>
          </div>
          <Link href="/dashboard/payouts">
            <Button variant="ghost" size="sm" className="text-green-400 border border-green-500/30 hover:bg-green-500/10">View Payouts</Button>
          </Link>
        </div>
      )}

      {/* Plan banner (if free) */}
      {creator.plan === 'free' && (
        <div className="bg-gold/10 border border-gold/20 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-syne font-semibold text-ivory text-sm">Upgrade to Creator Pro</p>
            <p className="text-xs text-ivory-dim">Unlock tips, priority placement, unlimited AI, and more.</p>
          </div>
          <Link href="/dashboard/earnings">
            <Button variant="gold" size="sm">Upgrade — R99/mo</Button>
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {stats.map(stat => (
          <div key={stat.label} className="bg-black-card border border-white/5 rounded-xl p-4">
            <p className="text-2xl mb-2">{stat.icon}</p>
            <p className="font-syne font-bold text-2xl text-ivory">{stat.value}</p>
            <p className="text-xs text-ivory-dim mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          { href: '/dashboard/upload', label: 'Upload Work', icon: '⬆️' },
          { href: '/dashboard/analytics', label: 'View Analytics', icon: '📈' },
          { href: '/dashboard/ai-assistant', label: 'AI Assistant', icon: '🤖' },
          { href: '/collabs', label: 'Collab Board', icon: '🤝' },
        ].map(action => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-2 p-4 bg-black-card border border-white/5 rounded-xl hover:border-gold/20 hover:bg-black-hover transition-all text-center"
          >
            <span className="text-2xl">{action.icon}</span>
            <span className="text-sm font-syne text-ivory-mid">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Quick note */}
      <DashboardQuickNote creatorId={creator.id} creatorName={creator.display_name} creatorAvatar={creator.avatar_url} />

      {/* Recent works */}
      {recentWorks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-syne font-semibold text-ivory">Recent Works</h2>
            <Link href="/dashboard/works" className="text-sm text-gold hover:text-gold-light transition-colors">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {recentWorks.map((work, i) => <WorkCard key={work.id} work={work} index={i} />)}
          </div>
        </div>
      )}
    </div>
  )
}
