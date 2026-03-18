import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createLiveInput } from '@/lib/cloudflare'
import { isCsrfSafe } from '@/lib/csrf'

// POST /api/live  { title, description, category }  — create live stream
export async function POST(req: Request) {
  if (!isCsrfSafe(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: creator } = await supabase
    .from('creators')
    .select('id, plan')
    .eq('user_id', user.id)
    .single()

  if (!creator) return NextResponse.json({ error: 'Creator profile required' }, { status: 403 })
  // Live streaming is Creator Pro+
  if (creator.plan === 'free') return NextResponse.json({ error: 'Creator Pro required for live streaming' }, { status: 403 })

  const { title, description, category } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  try {
    const { uid, rtmpsUrl, rtmpsKey, webRtcUrl } = await createLiveInput({
      name: title.trim(),
      creatorId: creator.id,
    })

    const { data: stream, error } = await supabase
      .from('live_streams')
      .insert({
        creator_id: creator.id,
        title: title.trim(),
        description: description?.trim() || null,
        category: category || null,
        cloudflare_live_uid: uid,
        rtmps_url: rtmpsUrl,
        rtmps_key: rtmpsKey,
        webrtc_url: webRtcUrl,
        status: 'idle',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(stream, { status: 201 })
  } catch (err) {
    console.error('[live/create]', err)
    return NextResponse.json({ error: 'Failed to create live stream' }, { status: 502 })
  }
}

// GET /api/live — list active live streams
export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('live_streams')
    .select('*, creator:creators(display_name, username, avatar_url)')
    .eq('status', 'live')
    .order('viewer_count', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
