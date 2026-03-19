import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCsrfSafe } from '@/lib/csrf'

const HEADERS = { 'Cache-Control': 'no-store' }

// GET /api/notes?creator_id=xxx&limit=10&offset=0
export async function GET(req: Request) {
  const url = new URL(req.url)
  const creatorId = url.searchParams.get('creator_id')
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '10'), 30)
  const offset = Number(url.searchParams.get('offset') ?? '0')

  if (!creatorId) return NextResponse.json({ error: 'creator_id required' }, { status: 400, headers: HEADERS })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('creator_notes')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: HEADERS })
  return NextResponse.json({ notes: data ?? [] }, { headers: HEADERS })
}

// POST /api/notes — create a note
export async function POST(req: Request) {
  if (!isCsrfSafe(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: HEADERS })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: HEADERS })

  const { data: creator } = await supabase
    .from('creators').select('id').eq('user_id', user.id).single()
  if (!creator) return NextResponse.json({ error: 'No creator profile' }, { status: 404, headers: HEADERS })

  let body: { content?: string; image_url?: string; link_url?: string; link_title?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: HEADERS }) }

  const content = (body.content ?? '').trim()
  if (!content || content.length > 1000) {
    return NextResponse.json({ error: 'Content must be 1–1000 characters' }, { status: 400, headers: HEADERS })
  }

  const { data, error } = await supabase
    .from('creator_notes')
    .insert({
      creator_id: creator.id,
      content,
      image_url: body.image_url ?? null,
      link_url: body.link_url ?? null,
      link_title: body.link_title ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: HEADERS })
  return NextResponse.json({ note: data }, { status: 201, headers: HEADERS })
}

// DELETE /api/notes?id=xxx
export async function DELETE(req: Request) {
  if (!isCsrfSafe(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: HEADERS })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: HEADERS })

  const { data: creator } = await supabase
    .from('creators').select('id').eq('user_id', user.id).single()
  if (!creator) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: HEADERS })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400, headers: HEADERS })

  await supabase
    .from('creator_notes')
    .delete()
    .eq('id', id)
    .eq('creator_id', creator.id)

  return NextResponse.json({ ok: true }, { headers: HEADERS })
}
