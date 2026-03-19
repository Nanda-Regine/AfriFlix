import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/security'

const NO_STORE = { 'Cache-Control': 'no-store' }
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())

async function requireAdmin(): Promise<{ userId: string } | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: NO_STORE })
  }
  return { userId: user.id }
}

// GET /api/admin/verify?status=pending
export async function GET(req: Request) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'pending'

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('verification_requests')
    .select(`
      id, method, status, notes, social_proof_url, submitted_at,
      creator:creators(id, display_name, username, avatar_url, country, categories)
    `)
    .eq('status', status)
    .order('submitted_at', { ascending: true })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE })
  return NextResponse.json(data ?? [], { headers: NO_STORE })
}

// PATCH /api/admin/verify  { id, status: 'approved'|'rejected', admin_notes? }
export async function PATCH(req: Request) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const body = await req.json().catch(() => null)
  if (!body?.id || !isValidUUID(body.id)) {
    return NextResponse.json({ error: 'Valid request id required' }, { status: 400, headers: NO_STORE })
  }
  if (!['approved', 'rejected'].includes(body.status)) {
    return NextResponse.json({ error: 'Status must be approved or rejected' }, { status: 400, headers: NO_STORE })
  }

  const supabase = await createClient()

  // Update the verification request
  const { data: request, error: reqErr } = await supabase
    .from('verification_requests')
    .update({
      status: body.status,
      admin_notes: body.admin_notes ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', body.id)
    .select('creator_id')
    .single()

  if (reqErr || !request) {
    return NextResponse.json({ error: reqErr?.message ?? 'Not found' }, { status: 500, headers: NO_STORE })
  }

  // If approved, mark creator as african_verified
  if (body.status === 'approved') {
    await supabase
      .from('creators')
      .update({ african_verified: true })
      .eq('id', request.creator_id)

    // Notify the creator
    const { data: creator } = await supabase
      .from('creators')
      .select('user_id')
      .eq('id', request.creator_id)
      .single()

    if (creator?.user_id) {
      await supabase.from('notifications').insert({
        user_id: creator.user_id,
        type: 'badge_awarded',
        title: 'African Verified — you\'re official!',
        body: 'Your African identity has been verified. Your profile now shows the African Verified badge.',
      })
    }
  }

  return NextResponse.json({ ok: true }, { headers: NO_STORE })
}
