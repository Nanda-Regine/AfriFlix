import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor') // ISO timestamp for pagination
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 50)

  let query = supabase
    .from('activity_feed')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (cursor) query = query.lt('created_at', cursor)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mark returned items as read in background
  const ids = (data ?? []).map((item: { id: string }) => item.id)
  if (ids.length > 0) {
    supabase.from('activity_feed').update({ is_read: true }).in('id', ids)
      .then(() => {}) // fire-and-forget
  }

  const nextCursor = data && data.length === limit
    ? data[data.length - 1].created_at
    : null

  return NextResponse.json({ items: data ?? [], nextCursor })
}
