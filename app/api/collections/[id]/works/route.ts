import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCsrfSafe } from '@/lib/csrf'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// POST /api/collections/[id]/works  { work_id }  — add work to collection
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isCsrfSafe(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: collectionId } = await params
  if (!UUID_RE.test(collectionId)) return NextResponse.json({ error: 'Invalid collection' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { work_id } = await req.json()
  if (!work_id || !UUID_RE.test(work_id)) return NextResponse.json({ error: 'Valid work_id required' }, { status: 400 })

  // Verify collection belongs to user
  const { data: col } = await supabase
    .from('collections')
    .select('id, work_count')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .single()

  if (!col) return NextResponse.json({ error: 'Collection not found' }, { status: 404 })

  const { error } = await supabase
    .from('collection_works')
    .insert({ collection_id: collectionId, work_id, position: (col.work_count ?? 0) + 1 })

  if (error && error.code !== '23505') { // ignore duplicate
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Increment work_count
  await supabase
    .from('collections')
    .update({ work_count: (col.work_count ?? 0) + 1 })
    .eq('id', collectionId)

  return NextResponse.json({ ok: true })
}

// DELETE /api/collections/[id]/works?work_id=... — remove work from collection
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isCsrfSafe(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: collectionId } = await params
  const { searchParams } = new URL(req.url)
  const work_id = searchParams.get('work_id')

  if (!UUID_RE.test(collectionId) || !work_id || !UUID_RE.test(work_id)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // Verify ownership
  const { data: col } = await supabase
    .from('collections')
    .select('id, work_count')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .single()

  if (!col) return NextResponse.json({ error: 'Collection not found' }, { status: 404 })

  await supabase
    .from('collection_works')
    .delete()
    .eq('collection_id', collectionId)
    .eq('work_id', work_id)

  await supabase
    .from('collections')
    .update({ work_count: Math.max(0, (col.work_count ?? 1) - 1) })
    .eq('id', collectionId)

  return NextResponse.json({ ok: true })
}
