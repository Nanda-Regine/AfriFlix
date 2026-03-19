import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const HEADERS = { 'Cache-Control': 'no-store' }

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ notifications: [], unread: 0 }, { headers: HEADERS })

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  const notifications = data ?? []
  const unread = notifications.filter(n => !n.is_read).length

  return NextResponse.json({ notifications, unread }, { headers: HEADERS })
}

// PATCH /api/notifications — mark all as read
export async function PATCH() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: HEADERS })

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return NextResponse.json({ ok: true }, { headers: HEADERS })
}
