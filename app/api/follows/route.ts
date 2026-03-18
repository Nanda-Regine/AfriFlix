import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/follows  { creator_id }  → toggle follow, returns { following: bool, count: number }
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { creator_id } = await req.json()
  if (!creator_id) return NextResponse.json({ error: 'creator_id required' }, { status: 400 })

  const { data: existing } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_creator_id', creator_id)
    .maybeSingle()

  if (existing) {
    await supabase.from('follows').delete()
      .eq('follower_id', user.id)
      .eq('following_creator_id', creator_id)
  } else {
    await supabase.from('follows').insert({ follower_id: user.id, following_creator_id: creator_id })
  }

  const { data: creator } = await supabase
    .from('creators')
    .select('follower_count')
    .eq('id', creator_id)
    .single()

  return NextResponse.json({ following: !existing, count: creator?.follower_count ?? 0 })
}

// GET /api/follows?creator_id=...  → { following: bool }
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const creator_id = searchParams.get('creator_id')
  if (!creator_id) return NextResponse.json({ following: false })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ following: false })

  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_creator_id', creator_id)
    .maybeSingle()

  return NextResponse.json({ following: !!data })
}
