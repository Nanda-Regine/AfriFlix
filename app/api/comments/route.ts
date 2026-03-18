import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCsrfSafe } from '@/lib/csrf'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const workId = searchParams.get('work_id')
  if (!workId) return NextResponse.json({ error: 'work_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('comments')
    .select(`
      id, content, timestamp_ref, heart_count, created_at, parent_id,
      user:creators!inner(display_name, username, avatar_url)
    `)
    .eq('work_id', workId)
    .is('parent_id', null)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  if (!isCsrfSafe(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { work_id, content, parent_id, timestamp_ref } = await req.json()
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!work_id || !UUID_RE.test(work_id)) {
    return NextResponse.json({ error: 'Valid work_id required' }, { status: 400 })
  }
  if (!content?.trim()) {
    return NextResponse.json({ error: 'content required' }, { status: 400 })
  }
  if (parent_id && !UUID_RE.test(parent_id)) {
    return NextResponse.json({ error: 'Invalid parent_id' }, { status: 400 })
  }
  // Strip HTML tags to prevent stored XSS
  const sanitized = content.replace(/<[^>]*>/g, '').trim()
  if (!sanitized) return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 })
  if (sanitized.length > 1000) {
    return NextResponse.json({ error: 'Comment too long (max 1000 chars)' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({ work_id, user_id: user.id, content: sanitized, parent_id: parent_id ?? null, timestamp_ref: timestamp_ref ?? null })
    .select(`
      id, content, timestamp_ref, heart_count, created_at, parent_id,
      user:creators!inner(display_name, username, avatar_url)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Increment comment_count on the work
  await supabase.rpc('increment_comment_count', { work_id_input: work_id })

  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: Request) {
  if (!isCsrfSafe(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const commentId = searchParams.get('id')
  if (!commentId) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id) // RLS enforced + double-check

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
