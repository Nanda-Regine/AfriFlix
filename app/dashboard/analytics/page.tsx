import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCount } from '@/lib/utils'
import type { Work } from '@/types'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creator } = await supabase.from('creators').select('*').eq('user_id', user.id).single()
  if (!creator) return <p className="text-ivory-dim">No creator profile found.</p>

  const { data: works } = await supabase
    .from('works')
    .select('id, title, category, view_count, heart_count, comment_count, share_count, published_at')
    .eq('creator_id', creator.id)
    .eq('status', 'published')
    .order('view_count', { ascending: false })
    .limit(20)

  const typedWorks = (works as Work[]) ?? []
  const totalViews = typedWorks.reduce((s, w) => s + w.view_count, 0)
  const totalHearts = typedWorks.reduce((s, w) => s + w.heart_count, 0)

  return (
    <div className="max-w-4xl">
      <h1 className="font-syne font-bold text-2xl text-ivory mb-8">Analytics</h1>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total Views', value: formatCount(totalViews) },
          { label: 'Total Hearts', value: formatCount(totalHearts) },
          { label: 'Works Published', value: typedWorks.length },
          { label: 'Followers', value: formatCount(creator.follower_count) },
        ].map(stat => (
          <div key={stat.label} className="bg-black-card border border-white/5 rounded-xl p-5">
            <p className="font-syne font-bold text-3xl text-gold">{stat.value}</p>
            <p className="text-xs text-ivory-dim mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Top works table */}
      <div className="bg-black-card border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="font-syne font-semibold text-ivory">Top Performing Works</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-xs font-mono text-ivory-dim uppercase tracking-wider">Title</th>
                <th className="text-left px-5 py-3 text-xs font-mono text-ivory-dim uppercase tracking-wider">Category</th>
                <th className="text-right px-5 py-3 text-xs font-mono text-ivory-dim uppercase tracking-wider">Views</th>
                <th className="text-right px-5 py-3 text-xs font-mono text-ivory-dim uppercase tracking-wider">Hearts</th>
              </tr>
            </thead>
            <tbody>
              {typedWorks.map(work => (
                <tr key={work.id} className="border-b border-white/5 hover:bg-black-hover transition-colors">
                  <td className="px-5 py-3 text-ivory font-syne">{work.title}</td>
                  <td className="px-5 py-3 text-ivory-dim capitalize">{work.category.replace('_', ' ')}</td>
                  <td className="px-5 py-3 text-right font-mono text-ivory">{formatCount(work.view_count)}</td>
                  <td className="px-5 py-3 text-right font-mono text-terra-light">{formatCount(work.heart_count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {typedWorks.length === 0 && (
            <div className="text-center py-12 text-ivory-dim text-sm">
              No published works yet. Upload something to see analytics.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
