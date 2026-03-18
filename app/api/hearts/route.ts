import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCsrfSafe } from '@/lib/csrf'

// POST   /api/hearts  { work_id }  → toggle heart, returns { hearted: bool, count: number }
export async function POST(req: Request) {
  if (!isCsrfSafe(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { work_id } = await req.json()
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!work_id || !UUID_RE.test(work_id)) {
    return NextResponse.json({ error: 'Valid work_id required' }, { status: 400 })
  }

  // Check if already hearted
  const { data: existing } = await supabase
    .from('hearts')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('work_id', work_id)
    .maybeSingle()

  if (existing) {
    // Un-heart
    await supabase.from('hearts').delete().eq('user_id', user.id).eq('work_id', work_id)
  } else {
    // Heart
    await supabase.from('hearts').insert({ user_id: user.id, work_id })
  }

  // Return fresh count
  const { data: work } = await supabase
    .from('works')
    .select('heart_count')
    .eq('id', work_id)
    .single()

  return NextResponse.json({ hearted: !existing, count: work?.heart_count ?? 0 })
}

// GET /api/hearts?work_id=...&user_id=...  → { hearted: bool }
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const work_id = searchParams.get('work_id')
  if (!work_id) return NextResponse.json({ hearted: false })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ hearted: false })

  const { data } = await supabase
    .from('hearts')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('work_id', work_id)
    .maybeSingle()

  return NextResponse.json({ hearted: !!data })
}
