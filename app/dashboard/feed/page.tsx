import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ActivityFeed } from '@/components/community/activity-feed'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Unread count for badge
  const { count: unreadCount } = await supabase
    .from('activity_feed')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-syne font-bold text-2xl text-ivory">
          Your Feed
          {(unreadCount ?? 0) > 0 && (
            <span className="ml-3 text-xs font-mono bg-gold text-black px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </h1>
      </div>

      <ActivityFeed />
    </div>
  )
}
